import * as React from "react";
import { cn } from "@/user/ui/lib/cn";

export type SidebarItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

type SidebarSection = {
  title?: string;
  items: SidebarItem[];
};

type SidebarProps = {
  title?: string;
  sections: SidebarSection[];
  className?: string;
};

export function Sidebar({ title, sections, className }: SidebarProps) {
  return (
    <aside className={cn("ui-sidebar flex flex-col h-full overflow-y-auto", className)}>
      {title ? <div className="px-4 pt-4 pb-2 text-sm font-semibold text-fg/90">{title}</div> : null}

      {sections.map((sec, idx) => (
        <div key={idx}>
          {sec.title ? <div className="ui-sidebar-section-title">{sec.title}</div> : null}
          <nav className="space-y-0.5 px-2">
            {sec.items.map((it) => {
              const El = it.href ? "a" : "button";
              return (
                <El
                  key={it.id}
                  href={it.href}
                  onClick={it.onClick}
                  className={cn("ui-sidebar-item w-full text-left", it.active && "ui-sidebar-item-active")}
                >
                  {it.icon ? <span className="w-5 h-5 flex items-center justify-center">{it.icon}</span> : null}
                  <span className="flex-1 truncate">{it.label}</span>
                </El>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
