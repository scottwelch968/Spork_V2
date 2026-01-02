import { useState, useMemo, useEffect } from 'react';
import { Boxes, Star, Archive, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { useSpace } from '@/hooks/useSpace';
import { useSpaceAssignments } from '@/hooks/useSpaceAssignments';
import { SpaceList } from '@/components/space/SpaceList';
import { CreateSpaceDialog } from '@/components/space/CreateSpaceDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Spaces() {
  const [activeTab, setActiveTab] = useState('my-spaces');
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get search query from URL params (managed by TopBar)
  const searchQuery = searchParams.get('q') || '';

  // Reset page when tab changes or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Open create dialog when URL has ?create=true (from TopBar button)
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateSpace(true);
      // Remove create param but keep search query
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spaces, isLoading: spacesLoading, createSpace, updateSpace, togglePin, toggleArchive, isCreatingSpace } = useSpace();
  const { assignments } = useSpaceAssignments();

  const currentUserId = user?.id || '';

  // Helper to sort with default workspace first
  const sortWithDefaultFirst = (spaceList: typeof spaces) => {
    if (!spaceList) return [];
    return [...spaceList].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  // Filter spaces for My Spaces tab (owned by current user)
  const mySpaces = useMemo(() => {
    if (!spaces || !currentUserId) return [];

    let filtered = spaces.filter(s => !s.is_archived && s.owner_id === currentUserId);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(query) || 
             (s.description && s.description.toLowerCase().includes(query))
      );
    }

    return sortWithDefaultFirst(filtered);
  }, [spaces, currentUserId, searchQuery]);

  // Filter spaces for Team Spaces tab (not owned by current user)
  const teamSpaces = useMemo(() => {
    if (!spaces || !currentUserId) return [];

    let filtered = spaces.filter(s => !s.is_archived && s.owner_id !== currentUserId);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(query) || 
             (s.description && s.description.toLowerCase().includes(query))
      );
    }

    return sortWithDefaultFirst(filtered);
  }, [spaces, currentUserId, searchQuery]);

  // Filter spaces for Favorites tab
  const favoriteSpaces = useMemo(() => {
    if (!spaces) return [];

    let filtered = spaces.filter(s => {
      const assignment = assignments.find(a => a.space_id === s.id);
      return !s.is_archived && assignment?.is_pinned;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(query) || 
             (s.description && s.description.toLowerCase().includes(query))
      );
    }

    return sortWithDefaultFirst(filtered);
  }, [spaces, assignments, searchQuery]);

  // Filter spaces for Archived tab
  const archivedSpaces = useMemo(() => {
    if (!spaces) return [];

    let filtered = spaces.filter(s => s.is_archived);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(query) || 
             (s.description && s.description.toLowerCase().includes(query))
      );
    }

    return sortWithDefaultFirst(filtered);
  }, [spaces, searchQuery]);

  // Get paginated spaces based on active tab
  const getActiveSpaces = () => {
    switch (activeTab) {
      case 'favorites': return favoriteSpaces;
      case 'my-spaces': return mySpaces;
      case 'team-spaces': return teamSpaces;
      case 'archived': return archivedSpaces;
      default: return mySpaces;
    }
  };

  const activeSpaces = getActiveSpaces();
  const paginatedSpaces = usePagination(activeSpaces, currentPage, itemsPerPage);

  const handleCreateSpace = (data: { 
    name: string; 
    description: string;
    templateId?: string;
    ai_model?: string;
    ai_instructions?: string;
    compliance_rule?: string;
    file_quota_mb?: number;
    default_personas?: any;
    default_prompts?: any;
  }) => {
    createSpace(data);
    setShowCreateSpace(false);
  };

  const handlePinSpace = (spaceId: string) => {
    const assignment = assignments.find(a => a.space_id === spaceId);
    togglePin({ spaceId, isPinned: assignment?.is_pinned || false });
  };

  const handleArchiveSpace = (spaceId: string) => {
    const space = spaces?.find(s => s.id === spaceId);
    if (space) {
      toggleArchive({ spaceId, isArchived: space.is_archived });
    }
  };

  const handleChangeColor = (spaceId: string, colorCode: string) => {
    updateSpace({ id: spaceId, color_code: colorCode });
  };

  if (spacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getEmptyProps = () => {
    switch (activeTab) {
      case 'favorites': return { emptyTitle: 'No Favorites', emptyIcon: Star };
      case 'my-spaces': return { emptyTitle: 'No Spaces', emptyIcon: Boxes };
      case 'team-spaces': return { emptyTitle: 'No Team Workspaces', emptyIcon: Users };
      case 'archived': return { emptyTitle: 'No Archived Workspaces', emptyIcon: Archive };
      default: return { emptyTitle: 'No Spaces', emptyIcon: Boxes };
    }
  };

  return (
    <>
      <div className="container mx-auto pt-[54px] px-6 pb-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-0">
            <TabsList variant="underline">
              <TabsTrigger value="favorites">
                <Star className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="my-spaces">
                <Boxes className="h-4 w-4" />
                My Spaces
              </TabsTrigger>
              <TabsTrigger value="team-spaces">
                <Users className="h-4 w-4" />
                Team Spaces
              </TabsTrigger>
              <TabsTrigger value="archived">
                <Archive className="h-4 w-4" />
                Archived
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="border-b border-[#ACACAC] mb-[34px]" />

          {/* All tabs share same list view */}
          <TabsContent value={activeTab} className="mt-0">
            <SpaceList
              spaces={paginatedSpaces}
              assignments={assignments}
              currentUserId={currentUserId}
              onPin={handlePinSpace}
              onArchive={handleArchiveSpace}
              onChangeColor={handleChangeColor}
              {...getEmptyProps()}
            />
            <TablePagination
              totalItems={activeSpaces.length}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              minItemsForPagination={10}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateSpaceDialog
        open={showCreateSpace}
        onClose={() => setShowCreateSpace(false)}
        onCreate={handleCreateSpace}
        isCreating={isCreatingSpace}
      />
    </>
  );
}
