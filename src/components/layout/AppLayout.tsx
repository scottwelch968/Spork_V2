import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { LeftSidebar, LEFT_SIDEBAR_WIDTH } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { TopBar } from './TopBar';
import { FloatingChatInput } from '@/components/chat/FloatingChatInput';

interface AppLayoutProps {
  children: ReactNode;
}

// Sidebar width constants
const RIGHT_SIDEBAR_WIDTH = 350;

export function AppLayout({ children }: AppLayoutProps) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine if current route should enable the right sidebar
  const isChatRoute = () => {
    const pathname = location.pathname;
    
    // Main chat page: /chat or /chat?id=xxx
    if (pathname === '/chat') {
      return true;
    }
    
    // Workspace chat tab: /workspace/:id with ?tab=chats
    if (pathname.startsWith('/workspace/')) {
      const tab = searchParams.get('tab');
      return tab === 'chats';
    }
    
    return false;
  };

  // Auto-close sidebar when navigating away from chat routes
  useEffect(() => {
    if (!isChatRoute() && isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
    }
  }, [location.pathname, searchParams]);

  const sidebarEnabled = isChatRoute();

  // Calculate CSS variables for sidebar widths
  const rightSidebarWidth = isRightSidebarOpen ? RIGHT_SIDEBAR_WIDTH : 0;

  return (
    <div 
      className="h-screen w-full"
      style={{
        '--left-sidebar-width': `${LEFT_SIDEBAR_WIDTH}px`,
        '--right-sidebar-width': `${rightSidebarWidth}px`,
      } as React.CSSProperties}
    >
      <div className="flex h-full bg-background overflow-hidden w-full">
        <LeftSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-background
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700
            dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            {children}
          </main>
        </div>
        
        <RightSidebar 
          isOpen={isRightSidebarOpen} 
          onClose={() => setIsRightSidebarOpen(false)}
          onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isEnabled={sidebarEnabled}
        />
      </div>
      
      {/* Floating chat input - child of wrapper, inherits CSS variables */}
      <FloatingChatInput />
    </div>
  );
}
