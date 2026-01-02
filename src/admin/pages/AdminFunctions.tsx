import { AiFunctionsTab } from '@/admin/components/functions/AiFunctionsTab';
import { Wrench } from 'lucide-react';

const AdminFunctions = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-admin-info" />
                </div>
                <div>
                    <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Ai Functions</h1>
                    <p className="text-sm text-admin-text-muted">Manage available tools and functions for the AI</p>
                </div>
            </div>

            <AiFunctionsTab />
        </div>
    );
};

export default AdminFunctions;
