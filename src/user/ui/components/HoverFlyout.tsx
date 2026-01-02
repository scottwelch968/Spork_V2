import * as React from "react";
import { cn } from "@/user/ui/lib/cn";

type HoverFlyoutProps = {
  trigger: React.ReactNode;              // usually an icon button
  panel: React.ReactNode;                // menu contents
  sideOffset?: number;                   // px
  alignOffset?: number;                  // px
  openDelay?: number;                    // ms
  closeDelay?: number;                   // ms
  className?: string;
};

/**
 * Perplexity-like icon-rail hover flyout:
 * - Opens on hover (mouseenter) with a small delay
 * - Closes on mouseleave with a small delay
 * - Positions to the right of the trigger using getBoundingClientRect
 */
export function HoverFlyout({
  trigger,
  panel,
  sideOffset = 12,
  alignOffset = -6,
  openDelay = 80,
  closeDelay = 120,
  className,
}: HoverFlyoutProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const openT = React.useRef<number | null>(null);
  const closeT = React.useRef<number | null>(null);

  const clearTimers = () => {
    if (openT.current) window.clearTimeout(openT.current);
    if (closeT.current) window.clearTimeout(closeT.current);
    openT.current = null;
    closeT.current = null;
  };

  const computePos = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: Math.max(8, r.top + alignOffset),
      left: Math.min(window.innerWidth - 12, r.right + sideOffset),
    });
  };

  const scheduleOpen = () => {
    clearTimers();
    openT.current = window.setTimeout(() => {
      computePos();
      setOpen(true);
    }, openDelay);
  };

  const scheduleClose = () => {
    clearTimers();
    closeT.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  React.useEffect(() => {
    if (!open) return;
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      {trigger}

      {open && pos ? (
        <div
          className={cn("ui-flyout-wrap", className)}
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => {
            clearTimers();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <div className={cn("ui-flyout-panel ui-flyout-enter")}>{panel}</div>
        </div>
      ) : null}
    </div>
  );
}
