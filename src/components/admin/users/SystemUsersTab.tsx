import { useState } from 'react';
import { useSystemUsers, SystemUser, SystemUserRole } from '@/hooks/useSystemUsers';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Search, Pencil, Trash2, Plus, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ROLES: { value: SystemUserRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
  { value: 'admin', label: 'Admin', description: 'Manage users and settings' },
  { value: 'editor', label: 'Editor', description: 'Edit content and data' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

const getRoleBadgeVariant = (role: SystemUserRole): 'destructive' | 'default' | 'secondary' | 'outline' => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'editor':
      return 'secondary';
    case 'viewer':
      return 'outline';
    default:
      return 'outline';
  }
};

export const SystemUsersTab = () => {
  const { user: currentUser } = useSystemAuth();
  const { 
    users, 
    isLoading, 
    createUser, 
    updateUser, 
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSystemUsers();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    roles: ['viewer'] as SystemUserRole[],
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    is_active: true,
    roles: [] as SystemUserRole[],
    new_password: '',
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  const filteredUsers = searchTerm
    ? users.filter((user) => {
        const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
        return displayName.includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : users;

  const getDisplayName = (user: SystemUser | null) => {
    if (!user) return 'N/A';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || 'N/A';
  };

  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password) return;
    
    await createUser({
      email: addForm.email,
      password: addForm.password,
      first_name: addForm.first_name || undefined,
      last_name: addForm.last_name || undefined,
      roles: addForm.roles,
    });

    setAddDialogOpen(false);
    setAddForm({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      roles: ['viewer'],
    });
  };

  const handleEditClick = (user: SystemUser) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      roles: user.roles || ['viewer'],
      new_password: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    await updateUser({
      user_id: editingUser.id,
      first_name: editForm.first_name || undefined,
      last_name: editForm.last_name || undefined,
      is_active: editForm.is_active,
      roles: editForm.roles,
      new_password: editForm.new_password || undefined,
    });

    setEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteClick = (user: SystemUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    await deleteUser(userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const toggleRole = (role: SystemUserRole, roles: SystemUserRole[], setRoles: (roles: SystemUserRole[]) => void) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Users
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage admin panel access ({users.length} users)
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add System User
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Roles</TableHead>
                    <TableHead className="text-muted-foreground">Last Login</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {getDisplayName(user)}
                        {isSelf(user.id) && (
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.last_login_at
                          ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(user)}
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                            title="Delete user"
                            disabled={isSelf(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No system users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add System User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System User</DialogTitle>
            <DialogDescription>
              Create a new admin panel user account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add_email">Email *</Label>
              <Input
                id="add_email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_password">Password *</Label>
              <Input
                id="add_password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Min 12 chars, uppercase, lowercase, number, special"
              />
              <p className="text-xs text-muted-foreground">
                Must be 12+ characters with uppercase, lowercase, number, and special character.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_first_name">First Name</Label>
                <Input
                  id="add_first_name"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_last_name">Last Name</Label>
                <Input
                  id="add_last_name"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <div key={role.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={`add_role_${role.value}`}
                      checked={addForm.roles.includes(role.value)}
                      onCheckedChange={() =>
                        toggleRole(role.value, addForm.roles, (roles) =>
                          setAddForm({ ...addForm, roles })
                        )
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`add_role_${role.value}`} className="text-sm font-medium">
                        {role.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              disabled={isCreating || !addForm.email || !addForm.password || addForm.roles.length === 0}
            >
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit System User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit System User</DialogTitle>
            <DialogDescription>
              Update system user profile and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                value={editingUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit_is_active">Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this user's access</p>
              </div>
              <Switch
                id="edit_is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <div key={role.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={`edit_role_${role.value}`}
                      checked={editForm.roles.includes(role.value)}
                      onCheckedChange={() =>
                        toggleRole(role.value, editForm.roles, (roles) =>
                          setEditForm({ ...editForm, roles })
                        )
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit_role_${role.value}`} className="text-sm font-medium">
                        {role.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_new_password">New Password (optional)</Label>
              <Input
                id="edit_new_password"
                type="password"
                value={editForm.new_password}
                onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave} 
              disabled={isUpdating || editForm.roles.length === 0}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getDisplayName(userToDelete)}? 
              This action cannot be undone and will revoke their admin panel access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SystemUsersTab;
