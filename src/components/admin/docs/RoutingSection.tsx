import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Globe } from 'lucide-react';
import type { RouteDoc } from '@/utils/generateDocumentation';

interface RoutingSectionProps {
  routes: RouteDoc[];
}

export function RoutingSection({ routes }: RoutingSectionProps) {
  const publicRoutes = routes.filter((r) => !r.protected);
  const userRoutes = routes.filter((r) => r.protected && !r.adminOnly);
  const adminRoutes = routes.filter((r) => r.adminOnly);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/30 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Routing Architecture</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>React Router v6</strong> - Client-side routing</li>
          <li>• <strong>ProtectedRoute</strong> - Authentication wrapper</li>
          <li>• <strong>AdminLayout</strong> - Admin access control</li>
        </ul>
      </div>

      {/* Public Routes */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-primary border-b pb-2 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Public Routes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Path</th>
                <th className="text-left p-3 font-medium">Page</th>
                <th className="text-left p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {publicRoutes.map((route) => (
                <tr key={route.path} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-foreground">{route.path}</td>
                  <td className="p-3 font-mono text-muted-foreground">{route.page}</td>
                  <td className="p-3 text-muted-foreground">{route.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protected User Routes */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-primary border-b pb-2 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Protected User Routes
          <Badge variant="outline" className="ml-2">Requires Auth</Badge>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Path</th>
                <th className="text-left p-3 font-medium">Page</th>
                <th className="text-left p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {userRoutes.map((route) => (
                <tr key={route.path} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-foreground">{route.path}</td>
                  <td className="p-3 font-mono text-muted-foreground">{route.page}</td>
                  <td className="p-3 text-muted-foreground">{route.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Routes */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-primary border-b pb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Routes
          <Badge variant="destructive" className="ml-2">Admin Only</Badge>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Path</th>
                <th className="text-left p-3 font-medium">Page</th>
                <th className="text-left p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {adminRoutes.map((route) => (
                <tr key={route.path} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-foreground">{route.path}</td>
                  <td className="p-3 font-mono text-muted-foreground">{route.page}</td>
                  <td className="p-3 text-muted-foreground">{route.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
        <strong>Total Routes:</strong> {routes.length} |{' '}
        <strong>Public:</strong> {publicRoutes.length} |{' '}
        <strong>Protected:</strong> {userRoutes.length} |{' '}
        <strong>Admin:</strong> {adminRoutes.length}
      </div>
    </div>
  );
}
