import { Router } from 'lucide-react';

const AdminOpenRouter = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Router className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">OpenRouter</h1>
          <p className="text-sm text-admin-text-muted">Manage OpenRouter configuration and settings</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOpenRouter;



