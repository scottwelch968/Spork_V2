import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { AdminAppLayout } from './AdminAppLayout';

interface AdminProtectedRouteProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function AdminProtectedRoute({ children, fullWidth = false }: AdminProtectedRouteProps) {
  const { user, loading, initialized } = useSystemAuth();

  // Show loading spinner while checking auth
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to admin login
  if (!user) {
    return <Navigate to="/cosmo" replace />;
  }

  // Wrap content in AdminAppLayout
  return <AdminAppLayout fullWidth={fullWidth}>{children}</AdminAppLayout>;
}
