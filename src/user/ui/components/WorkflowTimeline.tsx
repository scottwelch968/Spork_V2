import * as React from "react";
import { cn } from "@/user/ui/lib/cn";

export type WorkflowStatus = "pending" | "active" | "complete" | "error";

export type WorkflowStep = {
  id: string;
  label: string;
  description?: string;
  status: WorkflowStatus;
  output?: React.ReactNode;
};

export function WorkflowTimeline({
  title = "COSMO workflow",
  steps,
  className,
}: {
  title?: string;
  steps: WorkflowStep[];
  className?: string;
}) {
  const dot = (s: WorkflowStatus) =>
    cn(
      "ui-workflow-dot",
      s === "active" && "ui-workflow-dot-active",
      s === "complete" && "ui-workflow-dot-complete",
      s === "error" && "ui-workflow-dot-error"
    );

  return (
    <div className={cn("ui-workflow", className)}>
      <div className="mb-4 text-sm font-semibold text-fg/90">{title}</div>

      <div className="space-y-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="ui-workflow-step">
            <div className="ui-workflow-rail">
              <div className={dot(step.status)} />
              {idx < steps.length - 1 ? <div className="ui-workflow-line" /> : null}
            </div>

            <div className="ui-workflow-body">
              <div className="ui-workflow-label">{step.label}</div>
              {step.description ? <div className="ui-workflow-desc">{step.description}</div> : null}
              {step.output ? <div className="ui-workflow-output">{step.output}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
