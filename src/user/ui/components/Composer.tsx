import * as React from "react";
import { cn } from "@/user/ui/lib/cn";
import { Textarea } from "./Input";
import { Button } from "./Button";

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend?: () => void;
  placeholder?: string;
  actions?: React.ReactNode;
  pills?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  placeholder = "Type a message…",
  actions,
  pills,
  disabled,
  className,
}: ComposerProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && onSend) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={cn("ui-composer", className)}>
      {pills ? <div className="mb-3 flex flex-wrap gap-2">{pills}</div> : null}

      <div className="ui-composer-row">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          {actions ? <div className="ui-composer-actions">{actions}</div> : null}
          <Button variant="primary" onClick={onSend} disabled={disabled || !value.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
