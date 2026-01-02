import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  const logger = createLogger('manage-email-rule');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, rule_id, data, sample_event } = await req.json();

    switch (action) {
      case "create": {
        const { data: rule, error } = await supabase
          .from("email_rules")
          .insert({
            ...data,
            created_by: req.headers.get("user-id"),
          })
          .select("*, email_templates(*)")
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(rule), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { data: rule, error } = await supabase
          .from("email_rules")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rule_id)
          .select("*, email_templates(*)")
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(rule), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabase
          .from("email_rules")
          .delete()
          .eq("id", rule_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_status": {
        const { data: rule, error } = await supabase
          .from("email_rules")
          .update({ status: data.status })
          .eq("id", rule_id)
          .select("*, email_templates(*)")
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(rule), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "test": {
        // Simulate rule execution without actually sending
        const { data: rule } = await supabase
          .from("email_rules")
          .select("*, email_templates(*)")
          .eq("id", rule_id)
          .single();

        if (!rule) throw createCosmoError('INVALID_PAYLOAD', 'Rule not found');

        const testResult = {
          rule_name: rule.name,
          event_type: rule.event_type,
          template: rule.email_templates?.name,
          conditions_evaluated: rule.conditions || [],
          would_send_to: [] as string[],
          simulation: true,
        };

        // Evaluate conditions with sample event
        if (rule.conditions && rule.conditions.length > 0) {
          testResult.conditions_evaluated = rule.conditions.map((cond: any) => ({
            ...cond,
            result: evaluateCondition(cond, sample_event?.data || {}),
          }));
        }

        // Determine recipients
        if (rule.recipient_type === "user") {
          testResult.would_send_to.push(sample_event?.user?.email || "user@example.com");
        }
        if (rule.recipient_type === "admin" || rule.recipient_type === "both") {
          testResult.would_send_to.push("admin@example.com");
        }
        if (rule.recipient_type === "custom" && rule.recipient_emails) {
          testResult.would_send_to.push(...rule.recipient_emails);
        }

        return new Response(JSON.stringify(testResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        let query = supabase
          .from("email_rules")
          .select("*, email_templates(name, status)")
          .order("priority", { ascending: true });

        if (data?.event_type) {
          query = query.eq("event_type", data.event_type);
        }

        if (data?.status) {
          query = query.eq("status", data.status);
        }

        const { data: rules, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(rules), {
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

function evaluateCondition(condition: any, data: Record<string, any>): boolean {
  const { field, operator, value } = condition;
  const fieldValue = data[field];

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    case "contains":
      return String(fieldValue).includes(value);
    case "not_contains":
      return !String(fieldValue).includes(value);
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return true;
  }
}
