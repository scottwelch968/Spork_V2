import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  showSessionWarning: boolean;
  sessionTimeRemaining: number;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout configuration
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const WARNING_BEFORE_EXPIRY = 2 * 60 * 1000; // Show warning 2 minutes before expiry
const INACTIVITY_CHECK_INTERVAL = 10 * 1000; // Check every 10 seconds
const ACTIVITY_DEBOUNCE = 5 * 1000; // Only update localStorage every 5 seconds
const STORAGE_KEY = 'spork_last_activity';
const SESSION_ACTIVE_KEY = 'spork_session_active'; // sessionStorage key for browser close detection

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(WARNING_BEFORE_EXPIRY);
  const { toast } = useToast();
  
  // Use refs to track state in event handlers without causing re-renders
  const sessionRef = useRef<Session | null>(null);
  const initializedRef = useRef(false);
  const lastActivityUpdateRef = useRef(0);
  const queryClientRef = useRef<ReturnType<typeof useQueryClient> | null>(null);
  const showSessionWarningRef = useRef(false);
  const isLoggingOutRef = useRef(false); // Guard to prevent multiple logout attempts

  // Get query client for cache clearing
  try {
    queryClientRef.current = useQueryClient();
  } catch {
    // QueryClient might not be available during initial render
  }

  // Update refs when state changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    showSessionWarningRef.current = showSessionWarning;
  }, [showSessionWarning]);

  // Helper to update activity timestamp with debouncing
  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Only update if more than ACTIVITY_DEBOUNCE ms have passed
    if (now - lastActivityUpdateRef.current > ACTIVITY_DEBOUNCE) {
      localStorage.setItem(STORAGE_KEY, now.toString());
      lastActivityUpdateRef.current = now;
      // Reset warning if shown
      setShowSessionWarning(false);
    }
  }, []);

  // Helper to check if session is expired due to inactivity
  const isInactivityExpired = useCallback((): boolean => {
    const lastActivity = localStorage.getItem(STORAGE_KEY);
    if (!lastActivity) return false;
    return Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT;
  }, []);

  // Helper to get time until expiry
  const getTimeUntilExpiry = useCallback((): number => {
    const lastActivity = localStorage.getItem(STORAGE_KEY);
    if (!lastActivity) return SESSION_TIMEOUT;
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return Math.max(0, SESSION_TIMEOUT - elapsed);
  }, []);

  // Removed wasBrowserClosed - unreliable with hot reload and SPA navigation

  // Helper to fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  }, []);

  // Extend session function
  const extendSession = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    lastActivityUpdateRef.current = Date.now();
    setShowSessionWarning(false);
  }, []);

  // Force logout - clears state and triggers redirect via auth state change
  const forceLogout = useCallback(async () => {
    // Guard against multiple concurrent logout attempts
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    sessionRef.current = null;
    setShowSessionWarning(false);
    
    // Clear React Query cache
    if (queryClientRef.current) {
      queryClientRef.current.clear();
    }
    
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors
    }
    
    // Reset guard after signOut completes - AuthGate will handle redirect
    isLoggingOutRef.current = false;
  }, []);

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    let inactivityInterval: ReturnType<typeof setInterval> | null = null;

    // Set up auth state listener FIRST (critical order per guidelines)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Update state synchronously - never async in this callback
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        sessionRef.current = currentSession;

        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Fresh login - update activity and set session active
          const now = Date.now();
          localStorage.setItem(STORAGE_KEY, now.toString());
          lastActivityUpdateRef.current = now;
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          
          // Defer profile fetch to avoid Supabase deadlock
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(setProfile);
          }, 0);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
          setProfile(null);
          setShowSessionWarning(false);
          // Clear React Query cache on sign out
          if (queryClientRef.current) {
            queryClientRef.current.clear();
          }
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && currentSession?.user) {
          // Token refreshed - verify inactivity
          if (isInactivityExpired()) {
            console.log('[Auth] Inactivity timeout on token refresh');
            forceLogout();
            return;
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {

        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user) {
          // Check inactivity before restoring
          if (isInactivityExpired()) {
            console.log('[Auth] Session expired due to inactivity');
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          // Valid session - restore it
          setSession(existingSession);
          setUser(existingSession.user);
          sessionRef.current = existingSession;
          
          // Mark session as active for browser close detection
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          
          // Update activity if not recently updated
          const lastActivity = localStorage.getItem(STORAGE_KEY);
          if (!lastActivity) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
          }
          lastActivityUpdateRef.current = Date.now();

          // Fetch profile
          const profileData = await fetchProfile(existingSession.user.id);
          setProfile(profileData);
        }
      } catch (err) {
        console.error('[Auth] Error initializing:', err);
      } finally {
        // ALWAYS set loading to false
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up inactivity check interval - use refs to avoid stale closures
    inactivityInterval = setInterval(() => {
      if (sessionRef.current?.user) {
        const lastActivity = localStorage.getItem(STORAGE_KEY);
        if (!lastActivity) return;
        
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        const timeRemaining = Math.max(0, SESSION_TIMEOUT - elapsed);
        
        if (timeRemaining <= 0) {
          console.log('[Auth] Inactivity timeout triggered');
          // Guard against multiple logout attempts
          if (isLoggingOutRef.current) return;
          isLoggingOutRef.current = true;
          
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
          setUser(null);
          setSession(null);
          setProfile(null);
          sessionRef.current = null;
          setShowSessionWarning(false);
          if (queryClientRef.current) {
            queryClientRef.current.clear();
          }
          supabase.auth.signOut().catch(() => {}).finally(() => {
            isLoggingOutRef.current = false;
          });
          // AuthGate will handle redirect to /auth - no hard refresh needed
        } else if (timeRemaining <= WARNING_BEFORE_EXPIRY && !showSessionWarningRef.current) {
          // Show warning - only set state once when transitioning to warning
          setShowSessionWarning(true);
        }
      }
    }, INACTIVITY_CHECK_INTERVAL);

    // Activity event handlers - debounced
    const handleActivity = () => {
      if (sessionRef.current?.user) {
        // Check expiry BEFORE updating activity
        if (isInactivityExpired()) {
          console.log('[Auth] Activity detected but session expired');
          forceLogout();
          return;
        }
        updateActivity();
      }
    };

    // Handle visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionRef.current?.user) {
        if (isInactivityExpired()) {
          console.log('[Auth] Inactivity detected on tab focus');
          forceLogout();
        } else {
          // Check if we should show warning
          const timeRemaining = getTimeUntilExpiry();
          if (timeRemaining <= WARNING_BEFORE_EXPIRY) {
            setSessionTimeRemaining(timeRemaining);
            setShowSessionWarning(true);
          }
        }
      }
    };

    // Add only essential activity listeners (reduced from original)
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      if (inactivityInterval) clearInterval(inactivityInterval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // DO NOT reset initializedRef - prevents re-initialization bugs
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - initialization happens ONCE

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Success!',
      description: 'Your account has been created.',
    });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message,
      });
      return { error };
    }

    // Check account status
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', data.user.id)
        .single();

      if (profileData?.account_status === 'cancelled') {
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Account Cancelled',
          description: 'Your account has been cancelled. Please subscribe again to continue.',
        });
        return { error: { message: 'Account cancelled' } };
      }

      if (profileData?.account_status === 'suspended') {
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Account Suspended',
          description: 'Your account has been suspended. Please contact support.',
        });
        return { error: { message: 'Account suspended' } };
      }
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign in failed',
        description: error.message,
      });
      return { error };
    }
    return { error: null };
  };

  const signOut = async () => {
    // Clear local state first - even if API fails, user should be logged out locally
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    sessionRef.current = null;
    setShowSessionWarning(false);
    
    // Clear React Query cache
    if (queryClientRef.current) {
      queryClientRef.current.clear();
    }
    
    // Then try API call (may fail if session already invalidated, that's OK)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log('[Auth] Sign out API error (session may already be invalid):', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        showSessionWarning,
        sessionTimeRemaining,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        extendSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
