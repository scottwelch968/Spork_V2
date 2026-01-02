import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Image as ImageIcon, 
  Boxes, 
  ChevronDown,
  Settings,
  CreditCard,
  Moon,
  LogOut,
  Rocket,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import SporkLogo from '@/components/branding/SporkLogo';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { SidebarSubmenuPanel, SubmenuItem } from './SidebarSubmenuPanel';

// Sidebar width constant
export const LEFT_SIDEBAR_WIDTH = 88;

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  submenuItems: SubmenuItem[];
}

export function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const mainNavItems: NavItem[] = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      submenuItems: [] // Empty for now - user will define later
    },
    { 
      icon: MessageSquare, 
      label: "Let's Chat", 
      path: '/chat',
      submenuItems: [] // Empty for now - user will define later
    },
    { 
      icon: Boxes, 
      label: 'Spaces', 
      path: '/workspace',
      submenuItems: [] // Empty for now - user will define later
    },
    { 
      icon: ImageIcon, 
      label: 'Media', 
      path: '/files',
      submenuItems: [] // Empty for now - user will define later
    },
    { 
      icon: Rocket, 
      label: 'Discover', 
      path: '/discover',
      submenuItems: [] // Empty for now - user will define later
    },
  ];

  const activeItem = mainNavItems.find(item => hoveredItem === item.label);

  return (
    <>
      <div 
        className="flex flex-col h-screen bg-sidebar border-r border-sidebar-border shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)] relative z-40"
        style={{ width: `${LEFT_SIDEBAR_WIDTH}px` }}
      >
        {/* Header with Logo */}
        <div className="h-[48px] flex items-center justify-center border-b border-sidebar-border">
          <SporkLogo size="sm" showText={false} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 pt-4 flex flex-col items-center gap-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-[72px] py-4 p-0.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-hover transition-colors",
                  isActive && "bg-sidebar-hover"
                )}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section - User Profile Dropdown */}
        <div className="border-t border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex flex-col items-center justify-center gap-1 h-auto py-2 hover:bg-sidebar-hover"
              >
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="h-3 w-3 text-sidebar-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing / Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/cosmo', '_blank')}>
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Moon className="mr-2 h-4 w-4" />
                <span className="flex-1">Dark Mode</span>
                <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Submenu Panel */}
      <SidebarSubmenuPanel
        isOpen={hoveredItem !== null}
        onClose={() => setHoveredItem(null)}
        activeSection={activeItem?.label || ''}
        activeIcon={activeItem?.icon}
        sidebarWidth={LEFT_SIDEBAR_WIDTH}
        items={activeItem?.submenuItems || []}
      />
    </>
  );
}
