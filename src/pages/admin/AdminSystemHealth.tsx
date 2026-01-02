import { SystemHealthTab } from '@/admin/components/maintenance';

const AdminSystemHealth = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-roboto-slab font-semibold">System Health</h1>
        <p className="text-muted-foreground mt-1">
          Monitor system resources and performance metrics
        </p>
      </div>

      <SystemHealthTab />
    </div>
  );
};

export default AdminSystemHealth;
