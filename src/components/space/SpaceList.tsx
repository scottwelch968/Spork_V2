import { useNavigate } from 'react-router-dom';
import { Star, Archive, ArchiveRestore, MoreHorizontal, Boxes, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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

interface SpaceListProps {
  spaces: Space[];
  assignments: SpaceAssignment[];
  currentUserId: string;
  onPin: (spaceId: string) => void;
  onArchive: (spaceId: string) => void;
  onChangeColor: (spaceId: string, colorCode: string) => void;
  emptyTitle?: string;
  emptyIcon?: LucideIcon;
}

export function SpaceList({
  spaces,
  assignments,
  currentUserId,
  onPin,
  onArchive,
  onChangeColor,
  emptyTitle = "No Spaces",
  emptyIcon: EmptyIcon = Boxes,
}: SpaceListProps) {
  const navigate = useNavigate();

  if (spaces.length === 0) {
    return (
      <div className="ui-table-list-container">
        <div className="ui-table-list-empty">
          <EmptyIcon className="ui-table-list-empty-icon" strokeWidth={1} />
          <p className="ui-table-list-empty-title">{emptyTitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-table-list-container">
      {/* Header Row */}
      <div className="ui-table-list-header">
        <div className="ui-table-list-header-title">Space</div>
        <div className="ui-table-list-header-time">Last Activity</div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {spaces.map((space) => {
          const assignment = assignments.find((a) => a.space_id === space.id);
          const isPinned = assignment?.is_pinned || false;

          return (
            <div
              key={space.id}
              onClick={() => navigate(`/workspace/${space.id}`)}
              className="ui-table-list-row group"
            >
              {/* Left Icon */}
              <div className="ui-table-list-icon text-teal-600">
                <Boxes className="ui-table-list-icon-inner" />
              </div>
              
              {/* Content */}
              <div className="ui-table-list-content">
                <p className="ui-table-list-title">{space.name}</p>
                <p className="ui-table-list-desc">{space.description || 'No description'}</p>
              </div>
              
              {/* Time */}
              <div className="ui-table-list-time">
                {space.last_activity_at 
                  ? format(new Date(space.last_activity_at), 'MMM d, yyyy')
                  : 'No activity'}
              </div>
              
              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="ui-table-list-actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {space.is_default ? (
                    <DropdownMenuItem disabled>
                      <Star className="h-4 w-4 mr-2 fill-yellow-500 text-yellow-500" />
                      Always Pinned
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onPin(space.id)}>
                      <Star className={`h-4 w-4 mr-2 ${isPinned ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      {isPinned ? 'Unpin' : 'Pin to Favorites'}
                    </DropdownMenuItem>
                  )}
                  {!space.is_default && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onArchive(space.id)}>
                        {space.is_archived ? (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
