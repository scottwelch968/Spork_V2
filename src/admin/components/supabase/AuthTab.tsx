import React, { useEffect, useState } from 'react';
import { SupabaseCredentials, AuthConfig, SupabaseUser } from './types';
import { supabaseService } from './services/supabaseService';
import { authClient } from './services/authClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Textarea } from '@/admin/ui/textarea';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/admin/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/admin/ui/alert-dialog';
import { Loader2, Shield, Mail, Key, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { toast } from 'sonner';

interface Props {
  creds: SupabaseCredentials;
}

export const SupabaseAuthTab: React.FC<Props> = ({ creds }) => {
  // Config State
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form State for Text Inputs
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleSecret, setGoogleSecret] = useState('');
  const [githubClientId, setGithubClientId] = useState('');
  const [githubSecret, setGithubSecret] = useState('');
  const [redirectUrls, setRedirectUrls] = useState('');

  // Users State
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Create User State
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    authClient.init(creds);
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  // Sync config to form state
  useEffect(() => {
    if (config) {
      setGoogleClientId(config.external_google_client_id || '');
      setGoogleSecret(config.external_google_secret || '');
      setGithubClientId(config.external_github_client_id || '');
      setGithubSecret(config.external_github_secret || '');
      setRedirectUrls((config.uri_allow_list || []).join('\n'));
    }
  }, [config]);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      const data = await supabaseService.getAuthConfig(creds);
      setConfig(data);
    } catch (err: any) {
      setConfigError(err.message);
      toast.error(`Failed to load auth config: ${err.message}`);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadUsers = async () => {
    if (!authClient.isInitialized()) {
      setUserError("Service Role Key is missing. Please add Service Role Key in Settings to manage users.");
      return;
    }
    try {
      setLoadingUsers(true);
      setUserError(null);
      const { users: fetchedUsers } = await authClient.listUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setUserError(err.message);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggle = async (key: keyof AuthConfig) => {
    if (!config) return;
    const newValue = !config[key];
    
    // Optimistic update
    setConfig({ ...config, [key]: newValue });
    setSavingConfig(true);
    
    try {
      await supabaseService.updateAuthConfig(creds, { [key]: newValue });
      toast.success('Configuration updated');
    } catch (err: any) {
      setConfigError(err.message);
      toast.error(`Failed to update: ${err.message}`);
      // Revert
      setConfig({ ...config, [key]: !newValue });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveDetailedConfig = async () => {
    setSavingConfig(true);
    try {
      const updates: Partial<AuthConfig> = {
        external_google_client_id: googleClientId,
        external_google_secret: googleSecret,
        external_github_client_id: githubClientId,
        external_github_secret: githubSecret,
        uri_allow_list: redirectUrls.split('\n').map(s => s.trim()).filter(Boolean)
      };
      
      const newConfig = await supabaseService.updateAuthConfig(creds, updates);
      setConfig(newConfig);
      toast.success('Configuration saved successfully');
    } catch (err: any) {
      toast.error(`Failed to save configuration: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await authClient.deleteUser(deleteUserId);
      setUsers(users.filter(u => u.id !== deleteUserId));
      toast.success('User deleted successfully');
      setDeleteUserId(null);
    } catch (err: any) {
      toast.error(`Failed to delete user: ${err.message}`);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const newUser = await authClient.inviteUser(inviteEmail);
      if (newUser) {
        setUsers([newUser, ...users]);
        setInviteEmail('');
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
    } catch (err: any) {
      toast.error(`Failed to invite user: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword) {
      toast.error('Email and password are required');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      const newUser = await authClient.createUser(createEmail, createPassword, {}, createRole);
      if (newUser) {
        setUsers([newUser, ...users]);
        setCreateEmail('');
        setCreatePassword('');
        setCreateRole('user');
        setShowCreateForm(false);
        toast.success(`User created successfully: ${createEmail} (${createRole})`);
      }
    } catch (err: any) {
      toast.error(`Failed to create user: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">Authentication & Users</h2>
        <p className="text-sm text-admin-text-muted mt-1">Manage providers, security, and users</p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="users" onClick={loadUsers}>Users</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
          {loadingConfig ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-admin-text-muted">Loading configuration...</span>
                </div>
              </CardContent>
            </Card>
          ) : configError ? (
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-600">Error: {configError}</p>
                </div>
              </CardContent>
            </Card>
          ) : config ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: General & Email */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      General Access & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Disable Signups</Label>
                        <p className="text-xs text-admin-text-muted mt-1">Prevent new users from signing up publicly</p>
                      </div>
                      <Switch
                        checked={!!config.disable_signup}
                        onCheckedChange={() => handleToggle('disable_signup')}
                        disabled={savingConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Captcha</Label>
                        <p className="text-xs text-admin-text-muted mt-1">Protect login/signup endpoints with hCaptcha</p>
                      </div>
                      <Switch
                        checked={!!config.security_captcha_enabled}
                        onCheckedChange={() => handleToggle('security_captcha_enabled')}
                        disabled={savingConfig}
                      />
                    </div>
                    <div>
                      <Label>Redirect URLs (Allow List)</Label>
                      <p className="text-xs text-admin-text-muted mt-1 mb-2">URLs that Supabase is allowed to redirect to after authentication. One per line.</p>
                      <Textarea
                        value={redirectUrls}
                        onChange={(e) => setRedirectUrls(e.target.value)}
                        className="font-mono text-sm min-h-[100px]"
                        placeholder="http://localhost:3000&#10;https://myapp.com"
                      />
                    </div>
                    <div>
                      <Label>Site URL</Label>
                      <div className="bg-admin-bg-muted border border-admin-border rounded px-3 py-2 text-sm text-admin-text font-mono mt-1">
                        {config.site_url || 'Not configured'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Email Provider</Label>
                      <Switch
                        checked={!!config.external_email_enabled}
                        onCheckedChange={() => handleToggle('external_email_enabled')}
                        disabled={savingConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Confirm Emails</Label>
                        <p className="text-xs text-admin-text-muted mt-1">Users are verified immediately without clicking a link</p>
                      </div>
                      <Switch
                        checked={!!config.mailer_autoconfirm}
                        onCheckedChange={() => handleToggle('mailer_autoconfirm')}
                        disabled={savingConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Secure Email Change</Label>
                        <p className="text-xs text-admin-text-muted mt-1">Require password and verification to change email</p>
                      </div>
                      <Switch
                        checked={!!config.mailer_secure_email_change_enabled}
                        onCheckedChange={() => handleToggle('mailer_secure_email_change_enabled')}
                        disabled={savingConfig}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Phone Provider</Label>
                      <Switch
                        checked={!!config.external_phone_enabled}
                        onCheckedChange={() => handleToggle('external_phone_enabled')}
                        disabled={savingConfig}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 2: Social Providers */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Social Providers
                      </CardTitle>
                      <Button
                        onClick={handleSaveDetailedConfig}
                        disabled={savingConfig}
                        size="sm"
                      >
                        {savingConfig ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Credentials'
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Google */}
                    <div className="bg-admin-bg-muted rounded-lg p-4 border border-admin-border">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-border pb-2">
                        <span className="font-semibold text-admin-text flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                          Google
                        </span>
                        <Switch
                          checked={!!config.external_google_enabled}
                          onCheckedChange={() => handleToggle('external_google_enabled')}
                          disabled={savingConfig}
                        />
                      </div>
                      {config.external_google_enabled && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Client ID</Label>
                            <Input
                              type="text"
                              value={googleClientId}
                              onChange={(e) => setGoogleClientId(e.target.value)}
                              className="font-mono text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Client Secret</Label>
                            <Input
                              type="password"
                              value={googleSecret}
                              onChange={(e) => setGoogleSecret(e.target.value)}
                              className="font-mono text-sm mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* GitHub */}
                    <div className="bg-admin-bg-muted rounded-lg p-4 border border-admin-border">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-border pb-2">
                        <span className="font-semibold text-admin-text flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </span>
                        <Switch
                          checked={!!config.external_github_enabled}
                          onCheckedChange={() => handleToggle('external_github_enabled')}
                          disabled={savingConfig}
                        />
                      </div>
                      {config.external_github_enabled && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Client ID</Label>
                            <Input
                              type="text"
                              value={githubClientId}
                              onChange={(e) => setGithubClientId(e.target.value)}
                              className="font-mono text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Client Secret</Label>
                            <Input
                              type="password"
                              value={githubSecret}
                              onChange={(e) => setGithubSecret(e.target.value)}
                              className="font-mono text-sm mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          {userError && (
            <Card className="bg-yellow-500/10 border-yellow-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-600">{userError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create/Invite User Section */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex-1"
            >
              {showCreateForm ? 'Cancel' : 'Create User Directly'}
            </Button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create User</CardTitle>
                <p className="text-sm text-admin-text-muted">Create a user directly with email and password (no email required)</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="mt-1"
                      minLength={6}
                    />
                    <p className="text-xs text-admin-text-muted mt-1">Password must be at least 6 characters. Email will be auto-confirmed.</p>
                  </div>
                  <div>
                    <Label htmlFor="create-role">User Role</Label>
                    <Select value={createRole} onValueChange={(value: 'admin' | 'user') => setCreateRole(value)}>
                      <SelectTrigger id="create-role" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User (Regular Site User)</SelectItem>
                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-admin-text-muted mt-1">
                      <strong>User:</strong> Regular site user with standard permissions<br />
                      <strong>Admin:</strong> Full access to admin features and user management
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={creating || !authClient.isInitialized()}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Invite Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Invite User</CardTitle>
              <p className="text-sm text-admin-text-muted">Send an invitation email (requires email to be configured)</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={inviting || !authClient.isInitialized()}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="pt-6 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-admin-text-muted">Loading users...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-admin-text-muted">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-admin-text">{user.email || user.phone || 'Anonymous'}</div>
                          <div className="text-xs text-admin-text-muted font-mono mt-0.5">{user.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">
                              {user.app_metadata?.provider || 'email'}
                            </Badge>
                            {user.roles && user.roles.length > 0 && (
                              <Badge variant={user.roles.includes('admin') ? 'default' : 'secondary'} className="text-xs">
                                {user.roles.includes('admin') ? 'Admin' : 'User'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
