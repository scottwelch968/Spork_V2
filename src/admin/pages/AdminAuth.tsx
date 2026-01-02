import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { AdminLogin } from '@/admin/components';

export default function AdminAuth() {
  const { user, hasRole, loading, initialized } = useSystemAuth();



  const navigate = useNavigate();

  const isAdmin = hasRole('super_admin') || hasRole('admin');

  // Redirect to admin dashboard if already authenticated as admin
  useEffect(() => {
    if (initialized && !loading && user && isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAdmin, loading, initialized, navigate]);

  // Show loading while checking existing session
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-admin-bg via-admin-bg-muted to-admin-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
      </div>
    );
  }

  return <AdminLogin />;
}
