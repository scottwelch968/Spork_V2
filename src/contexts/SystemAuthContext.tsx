import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'system_session_token';
const SESSION_EXPIRES_KEY = 'system_session_expires';
const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export type SystemRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface SystemUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: SystemRole[];
}

interface SystemAuthContextType {
  user: SystemUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: SystemRole) => boolean;
  hasAnyRole: (roles: SystemRole[]) => boolean;
  refreshSession: () => Promise<void>;
}

const SystemAuthContext = createContext<SystemAuthContextType | undefined>(undefined);

export function SystemAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear session data
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRES_KEY);
    setUser(null);
  }, []);

  // Validate and restore session
  const validateSession = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);

    if (!sessionToken || !expiresAt) {
      clearSession();
      return false;
    }

    // Check if session expired locally first
    if (new Date(expiresAt) < new Date()) {
      clearSession();
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('system-auth', {
        body: { action: 'validate', session_token: sessionToken },
      });

      if (error || !data?.valid) {
        clearSession();
        return false;
      }

      setUser(data.user);
      localStorage.setItem(SESSION_EXPIRES_KEY, data.expires_at);
      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      clearSession();
      return false;
    }
  }, [clearSession]);

  // Refresh session (extend expiry)
  const refreshSession = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.functions.invoke('system-auth', {
        body: { action: 'refresh', session_token: sessionToken },
      });

      if (!error && data?.success) {
        localStorage.setItem(SESSION_EXPIRES_KEY, data.expires_at);
      }
    } catch (err) {
      console.error('Session refresh error:', err);
    }
  }, []);

  // Reset inactivity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    if (user) {
      activityTimeoutRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          console.log('System user session expired due to inactivity');
          signOut();
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.functions.invoke('system-auth', {
        body: { action: 'login', email, password },
      });

      if (signInError) {
        const errorMessage = signInError.message || 'Login failed';
        setError(errorMessage);
        setLoading(false);
        return { error: { message: errorMessage } };
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return { error: { message: data.error } };
      }

      if (data?.session_token && data?.user) {
        localStorage.setItem(SESSION_KEY, data.session_token);
        localStorage.setItem(SESSION_EXPIRES_KEY, data.expires_at);
        setUser(data.user);
        resetActivityTimer();
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    
    if (sessionToken) {
      try {
        await supabase.functions.invoke('system-auth', {
          body: { action: 'logout', session_token: sessionToken },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    clearSession();
    setError(null);
  };

  // Check if user has a specific role
  const hasRole = useCallback((role: SystemRole): boolean => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: SystemRole[]): boolean => {
    return roles.some(role => user?.roles?.includes(role));
  }, [user]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      
      // Inline validation to avoid closure issues
      const sessionToken = localStorage.getItem(SESSION_KEY);
      const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);

      if (!sessionToken || !expiresAt || new Date(expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRES_KEY);
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('system-auth', {
          body: { action: 'validate', session_token: sessionToken },
        });

        if (error || !data?.valid) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(SESSION_EXPIRES_KEY);
          setUser(null);
        } else {
          setUser(data.user);
          localStorage.setItem(SESSION_EXPIRES_KEY, data.expires_at);
        }
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRES_KEY);
        setUser(null);
      }
      
      setLoading(false);
      setInitialized(true);
    };

    initSession();

    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - initialization happens ONCE

  // Set up activity listeners - reduced set for performance
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      resetActivityTimer();
      // Also refresh session periodically on activity
      const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);
      if (expiresAt) {
        const expiresIn = new Date(expiresAt).getTime() - Date.now();
        // Refresh if less than 5 minutes left
        if (expiresIn < 5 * 60 * 1000) {
          refreshSession();
        }
      }
    };

    // Reduced listener set - no mousemove/touchstart spam
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetActivityTimer();

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user - callbacks are stable refs

  // Handle visibility change - inline validation to avoid closure issues
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Inline revalidation
        const sessionToken = localStorage.getItem(SESSION_KEY);
        const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);
        
        if (!sessionToken || !expiresAt || new Date(expiresAt) < new Date()) {
          // Session invalid - sign out inline
          if (sessionToken) {
            try {
              await supabase.functions.invoke('system-auth', {
                body: { action: 'logout', session_token: sessionToken },
              });
            } catch (err) {
              console.error('Logout error:', err);
            }
          }
          if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
          }
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(SESSION_EXPIRES_KEY);
          setUser(null);
          setError(null);
          
          // Force page reload to ensure clean state and show login
          window.location.reload();
          return;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user - inline validation avoids stale closures

  const value = {
    user,
    loading,
    initialized,
    error,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    refreshSession,
  };

  return (
    <SystemAuthContext.Provider value={value}>
      {children}
    </SystemAuthContext.Provider>
  );
}

export function useSystemAuth() {
  const context = useContext(SystemAuthContext);
  if (context === undefined) {
    throw new Error('useSystemAuth must be used within a SystemAuthProvider');
  }
  return context;
}
