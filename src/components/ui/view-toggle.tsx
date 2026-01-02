import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

/**
 * ViewToggle - Grid/List view mode toggle
 * 
 * GOLDEN STYLE GUIDE STANDARD:
 * - Border radius: rounded-lg
 * - Border color: border-gray-200
 * - Background: bg-white
 * - Active state: bg-muted
 */
export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn("ui-view-toggle", className)}>
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        className={cn("ui-view-toggle-btn", viewMode === 'grid' && "ui-view-toggle-btn-active")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        className={cn("ui-view-toggle-btn", viewMode === 'list' && "ui-view-toggle-btn-active")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
