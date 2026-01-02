import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/user/ui/lib/cn";
import { Button } from "./Button";

type DrawerProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Drawer({ open, onOpenChange, title = "Menu", children, className }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="ui-overlay" onClick={() => onOpenChange(false)} />

      {/* Drawer */}
      <aside className={cn("ui-drawer animate-fade-up", className)}>
        <div className="ui-drawer-header">
          <span className="ui-drawer-title">{title}</span>
          <Button variant="icon" className="ui-drawer-close" onClick={() => onOpenChange(false)} aria-label="Close">
            ✕
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">{children}</nav>
      </aside>
    </>,
    document.body
  );
}
