import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute now only handles redirect logic.
 * Loading states are handled by AuthGate in UserRouteLayout.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still show spinner during loading to prevent flash
  // (AuthGate handles the main loading, but this is a safety net)
  if (loading) {
    return null; // AuthGate is already showing the spinner
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
