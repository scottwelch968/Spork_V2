import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileEntry {
  path: string;
  content: string;
}

serve(async (req) => {
  const logger = createLogger('codesandbox-create');
  const startTime = Date.now();
  logger.start({ method: req.method });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, apiKey } = await req.json() as { files: FileEntry[], apiKey?: string };

    if (!files || !Array.isArray(files) || files.length === 0) {
      logger.warn('No files provided');
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Creating CodeSandbox', { fileCount: files.length });

    // Convert files to CodeSandbox Define API format
    // The Define API expects files as { [path]: { content: string } }
    const sandboxFiles: Record<string, { content: string }> = {};
    
    for (const file of files) {
      // Ensure path starts with /
      const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      sandboxFiles[normalizedPath] = { content: file.content };
    }

    // Check for package.json to extract dependencies
    const packageJsonFile = files.find(f => 
      f.path === 'package.json' || f.path === '/package.json'
    );
    
    let template = 'create-react-app-typescript';
    
    if (packageJsonFile) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        // Detect Vite projects
        if (pkg.devDependencies?.vite || pkg.dependencies?.vite) {
          template = 'vite-react-ts';
        }
      } catch (e) {
        logger.warn('Could not parse package.json', { error: e instanceof Error ? e.message : 'Unknown' });
      }
    }

    // Call CodeSandbox Define API
    // Using the legacy define API which works without authentication for public sandboxes
    const definePayload = {
      files: sandboxFiles,
      template,
    };

    logger.debug('Sending to CodeSandbox Define API', { template });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add API key header if provided for higher rate limits
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      logger.debug('Using authenticated CodeSandbox API request');
    }
    
    const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      method: 'POST',
      headers,
      body: JSON.stringify(definePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('CodeSandbox API error', { status: response.status, error: errorText });
      return new Response(
        JSON.stringify({ error: `CodeSandbox API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    logger.complete(Date.now() - startTime, { sandboxId: result.sandbox_id });

    return new Response(
      JSON.stringify({
        sandbox_id: result.sandbox_id,
        embed_url: `https://codesandbox.io/embed/${result.sandbox_id}?fontsize=14&hidenavigation=1&theme=dark`,
        editor_url: `https://codesandbox.io/s/${result.sandbox_id}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
