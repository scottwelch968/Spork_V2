import { useLocation } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/admin/ui/button';
import { useTheme } from 'next-themes';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/usage': 'Usage',
  '/users': 'Users',
  '/billing': 'Billing',
  '/models': 'Model Mgmt',
  '/prompts': 'Prompts',
  '/spaces': 'Spaces',
  '/personas': 'Personas',
  '/files': 'File Mgmt',
  '/email': 'Email Configuration',
  '/email-logs': 'Email Logs',
  '/email-testing': 'Email Testing',
  '/admin-tools': 'App Store',
  '/config': 'System & Config',
  '/maintenance': 'Maintenance',
};

export function AdminTopBar() {
  const location = useLocation();
  const { user } = useSystemAuth();
  const { theme, setTheme } = useTheme();

  const title = pageTitles[location.pathname] || 'Admin';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 bg-admin-card border-b border-admin-border flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-admin-text font-roboto-slab">{title}</h1>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <span className="text-xs text-admin-muted-text font-mono">
          {user?.email}
        </span>
      </div>
    </header>
  );
}
