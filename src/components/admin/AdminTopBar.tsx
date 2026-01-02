import { useLocation } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const pageTitles: Record<string, string> = {
  '/cosmo/analytics': 'Analytics',
  '/cosmo/usage': 'Usage',
  '/cosmo/users': 'Users',
  '/cosmo/billing': 'Billing',
  '/cosmo/models': 'Model Mgmt',
  '/cosmo/prompts': 'Prompts',
  '/cosmo/spaces': 'Spaces',
  '/cosmo/personas': 'Personas',
  '/cosmo/files': 'File Mgmt',
  '/cosmo/email': 'Email Configuration',
  '/cosmo/email-logs': 'Email Logs',
  '/cosmo/admin-tools': 'App Store',
  '/cosmo/config': 'System & Config',
  '/cosmo/maintenance': 'Maintenance',
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
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
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
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
      </div>
    </header>
  );
}
