import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SystemEvent {
  event_type: string;
  event_id?: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

serve(async (req: Request) => {
  const logger = createLogger('process-system-event');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const event: SystemEvent = await req.json();
    logger.info("Processing system event", { eventType: event.event_type });

    const startTime = Date.now();

    // Find active rules for this event type
    const { data: rules, error: rulesError } = await supabase
      .from("email_rules")
      .select("*, email_templates(*)")
      .eq("event_type", event.event_type)
      .eq("status", "active")
      .order("priority", { ascending: true });

    if (rulesError) throw rulesError;

    if (!rules || rules.length === 0) {
      logger.info("No active rules found for event", { eventType: event.event_type });
      return new Response(
        JSON.stringify({ success: true, message: "No rules to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const rule of rules) {
      const ruleStartTime = Date.now();
      
      try {
        // Evaluate conditions
        if (rule.conditions && rule.conditions.length > 0) {
          const conditionsMet = evaluateConditions(rule.conditions, event.data);
          if (!conditionsMet) {
            logger.info('Rule conditions not met, skipping', { ruleName: rule.name });
            await logRuleExecution(supabase, rule, event, "skipped", "Conditions not met");
            continue;
          }
        }

        // Check rate limits
        const rateLimitOk = await checkRateLimits(supabase, rule, event.user.id);
        if (!rateLimitOk) {
          logger.info('Rule rate limit exceeded, skipping', { ruleName: rule.name });
          await logRuleExecution(supabase, rule, event, "skipped", "Rate limit exceeded");
          continue;
        }

        // Determine recipients
        const recipients = await determineRecipients(supabase, rule, event.user);

        // Process each recipient
        for (const recipientEmail of recipients) {
          try {
            // Substitute variables in template
            const variables = {
              ...event.data,
              email: recipientEmail,
              first_name: event.user.first_name || "there",
              company_name: "Spork",
            };

            // Call send-email function
            const { data: sendResult, error: sendError } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  template_id: rule.template_id,
                  to: recipientEmail,
                  variables,
                  cc: rule.cc_emails || [],
                  bcc: rule.bcc_emails || [],
                },
              }
            );

            if (sendError) throw sendError;

            // Log success
            await logRuleExecution(
              supabase,
              rule,
              event,
              "sent",
              null,
              recipientEmail,
              Date.now() - ruleStartTime
            );

            results.push({
              rule: rule.name,
              recipient: recipientEmail,
              status: "sent",
            });

            // Update rule statistics
            await supabase
              .from("email_rules")
              .update({
                trigger_count: rule.trigger_count + 1,
                success_count: rule.success_count + 1,
                last_triggered_at: new Date().toISOString(),
              })
              .eq("id", rule.id);

          } catch (error: any) {
            logger.error('Error sending email', { recipientEmail, error: error.message });
            await logRuleExecution(
              supabase,
              rule,
              event,
              "failed",
              error.message,
              recipientEmail,
              Date.now() - ruleStartTime
            );

            results.push({
              rule: rule.name,
              recipient: recipientEmail,
              status: "failed",
              error: error.message,
            });

            // Update failure count
            await supabase
              .from("email_rules")
              .update({
                trigger_count: rule.trigger_count + 1,
                failure_count: rule.failure_count + 1,
                last_triggered_at: new Date().toISOString(),
              })
              .eq("id", rule.id);
          }
        }
      } catch (error: any) {
        logger.error('Error processing rule', { ruleName: rule.name, error: error.message });
        await logRuleExecution(supabase, rule, event, "failed", error.message);
        results.push({
          rule: rule.name,
          status: "failed",
          error: error.message,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    logger.complete(totalTime, { rulesProcessed: rules.length });

    return new Response(
      JSON.stringify({
        success: true,
        processed: rules.length,
        results,
        processing_time_ms: totalTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

function evaluateConditions(conditions: any[], data: Record<string, any>): boolean {
  for (const condition of conditions) {
    const { field, operator, value, logic = "AND" } = condition;
    const fieldValue = data[field];

    let result = false;
    switch (operator) {
      case "equals":
        result = fieldValue === value;
        break;
      case "not_equals":
        result = fieldValue !== value;
        break;
      case "contains":
        result = String(fieldValue).includes(value);
        break;
      case "not_contains":
        result = !String(fieldValue).includes(value);
        break;
      case "greater_than":
        result = Number(fieldValue) > Number(value);
        break;
      case "less_than":
        result = Number(fieldValue) < Number(value);
        break;
      case "exists":
        result = fieldValue !== undefined && fieldValue !== null;
        break;
      default:
        result = true;
    }

    if (logic === "AND" && !result) return false;
    if (logic === "OR" && result) return true;
  }

  return true;
}

async function checkRateLimits(
  supabase: any,
  rule: any,
  userId: string
): Promise<boolean> {
  // Check daily limit
  if (rule.max_sends_per_user_per_day) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_rule_logs")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id)
      .eq("recipient_email", userId)
      .eq("status", "sent")
      .gte("sent_at", oneDayAgo);

    if (count && count >= rule.max_sends_per_user_per_day) return false;
  }

  // Check weekly limit
  if (rule.max_sends_per_user_per_week) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_rule_logs")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id)
      .eq("recipient_email", userId)
      .eq("status", "sent")
      .gte("sent_at", oneWeekAgo);

    if (count && count >= rule.max_sends_per_user_per_week) return false;
  }

  // Check deduplication window
  if (rule.deduplicate_window_minutes) {
    const windowStart = new Date(
      Date.now() - rule.deduplicate_window_minutes * 60 * 1000
    ).toISOString();
    const { count } = await supabase
      .from("email_rule_logs")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id)
      .eq("recipient_email", userId)
      .eq("status", "sent")
      .gte("sent_at", windowStart);

    if (count && count > 0) return false;
  }

  return true;
}

async function determineRecipients(
  supabase: any,
  rule: any,
  user: any
): Promise<string[]> {
  const recipients: string[] = [];

  if (rule.recipient_type === "user" || rule.recipient_type === "both") {
    recipients.push(user.email);
  }

  if (rule.recipient_type === "admin" || rule.recipient_type === "both") {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("profiles(email)")
      .eq("role", "admin");

    if (admins) {
      for (const admin of admins) {
        if (admin.profiles?.email) {
          recipients.push(admin.profiles.email);
        }
      }
    }
  }

  if (rule.recipient_type === "custom" && rule.recipient_emails) {
    recipients.push(...rule.recipient_emails);
  }

  return [...new Set(recipients)];
}

async function logRuleExecution(
  supabase: any,
  rule: any,
  event: SystemEvent,
  status: string,
  errorMessage?: string | null,
  recipientEmail?: string,
  processingTime?: number
) {
  await supabase.from("email_rule_logs").insert({
    rule_id: rule.id,
    event_type: event.event_type,
    event_id: event.event_id,
    event_payload: event.data,
    recipient_email: recipientEmail || event.user.email,
    template_id: rule.template_id,
    status,
    error_message: errorMessage,
    processing_time_ms: processingTime,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}
