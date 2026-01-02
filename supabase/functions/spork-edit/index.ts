import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProviderEndpoint, getProviderHeaders, getProviderApiKey } from "../_shared/cosmo/providerConfig.ts";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('spork-edit');
  logger.start();
  const startTime = Date.now();

  try {
    const { messages, userMessage, context, modelId } = await req.json();

    // Get API key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) {
      const error = createCosmoError('CONFIG_MISSING', 'No API key configured');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt for code editing
    const systemPrompt = `You are an expert code editor assistant. You help users modify, create, and improve their code.

When the user asks you to make code changes, respond with a JSON object in this exact format:
{
  "explanation": "Brief explanation of what you're changing and why",
  "changes": [
    {
      "file": "path/to/file.tsx",
      "action": "edit", // or "create" or "delete"
      "content": "// The complete new file content"
    }
  ]
}

When the user asks a question that doesn't require code changes (like explaining something), respond with just plain text.

Guidelines:
- Always provide complete file contents, not partial snippets
- Use TypeScript/React best practices
- Follow existing code conventions when editing files
- Be concise in explanations
- If deleting a file, content can be empty

Current context:
${context || 'No file currently open'}`;

    // Build messages array
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Determine provider and model
    let provider: string;
    let model: string;

    if (modelId && OPENROUTER_API_KEY) {
      // Use OpenRouter with specified model
      provider = 'OpenRouter';
      model = modelId;
    } else {
      // Use Lovable AI Gateway (default/auto)
      provider = 'Lovable AI';
      // Fetch default coding model from database or use fallback
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const { data: codingModel } = await supabase
        .from('ai_models')
        .select('model_id')
        .eq('best_for', 'coding')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      model = codingModel?.model_id || 'google/gemini-2.5-flash';
    }

    const apiUrl = getProviderEndpoint(provider);
    const apiKey = getProviderApiKey(provider);
    
    if (!apiKey) {
      const error = createCosmoError('CONFIG_MISSING', `No API key configured for ${provider}`);
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const headers = getProviderHeaders(provider, apiKey);

    logger.info('Sending request to AI provider', { model, provider });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.2, // Lower temperature for more precise code
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('API error response', { status: response.status, error: errorText });
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        const error = createCosmoError('PAYMENT_REQUIRED');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const error = createCosmoError('FUNCTION_FAILED', `API error: ${response.status}`);
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse as JSON for structured response
    try {
      // Check if response looks like JSON
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('```json')) {
        // Extract JSON from potential markdown code block
        let jsonStr = trimmed;
        if (trimmed.startsWith('```json')) {
          jsonStr = trimmed.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (trimmed.startsWith('```')) {
          jsonStr = trimmed.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.changes && Array.isArray(parsed.changes)) {
          logger.complete(Date.now() - startTime, { changesCount: parsed.changes.length });
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (e) {
      // Not JSON, return as plain text
      logger.debug('Response is plain text, not JSON');
    }

    logger.complete(Date.now() - startTime, { responseType: 'text' });

    // Return as plain text response
    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
