import * as React from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  children: React.ReactNode;
  offset?: number;
};

export function Tooltip({ label, children, offset = 10 }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const compute = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: Math.max(8, r.top - offset),
      left: Math.min(window.innerWidth - 12, r.left + r.width / 2),
    });
  };

  React.useEffect(() => {
    if (!open) return;
    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
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
      className="inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && pos
        ? createPortal(
            <div className="ui-tooltip" style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}>
              {label}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
