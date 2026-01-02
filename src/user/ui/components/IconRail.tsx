import * as React from "react";
import { cn } from "@/user/ui/lib/cn";
import { Tooltip } from "./Tooltip";
import { HoverFlyout } from "./HoverFlyout";
import { Button } from "./Button";

export type RailItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  flyoutMenu?: React.ReactNode;
};

type IconRailProps = {
  items: RailItem[];
  className?: string;
};

export function IconRail({ items, className }: IconRailProps) {
  return (
    <aside className={cn("ui-rail", className)}>
      {items.map((it) =>
        it.flyoutMenu ? (
          <HoverFlyout
            key={it.id}
            trigger={
              <Button variant="icon" className="ui-rail-btn" aria-label={it.label}>
                {it.icon}
              </Button>
            }
            panel={it.flyoutMenu}
          />
        ) : (
          <Tooltip key={it.id} label={it.label}>
            <Button variant="icon" className="ui-rail-btn" onClick={it.onClick} aria-label={it.label}>
              {it.icon}
            </Button>
          </Tooltip>
        )
      )}
    </aside>
  );
}
