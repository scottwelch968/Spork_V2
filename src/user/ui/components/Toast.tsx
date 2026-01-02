import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/user/ui/lib/cn";

export type ToastVariant = "default" | "success" | "error";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="ui-toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "ui-toast animate-fade-up",
            t.variant === "success" && "ui-toast-success",
            t.variant === "error" && "ui-toast-error"
          )}
          role="alert"
        >
          <div className="flex-1">
            <div className="ui-toast-title">{t.title}</div>
            {t.description ? <div className="ui-toast-desc">{t.description}</div> : null}
          </div>
          <button className="text-muted-fg hover:text-fg" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
