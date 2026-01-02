import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

interface AdminAppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function AdminAppLayout({ children, fullWidth = false }: AdminAppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-admin-bg">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        {fullWidth ? (
          <main className="flex-1 overflow-hidden bg-admin-surface">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-scroll bg-admin-surface
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-admin-muted
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-admin-border">
            <div className="container mx-auto p-6 max-w-7xl">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
