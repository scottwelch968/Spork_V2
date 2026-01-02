import { SystemHealthTab } from '@/admin/components/maintenance';
import { Activity, ShieldCheck } from 'lucide-react';

const AdminSystemHealth = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Standardized Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-admin-card p-8 rounded-2xl border border-admin-border shadow-sm overflow-hidden relative group">
        <div className="absolute inset-0 bg-grid-admin opacity-[0.02]" />
        <div className="flex items-center gap-6 z-10 relative">
          <div className="h-16 w-16 rounded-2xl bg-admin-success/10 flex items-center justify-center border border-admin-success/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Activity className="h-8 w-8 text-admin-success" />
          </div>
          <div>
            <h1 className="text-3xl font-roboto-slab font-bold tracking-tight text-admin-text">System Vitality</h1>
            <p className="text-admin-text-muted mt-2 max-w-lg leading-relaxed">
              Real-time monitoring of architectural integrity, resource allocation, and neural node health.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 z-10 relative">
          <div className="bg-admin-info/10 px-5 py-2.5 rounded-xl border border-admin-info/20 flex items-center gap-3 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-admin-info" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-admin-info/70 leading-none">Status</p>
              <p className="text-xs font-bold text-admin-text mt-1 uppercase tracking-wider">Secure & Optimal</p>
            </div>
          </div>
        </div>
      </div>

      <SystemHealthTab />
    </div>
  );
};

export default AdminSystemHealth;
