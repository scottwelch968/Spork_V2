import { Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatInputProvider } from '@/contexts/ChatInputContext';
import { AuthGate } from './AuthGate';
import { AppLayout } from '@/components/layout/AppLayout';
import { SessionExpiryWarning } from './SessionExpiryWarning';
import { useLocation } from 'react-router-dom';

/**
 * Inner component that uses auth context for session warning
 */
function UserRouteContent() {
  const { showSessionWarning, sessionTimeRemaining, extendSession, signOut } = useAuth();
  const location = useLocation();
  
  // Routes that should NOT have AppLayout
  const noLayoutRoutes = ['/', '/auth', '/auth/callback', '/invite', '/test-chat'];
  const isNoLayoutRoute = noLayoutRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith('/invite/')
  );

  return (
    <>
      <AuthGate>
        {isNoLayoutRoute ? (
          <Outlet />
        ) : (
          <AppLayout>
            <Outlet />
          </AppLayout>
        )}
      </AuthGate>
      
      <SessionExpiryWarning
        open={showSessionWarning}
        timeRemainingMs={sessionTimeRemaining}
        onExtend={extendSession}
        onLogout={signOut}
      />
    </>
  );
}

/**
 * Layout component that wraps all user routes with AuthProvider, ChatProvider, and ChatInputProvider.
 * This ensures providers are initialized ONCE and shared across all user routes,
 * preventing re-initialization on navigation.
 * 
 * Architecture:
 * - AuthProvider: Manages authentication state
 * - ChatProvider: Manages chat context (model, persona selection)
 * - ChatInputProvider: Manages floating chat input state (rendered in AppLayout as sibling)
 * - AuthGate: Ensures no UI renders until auth is verified
 * - AppLayout: Provides sidebar/header (only for protected routes)
 */
export function UserRouteLayout() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ChatInputProvider>
          <UserRouteContent />
        </ChatInputProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
