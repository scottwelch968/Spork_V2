import { SpaceCard, ColorTheme } from './SpaceCard';
import { Boxes, Plus, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Strict color themes mapped by color name - Variation 2
const COLOR_THEME_MAP: Record<string, ColorTheme> = {
  blue: { gradient: 'from-blue-50 to-blue-100', circle: 'bg-blue-200', accentCircle: 'bg-blue-300', icon: 'text-blue-600' },
  gray: { gradient: 'from-gray-50 to-gray-100', circle: 'bg-gray-200', accentCircle: 'bg-gray-300', icon: 'text-gray-600' },
  red: { gradient: 'from-red-50 to-red-100', circle: 'bg-red-200', accentCircle: 'bg-red-300', icon: 'text-red-600' },
  green: { gradient: 'from-green-50 to-green-100', circle: 'bg-green-200', accentCircle: 'bg-green-300', icon: 'text-green-600' },
  yellow: { gradient: 'from-yellow-50 to-yellow-100', circle: 'bg-yellow-200', accentCircle: 'bg-yellow-300', icon: 'text-yellow-600' },
  pink: { gradient: 'from-pink-50 to-pink-100', circle: 'bg-pink-200', accentCircle: 'bg-pink-300', icon: 'text-pink-600' },
};

interface Space {
  id: string;
  name: string;
  description: string | null;
  color_code: string | null;
  owner_id: string;
  last_activity_at: string | null;
  is_archived: boolean;
  is_default?: boolean;
}

interface SpaceAssignment {
  space_id: string;
  is_pinned: boolean;
}

interface SpaceGridProps {
  spaces: Space[];
  assignments: SpaceAssignment[];
  currentUserId: string;
  onPin: (spaceId: string) => void;
  onArchive: (spaceId: string) => void;
  onChangeColor: (spaceId: string, colorCode: string) => void;
  onCreateSpace?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  showCreateButton?: boolean;
}

export function SpaceGrid({
  spaces,
  assignments,
  currentUserId,
  onPin,
  onArchive,
  onChangeColor,
  onCreateSpace,
  emptyTitle = "Get started by creating a new Space",
  emptyDescription = "Spaces are projects where you can save chats, upload files, and collaborate with others",
  emptyIcon: EmptyIcon = Boxes,
  showCreateButton = true,
}: SpaceGridProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyIcon className="h-16 w-16 text-gray-300 mb-4" strokeWidth={1} />
        <h3 className="text-lg font-medium text-gray-900">
          {emptyTitle}
        </h3>
        {emptyDescription && (
          <p className="text-muted-foreground max-w-md mt-2 mb-6">
            {emptyDescription}
          </p>
        )}
        {showCreateButton && onCreateSpace && (
          <Button onClick={onCreateSpace} className="gap-2 mt-4">
            <Plus className="h-4 w-4" />
            Create Space
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {spaces.map((space, index) => {
        const assignment = assignments.find((a) => a.space_id === space.id);
        // Use space color_code from database, fallback to blue if not set
        const colorTheme = space.color_code && COLOR_THEME_MAP[space.color_code]
          ? COLOR_THEME_MAP[space.color_code]
          : COLOR_THEME_MAP.blue;
        return (
          <SpaceCard
            key={space.id}
            space={space}
            isOwner={space.owner_id === currentUserId}
            isPinned={assignment?.is_pinned || false}
            memberCount={1} // TODO: Calculate actual member count
            colorTheme={colorTheme}
            onPin={() => onPin(space.id)}
            onArchive={() => onArchive(space.id)}
            onChangeColor={(colorCode) => onChangeColor(space.id, colorCode)}
          />
        );
      })}
    </div>
  );
}
