import * as React from "react";
import { cn } from "@/user/ui/lib/cn";

type TabsProps = {
  value: string;
  onValueChange: (v: string) => void;
  items: Array<{ value: string; label: string }>;
  className?: string;
};

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <div className={cn("ui-tabs", className)} role="tablist" aria-label="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          className={cn("ui-tab", value === it.value && "ui-tab-active")}
          onClick={() => onValueChange(it.value)}
          type="button"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
