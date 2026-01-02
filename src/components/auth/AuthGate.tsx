import { ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGateProps {
  children: ReactNode;
}

/**
 * AuthGate ensures NO app UI is rendered until authentication state is verified.
 * Shows only a minimal centered spinner during auth check.
 * Redirects unauthenticated users from protected routes to /auth.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { loading, user } = useAuth();
  const location = useLocation();

  // Public routes that don't require auth
  const publicRoutes = ['/', '/auth', '/auth/callback'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Show minimal spinner while checking auth - NO app UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For public routes, allow access (Auth page handles redirect if already logged in)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated - render the app
  return <>{children}</>;
}
