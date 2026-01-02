import { TabThreeContent } from '@/admin/components/testing';

const AdminEmailTesting = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-roboto-slab font-semibold">Email Testing</h1>
        <p className="text-muted-foreground mt-1">
          Test email flows, inspect API calls, and monitor delivery status
        </p>
      </div>

      <TabThreeContent />
    </div>
  );
};

export default AdminEmailTesting;
