import { useEffect, useState } from 'react';
import { useAdmin } from '@/admin/hooks';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Badge,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input,
  Button,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Label,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/admin/ui';
import { Search, Pencil, Trash2, Ban, CheckCircle, Plus, Users, Shield } from 'lucide-react';
import { SystemUsersTab } from '@/admin/components/users';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
  user_roles: { role: string }[];
  workspaces: { id: string; name: string }[];
}

const AdminUsers = () => {
  const { getAllUsers, updateUserRole, updateUserProfile, updateUserStatus, deleteUser, updateUserPassword, createUser } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'user' as 'admin' | 'user',
    new_password: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Add user dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user' as 'admin' | 'user',
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) => {
          const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
          return displayName.includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        }
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getAllUsers();
    setUsers((data || []) as User[]);
    setFilteredUsers((data || []) as User[]);
    setIsLoading(false);
  };

  const getDisplayName = (user: User | null | undefined) => {
    if (!user) return 'N/A';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || 'N/A';
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: (user.user_roles?.[0]?.role as 'admin' | 'user') || 'user',
      new_password: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    setIsSavingEdit(true);
    try {
      const profileData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
      };
      const profileSuccess = await updateUserProfile(editingUser.id, profileData);
      const roleSuccess = await updateUserRole(editingUser.id, editForm.role);

      if (editForm.new_password) {
        await updateUserPassword(editingUser.id, editForm.new_password);
      }

      if (profileSuccess && roleSuccess) {
        setEditDialogOpen(false);
        setEditingUser(null);
        loadUsers();
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.account_status === 'active' ? 'suspended' : 'active';
    const success = await updateUserStatus(user.id, newStatus);
    if (success) {
      loadUsers();
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const success = await deleteUser(userToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password) {
      return;
    }

    setIsAdding(true);
    try {
      const success = await createUser(addForm);

      if (success) {
        setAddDialogOpen(false);
        setAddForm({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'user',
        });
        loadUsers();
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-accent-muted flex items-center justify-center">
          <Users className="h-5 w-5 text-admin-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">User Management</h1>
          <p className="text-sm text-admin-text-muted">Manage system users and their roles</p>
        </div>
      </div>

      <Tabs defaultValue="app-users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="app-users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            App Users
          </TabsTrigger>
          <TabsTrigger value="system-users" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app-users">
          <Card className="bg-admin-bg-elevated border-admin-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-admin-text font-roboto-slab">All Users</CardTitle>
                  <CardDescription className="text-admin-text-muted">Total users: {users.length}</CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Workspaces</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-admin-border">
                          <TableCell className="font-medium text-admin-text">{getDisplayName(user)}</TableCell>
                          <TableCell className="text-admin-text-muted">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(user.account_status)}>
                              {user.account_status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-admin-text-muted">{user.workspaces?.length || 0}</TableCell>
                          <TableCell className="text-admin-text-muted">{new Date(user.created_at).toLocaleDateString()}</TableCell>
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
                                onClick={() => handleStatusToggle(user)}
                                title={user.account_status === 'active' ? 'Suspend user' : 'Activate user'}
                              >
                                {user.account_status === 'active' ? (
                                  <Ban className="h-4 w-4 text-admin-warning" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-admin-success" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(user)}
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4 text-admin-error" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user profile information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    value={editingUser?.email || ''}
                    disabled
                    className="bg-admin-bg-muted"
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
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Role</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: 'admin' | 'user') => setEditForm({ ...editForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_new_password">New Password (leave empty to keep current)</Label>
                  <Input
                    id="edit_new_password"
                    type="password"
                    value={editForm.new_password}
                    onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                    placeholder="Enter new password to reset"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {getDisplayName(userToDelete as User) || userToDelete?.email}?
                  This action cannot be undone and will remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-admin-error text-destructive-foreground hover:bg-admin-error/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Add User Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with email and password.
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
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_password">Password *</Label>
                  <Input
                    id="add_password"
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Enter password"
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="add_role">Role</Label>
                  <Select
                    value={addForm.role}
                    onValueChange={(value: 'admin' | 'user') => setAddForm({ ...addForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={isAdding || !addForm.email || !addForm.password}>
                  {isAdding ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="system-users">
          <SystemUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
