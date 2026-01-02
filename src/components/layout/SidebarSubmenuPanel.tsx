import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SubmenuItem {
  label: string;
  path?: string;
  external?: boolean;
  onClick?: () => void;
}

interface SidebarSubmenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  activeIcon?: LucideIcon;
  sidebarWidth: number;
  items: SubmenuItem[];
}

export function SidebarSubmenuPanel({
  isOpen,
  onClose,
  activeSection,
  activeIcon: Icon,
  sidebarWidth,
  items,
}: SidebarSubmenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed top-0 h-screen w-[220px] bg-sidebar border-r border-sidebar-border shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] z-40 transition-all duration-200 ease-out",
        isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
      )}
      style={{ left: `${sidebarWidth}px` }}
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div className="h-[48px] flex items-center gap-2 px-4 border-b border-sidebar-border">
        {Icon && <Icon className="h-4 w-4 text-sidebar-foreground" />}
        <span className="font-medium text-sm text-sidebar-foreground">{activeSection}</span>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {items.length > 0 ? (
          items.map((item, index) => {
            if (item.external) {
              return (
                <a
                  key={index}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
                >
                  {item.label}
                </a>
              );
            }

            if (item.path) {
              return (
                <Link
                  key={index}
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover transition-colors w-full text-left"
              >
                {item.label}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground italic">
            No items yet
          </div>
        )}
      </nav>
    </div>
  );
}
