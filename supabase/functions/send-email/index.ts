import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  template_id?: string;
  variables?: Record<string, any>;
  cc?: string[];
  bcc?: string[];
}

serve(async (req: Request) => {
  const logger = createLogger('send-email');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emailData: EmailRequest = await req.json();
    
    // If template_id provided, fetch and render template
    let subject = emailData.subject;
    let html = emailData.html;
    let text = emailData.text;

    if (emailData.template_id) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", emailData.template_id)
        .single();

      if (templateError || !template) {
        throw createCosmoError('INVALID_PAYLOAD', 'Template not found');
      }

      // Substitute variables
      const variables = emailData.variables || {};
      subject = substituteVariables(template.subject_template, variables);
      html = substituteVariables(template.html_content, variables);
      text = template.text_content ? substituteVariables(template.text_content, variables) : undefined;
    }

    if (!subject || !html) {
      throw createCosmoError('INVALID_PAYLOAD', 'Email subject and content are required');
    }
    
    // Initialize Resend with API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw createCosmoError('CONFIG_MISSING', 'RESEND_API_KEY not configured');
    }

    logger.info('Sending email via Resend', { to: Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to });

    let result;
    let emailLogStatus = "pending";
    let errorMessage = null;

    try {
      // Use Resend API directly via fetch for reliability
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailData.from || "Spork <onboarding@resend.dev>",
          to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
          subject: subject,
          html: html,
          text: text,
          reply_to: emailData.replyTo,
        }),
      });

      result = await response.json();

      if (!response.ok) {
        throw createCosmoError('FUNCTION_FAILED', result.message || `Resend API error: ${response.status}`);
      }
      
      logger.info("Email sent successfully", { result });
      emailLogStatus = "sent";
    } catch (error: any) {
      logger.error("Email send error", { error: error.message });
      emailLogStatus = "failed";
      errorMessage = error.message;
      result = { error: error.message };
    }

    // Log email
    await supabase.from("email_logs").insert({
      recipient_email: Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to,
      subject: subject,
      status: emailLogStatus,
      error_message: errorMessage,
      metadata: result,
    });

    if (emailLogStatus === "failed") {
      throw createCosmoError('FUNCTION_FAILED', errorMessage || 'Failed to send email');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.fail(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function substituteVariables(template: string, variables: Record<string, any>): string {
  let result = template;

  // Replace {{variable}} or {{variable|default}}
  result = result.replace(/\{\{([^}|]+)(?:\|([^}]+))?\}\}/g, (match, key, defaultValue) => {
    const value = variables[key.trim()];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return defaultValue ? defaultValue.trim() : match;
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = variables[key.trim()];
    return value ? content : "";
  });

  return result;
}
