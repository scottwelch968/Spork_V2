import React, { useEffect, useState } from 'react';
import { SupabaseCredentials, AuthConfig, SupabaseUser } from '../types';
import { supabaseService } from '../services/supabaseService';
import { authClient } from '../services/authClient';

interface Props {
  creds: SupabaseCredentials;
}

type AuthSection = 'config' | 'users';

export const AuthManager: React.FC<Props> = ({ creds }) => {
  const [section, setSection] = useState<AuthSection>('config');

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

  useEffect(() => {
    authClient.init(creds);
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  useEffect(() => {
    if (section === 'users') {
        loadUsers();
    }
  }, [section]);

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
      const data = await supabaseService.getAuthConfig(creds);
      setConfig(data);
    } catch (err: any) {
      setConfigError(err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadUsers = async () => {
      if (!authClient.isInitialized()) {
          setUserError("Service Role Key is missing. Please reconnect with a Service Key to manage users.");
          return;
      }
      try {
          setLoadingUsers(true);
          setUserError(null);
          const { users: fetchedUsers } = await authClient.listUsers();
          setUsers(fetchedUsers);
      } catch (err: any) {
          setUserError(err.message);
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
    } catch (err: any) {
        setConfigError(err.message);
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
          alert("Configuration saved successfully.");
      } catch (err: any) {
          alert(`Failed to save configuration: ${err.message}`);
      } finally {
          setSavingConfig(false);
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
      try {
          await authClient.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
      } catch (err: any) {
          alert("Failed to delete user: " + err.message);
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
            alert(`Invitation sent to ${inviteEmail}`);
          }
      } catch (err: any) {
          alert("Failed to invite user: " + err.message);
      } finally {
          setInviting(false);
      }
  }

  const ToggleSwitch = ({ label, propKey, description }: { label: string, propKey: keyof AuthConfig, description?: string }) => {
      if (!config) return null;
      const isActive = !!config[propKey];
      
      return (
          <div className="flex items-center justify-between py-3">
              <div>
                  <h4 className="font-medium text-supa-200 text-sm">{label}</h4>
                  {description && <p className="text-xs text-supa-500 mt-0.5">{description}</p>}
              </div>
              <button
                onClick={() => handleToggle(propKey)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    isActive ? 'bg-supa-accent' : 'bg-supa-700'
                }`}
              >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-1'
                  }`} />
              </button>
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                 <h2 className="text-3xl font-bold text-white tracking-tight">Authentication</h2>
                 <p className="text-supa-400 mt-1">Manage providers, security, and users.</p>
            </div>
            
            <div className="flex bg-supa-950 p-1 rounded-lg border border-supa-800">
                <button 
                    onClick={() => setSection('config')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${section === 'config' ? 'bg-supa-800 text-white shadow-sm' : 'text-supa-400 hover:text-supa-200'}`}
                >
                    Configuration
                </button>
                <button 
                    onClick={() => setSection('users')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${section === 'users' ? 'bg-supa-800 text-white shadow-sm' : 'text-supa-400 hover:text-supa-200'}`}
                >
                    Users
                </button>
            </div>
        </div>

        {/* Configuration View */}
        {section === 'config' && (
            <>
                {loadingConfig ? (
                    <div className="text-supa-400 animate-pulse">Loading configuration...</div>
                ) : configError ? (
                    <div className="text-red-400 p-4 border border-red-500/20 bg-red-900/10 rounded">Error: {configError}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Column 1: General & Email */}
                        <div className="space-y-6">
                            <div className="bg-supa-950 border border-supa-800 rounded-xl p-5 shadow-lg">
                                <h3 className="text-supa-100 font-bold mb-4 flex items-center gap-2">
                                    <span>🛡️</span> General Access & Security
                                </h3>
                                <div className="divide-y divide-supa-800">
                                    <ToggleSwitch 
                                        label="Disable Signups" 
                                        propKey="disable_signup" 
                                        description="Prevent new users from signing up publicly."
                                    />
                                    <ToggleSwitch 
                                        label="Enable Captcha" 
                                        propKey="security_captcha_enabled" 
                                        description="Protect login/signup endpoints with hCaptcha."
                                    />
                                    <div className="py-4">
                                        <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider mb-2">Redirect URLs (Allow List)</label>
                                        <p className="text-xs text-supa-500 mb-2">URLs that Supabase is allowed to redirect to after authentication. One per line.</p>
                                        <textarea 
                                            value={redirectUrls}
                                            onChange={(e) => setRedirectUrls(e.target.value)}
                                            className="w-full bg-supa-900 border border-supa-700 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-supa-accent h-32 resize-none"
                                            placeholder="http://localhost:3000&#10;https://myapp.com"
                                        />
                                    </div>
                                    <div className="py-4">
                                        <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider mb-2">Site URL</label>
                                        <div className="bg-supa-900 border border-supa-700 rounded px-3 py-2 text-sm text-supa-200 font-mono">
                                            {config?.site_url || 'Not configured'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-supa-950 border border-supa-800 rounded-xl p-5 shadow-lg">
                                <h3 className="text-supa-100 font-bold mb-4 flex items-center gap-2">
                                    <span>📧</span> Email Authentication
                                </h3>
                                <div className="divide-y divide-supa-800">
                                    <ToggleSwitch label="Enable Email Provider" propKey="external_email_enabled" />
                                    <ToggleSwitch 
                                        label="Auto-Confirm Emails" 
                                        propKey="mailer_autoconfirm" 
                                        description="Users are verified immediately without clicking a link."
                                    />
                                    <ToggleSwitch 
                                        label="Secure Email Change" 
                                        propKey="mailer_secure_email_change_enabled" 
                                        description="Require password and verification to change email."
                                    />
                                    <ToggleSwitch label="Phone Provider" propKey="external_phone_enabled" />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Social Providers */}
                        <div className="space-y-6">
                            <div className="bg-supa-950 border border-supa-800 rounded-xl p-5 shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-supa-100 font-bold flex items-center gap-2">
                                        <span>🔑</span> Social Providers
                                    </h3>
                                    <button 
                                        onClick={handleSaveDetailedConfig}
                                        disabled={savingConfig}
                                        className="text-xs bg-supa-accent text-supa-950 font-bold px-3 py-1.5 rounded hover:bg-supa-accentDark disabled:opacity-50 transition-colors"
                                    >
                                        {savingConfig ? 'Saving...' : 'Save Credentials'}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Google */}
                                    <div className="bg-supa-900/50 rounded-lg p-4 border border-supa-800">
                                        <div className="flex items-center justify-between mb-4 border-b border-supa-800 pb-2">
                                            <span className="font-bold text-white flex items-center gap-2">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                                                Google
                                            </span>
                                            <ToggleSwitch label="" propKey="external_google_enabled" />
                                        </div>
                                        {config?.external_google_enabled && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-xs text-supa-400 mb-1">Client ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={googleClientId}
                                                        onChange={(e) => setGoogleClientId(e.target.value)}
                                                        className="w-full bg-supa-950 border border-supa-700 rounded px-2 py-1.5 text-xs text-white focus:border-supa-accent focus:outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-supa-400 mb-1">Client Secret</label>
                                                    <input 
                                                        type="password" 
                                                        value={googleSecret}
                                                        onChange={(e) => setGoogleSecret(e.target.value)}
                                                        className="w-full bg-supa-950 border border-supa-700 rounded px-2 py-1.5 text-xs text-white focus:border-supa-accent focus:outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* GitHub */}
                                    <div className="bg-supa-900/50 rounded-lg p-4 border border-supa-800">
                                        <div className="flex items-center justify-between mb-4 border-b border-supa-800 pb-2">
                                            <span className="font-bold text-white flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                                GitHub
                                            </span>
                                            <ToggleSwitch label="" propKey="external_github_enabled" />
                                        </div>
                                        {config?.external_github_enabled && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-xs text-supa-400 mb-1">Client ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={githubClientId}
                                                        onChange={(e) => setGithubClientId(e.target.value)}
                                                        className="w-full bg-supa-950 border border-supa-700 rounded px-2 py-1.5 text-xs text-white focus:border-supa-accent focus:outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-supa-400 mb-1">Client Secret</label>
                                                    <input 
                                                        type="password" 
                                                        value={githubSecret}
                                                        onChange={(e) => setGithubSecret(e.target.value)}
                                                        className="w-full bg-supa-950 border border-supa-700 rounded px-2 py-1.5 text-xs text-white focus:border-supa-accent focus:outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Users View */}
        {section === 'users' && (
             <div className="space-y-6">
                 {userError && (
                    <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-yellow-200">
                        <span>{userError}</span>
                    </div>
                 )}

                 {/* Invite Bar */}
                 <div className="bg-supa-950 border border-supa-800 rounded-lg p-4 flex gap-4">
                     <form onSubmit={handleInvite} className="flex-1 flex gap-2">
                         <input 
                            type="email" 
                            required
                            placeholder="user@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 bg-supa-900 border border-supa-700 rounded px-4 py-2 text-white focus:border-supa-accent focus:outline-none"
                         />
                         <button 
                            type="submit" 
                            disabled={inviting || !authClient.isInitialized()}
                            className="bg-supa-accent text-supa-950 font-bold px-4 py-2 rounded hover:bg-supa-accentDark disabled:opacity-50 transition-colors"
                         >
                            {inviting ? 'Sending...' : 'Invite User'}
                         </button>
                     </form>
                 </div>

                 {/* Users Table */}
                 <div className="border border-supa-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm text-supa-300">
                        <thead className="bg-supa-950 text-supa-400 font-medium uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Last Sign In</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-supa-800 bg-supa-900">
                            {loadingUsers ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-supa-500">No users found.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-supa-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{user.email || user.phone || 'Anonymous'}</div>
                                            <div className="text-xs text-supa-500 font-mono mt-0.5">{user.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-supa-800 border border-supa-700 text-xs text-supa-300">
                                                {user.app_metadata?.provider || 'email'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-400 hover:text-red-300 hover:underline text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}
    </div>
  );
};