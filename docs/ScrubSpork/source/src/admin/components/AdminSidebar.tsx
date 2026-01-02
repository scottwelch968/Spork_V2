import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Brain,
  Mail,
  HardDrive,
  Library,
  Package,
  Menu,
  LogOut,
  Shield,
  Wrench,
  Rocket
} from 'lucide-react';
import { Button } from '@/admin/ui/button';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { cn } from '@/admin/lib/utils';
import { AdminSubmenuPanel } from './AdminSubmenuPanel';

export interface SubmenuItem {
  label: string;
  path: string;
  external?: boolean;
}

interface AdminCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  items?: SubmenuItem[];
}

const adminCategories: AdminCategory[] = [
  { 
    label: 'Analytics & Monitoring', 
    icon: BarChart3, 
    items: [
      { label: 'Analytics', path: '/cosmo/analytics' },
      { label: 'Usage', path: '/cosmo/usage' },
      { label: 'System Health', path: '/cosmo/system-health' }
    ]
  },
  { 
    label: 'Users & Billing', 
    icon: Users, 
    items: [
      { label: 'Users', path: '/cosmo/users' },
      { label: 'Billing', path: '/cosmo/billing' }
    ]
  },
  { 
    label: 'Ai & Models', 
    icon: Brain,
    items: [
      { label: 'Model Mgmt', path: '/cosmo/models' },
      { label: 'COSMO Control', path: '/cosmo/cosmo' },
      { label: 'Ai Style Guides', path: '/cosmo/ai-style-guides' }
    ]
  },
  { 
    label: 'Template Mgmt', 
    icon: Library, 
    items: [
      { label: 'Prompts', path: '/cosmo/prompts' },
      { label: 'Spaces', path: '/cosmo/spaces' },
      { label: 'Personas', path: '/cosmo/personas' }
    ]
  },
  { 
    label: 'File Mgmt', 
    icon: HardDrive, 
    path: '/cosmo/files'
  },
  { 
    label: 'Communications', 
    icon: Mail, 
    items: [
      { label: 'Email Configuration', path: '/cosmo/email' },
      { label: 'Email Logs', path: '/cosmo/email-logs' },
      { label: 'Email Testing', path: '/cosmo/email-testing' }
    ]
  },
  { 
    label: 'App Store', 
    icon: Package, 
    path: '/cosmo/admin-tools'
  },
  { 
    label: 'System & Config', 
    icon: SettingsIcon, 
    path: '/cosmo/config'
  },
  { 
    label: 'System Mgmt', 
    icon: Wrench, 
    items: [
      { label: 'Environments', path: '/cosmo/environments' },
      { label: 'Developer', path: '/cosmo/testing' },
      { label: 'Maintenance', path: '/cosmo/maintenance' }
    ]
  },
  { 
    label: 'Launchpad', 
    icon: Rocket, 
    path: '/cosmo/launchpad'
  }
];

const SIDEBAR_WIDTH_EXPANDED = 224;
const SIDEBAR_WIDTH_COLLAPSED = 64;

export function AdminSidebar() {
  const navigate = useNavigate();
  const { signOut } = useSystemAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{
    label: string;
    icon: React.ReactNode;
    items: SubmenuItem[];
  } | null>(null);

  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const handleLogout = async () => {
    await signOut();
    navigate('/cosmo');
  };

  const handleCategoryClick = (category: AdminCategory) => {
    if (category.path) {
      navigate(category.path);
      setIsSubmenuOpen(false);
      setActiveCategory(null);
    }
  };

  const handleCategoryHover = (category: AdminCategory) => {
    if (category.items && category.items.length > 0) {
      const Icon = category.icon;
      setActiveCategory({
        label: category.label,
        icon: <Icon className="h-4 w-4" />,
        items: category.items
      });
      setIsSubmenuOpen(true);
    } else {
      setIsSubmenuOpen(false);
      setActiveCategory(null);
    }
  };

  return (
    <>
      <div 
        data-admin-sidebar
        className={cn(
          "flex flex-col h-screen bg-admin-card border-r border-admin-border transition-all duration-300 relative z-30",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-admin-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-admin-accent" />
              <span className="font-bold text-admin-text">Admin Panel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("h-8 w-8", isCollapsed && "mx-auto")}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {adminCategories.map((category) => {
            const Icon = category.icon;
            const isOpen = isSubmenuOpen && activeCategory?.label === category.label;

            return (
              <button
                key={category.label}
                onClick={() => handleCategoryClick(category)}
                onMouseEnter={() => handleCategoryHover(category)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left",
                  isCollapsed && "justify-center",
                  "text-admin-muted-text hover:bg-admin-muted",
                  isOpen && "bg-admin-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 truncate">{category.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-admin-border p-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-xs",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Submenu Panel */}
      <AdminSubmenuPanel
        isOpen={isSubmenuOpen}
        onClose={() => {
          setIsSubmenuOpen(false);
          setActiveCategory(null);
        }}
        activeSection={activeCategory?.label || ''}
        activeIcon={activeCategory?.icon}
        sidebarWidth={sidebarWidth}
        items={activeCategory?.items || []}
      />
    </>
  );
}
