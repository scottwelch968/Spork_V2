import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

interface AdminAppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function AdminAppLayout({ children, fullWidth = false }: AdminAppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        {fullWidth ? (
          <main className="flex-1 overflow-hidden bg-muted/30">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-scroll bg-muted/30
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700
            dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <div className="container mx-auto p-6 max-w-7xl">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
