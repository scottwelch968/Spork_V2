import { useState, useEffect } from 'react';
import { useAdminSpaces } from '@/hooks/useAdminSpaces';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface ReassignSpaceDialogProps {
  space: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReassignSpaceDialog({ space, open, onOpenChange }: ReassignSpaceDialogProps) {
  const { reassignSpace } = useAdminSpaces();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      const searchUsers = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .limit(10);

        setUsers(data || []);
      };

      const debounce = setTimeout(searchUsers, 300);
      return () => clearTimeout(debounce);
    } else {
      setUsers([]);
    }
  }, [searchQuery, open]);

  const handleSubmit = async () => {
    if (!space || !selectedUserId) return;
    
    setLoading(true);
    try {
      reassignSpace({ spaceId: space.id, newOwnerId: selectedUserId });
      onOpenChange(false);
      setSearchQuery('');
      setSelectedUserId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Space Owner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Transfer ownership of this space to another user.
            </p>
            <p className="text-sm font-medium">Space: {space?.name}</p>
            <p className="text-sm text-muted-foreground">
              Current Owner: {space?.profiles?.email}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search for new owner</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {users.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                    selectedUserId === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="font-medium">{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUserId}
          >
            {loading ? 'Reassigning...' : 'Reassign Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
