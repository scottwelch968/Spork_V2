import '@/admin/styles/admin-theme.css';
import { Outlet } from 'react-router-dom';
import { SystemAuthProvider } from '@/contexts/SystemAuthContext';

/**
 * Wrapper component that provides SystemAuthProvider context for all admin routes.
 * This ensures the provider is only created once for the entire admin section,
 * preventing re-initialization on navigation between admin pages.
 * 
 * Also applies admin-root class for isolated admin styling using original shadcn theme.
 */
export function AdminRouteWrapper() {
  return (
    <SystemAuthProvider>
      <div className="admin-root min-h-screen">
        <Outlet />
      </div>
    </SystemAuthProvider>
  );
}
