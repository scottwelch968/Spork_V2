import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  const logger = createLogger('manage-email-template');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, template_id, data, variables: previewVars } = await req.json();

    switch (action) {
      case "create": {
        const { data: template, error } = await supabase
          .from("email_templates")
          .insert({
            ...data,
            created_by: req.headers.get("user-id"),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(template), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        // Get current version for history
        const { data: current } = await supabase
          .from("email_templates")
          .select("*")
          .eq("id", template_id)
          .single();

        if (current) {
          // Add current version to history
          const versionHistory = current.version_history || [];
          versionHistory.push({
            version: current.version,
            timestamp: new Date().toISOString(),
            name: current.name,
            subject_template: current.subject_template,
            html_content: current.html_content,
            text_content: current.text_content,
          });

          // Update with new version
          const { data: updated, error } = await supabase
            .from("email_templates")
            .update({
              ...data,
              version: current.version + 1,
              version_history: versionHistory,
              updated_at: new Date().toISOString(),
            })
            .eq("id", template_id)
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify(updated), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        throw createCosmoError('INVALID_PAYLOAD', 'Template not found');
      }

      case "delete": {
        const { error } = await supabase
          .from("email_templates")
          .update({ status: "archived" })
          .eq("id", template_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "duplicate": {
        const { data: original } = await supabase
          .from("email_templates")
          .select("*")
          .eq("id", template_id)
          .single();

        if (!original) throw createCosmoError('INVALID_PAYLOAD', 'Template not found');

        const { data: duplicate, error } = await supabase
          .from("email_templates")
          .insert({
            name: `${original.name} (Copy)`,
            slug: `${original.slug}-copy-${Date.now()}`,
            category: original.category,
            status: "draft",
            subject_template: original.subject_template,
            html_content: original.html_content,
            text_content: original.text_content,
            variables: original.variables,
            created_by: req.headers.get("user-id"),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(duplicate), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "preview": {
        const { data: template } = await supabase
          .from("email_templates")
          .select("*")
          .eq("id", template_id)
          .single();

        if (!template) throw createCosmoError('INVALID_PAYLOAD', 'Template not found');

        // Substitute variables
        const preview = {
          subject: substituteVariables(template.subject_template, previewVars || {}),
          html: substituteVariables(template.html_content, previewVars || {}),
          text: substituteVariables(template.text_content || "", previewVars || {}),
        };

        return new Response(JSON.stringify(preview), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        let query = supabase.from("email_templates").select("*");

        if (data?.category) {
          query = query.eq("category", data.category);
        }

        if (data?.status) {
          query = query.eq("status", data.status);
        }

        query = query.order("created_at", { ascending: false });

        const { data: templates, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(templates), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    }
  } catch (error: any) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
