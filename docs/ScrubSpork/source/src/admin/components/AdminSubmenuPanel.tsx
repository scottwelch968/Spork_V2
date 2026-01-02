import { Link } from 'react-router-dom';
import { cn } from '@/admin/lib/utils';
import { useRef } from 'react';
import type { SubmenuItem } from './AdminSidebar';

interface AdminSubmenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  activeIcon?: React.ReactNode;
  sidebarWidth: number;
  items: SubmenuItem[];
}

export function AdminSubmenuPanel({ 
  isOpen, 
  onClose, 
  activeSection,
  activeIcon,
  sidebarWidth,
  items
}: AdminSubmenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={panelRef}
      style={{ left: sidebarWidth }}
      onMouseLeave={onClose}
      className={cn(
        "fixed top-0 h-screen w-64 bg-admin-card border-r border-admin-border shadow-lg z-40",
        "transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible -translate-x-4"
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-admin-border">
        <div className="flex items-center gap-2">
          {activeIcon && (
            <span className="text-admin-accent">{activeIcon}</span>
          )}
          <span className="font-semibold text-admin-text text-sm truncate">{activeSection}</span>
        </div>
      </div>

      {/* Submenu Items */}
      <div className="p-2 space-y-1">
        {items.map((item) => {
          
          if (item.external) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                "text-admin-muted-text hover:bg-admin-muted"
              )}
              >
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                "text-admin-muted-text hover:bg-admin-muted"
              )}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
