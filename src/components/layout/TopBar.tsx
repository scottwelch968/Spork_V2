import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSpace } from '@/hooks/useSpace';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

// Compact search bar for top bar using ui-topbar-search-* classes
function TopBarSearchBar({
  value,
  onChange,
  placeholder = "Search..."
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="ui-topbar-search-wrapper w-[170px]">
      <Search className="ui-topbar-search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-topbar-search-input"
      />
    </div>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentSpace } = useSpace();
  const { user } = useAuth();

  const [userProfile, setUserProfile] = useState<{ first_name?: string | null; last_name?: string | null } | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);

  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchSpaceName = async () => {
      const match = location.pathname.match(/^\/workspace\/([^/]+)/);
      if (match) {
        const workspaceId = match[1];
        const { data, error } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .maybeSingle();

        if (!error && data) {
          setSpaceName(data.name);
        } else {
          setSpaceName(null);
        }
      } else {
        setSpaceName(null);
      }
    };

    fetchSpaceName();
  }, [location.pathname]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Spork Dashboard',
    '/chat': 'Spork Chat',
    '/personas': 'Spork Ai Personas',
    '/prompts': 'Spork Prompt Library',
    '/settings': 'Spork Settings',
    '/files': 'Spork Media',
    '/generate-image': 'Spork Media Library',
    '/knowledge-base': 'Spork Knowledge Base',
    '/workspace': 'Spork Spaces',
    '/discover': 'Spork Discover',

    '/billing': 'Spork Billing & Subscription',
    '/admin/analytics': 'Spork Analytics Dashboard',
    '/admin/users': 'Spork User Management',
    '/admin/usage': 'Spork Usage Monitoring',
    '/admin/config': 'Spork System Configuration',
    '/admin/billing': 'Spork Billing Management',
    '/admin/email': 'Spork Email Management',
    '/admin/spaces': 'Spork Space Management',
    '/admin/personas': 'Spork Persona Management',
    '/admin/prompts': 'Spork Prompt Management',
    '/admin/files': 'Spork Files Management',
    '/admin/models': 'Spork Model Management',
    '/admin/email-logs': 'Spork Email Logs',
  };

  // Handle dynamic routes
  const getPageTitle = () => {
    if (location.pathname.startsWith('/chat/')) {
      return 'Spork Chat';
    }
    if (location.pathname.startsWith('/workspace/')) {
      if (spaceName) {
        const truncatedName = spaceName.length > 30
          ? spaceName.substring(0, 30) + '...'
          : spaceName;
        return `Spork Spaces | ${truncatedName}`;
      }
      return 'Spork Spaces';
    }

    // Special handling for Dashboard
    if (location.pathname === '/dashboard') {
      return 'Spork Dashboard';
    }

    return pageTitles[location.pathname] || 'Spork';
  };

  const isSpacesPage = location.pathname === '/workspace';
  const isDiscoverPage = location.pathname === '/discover';

  return (
    <div className="h-[48px] border-b border-border bg-background flex items-center justify-between px-4">
      <h1 className="text-2xl font-roboto-slab font-semibold capitalize">
        {getPageTitle()}
      </h1>

      {(isSpacesPage || isDiscoverPage) && (
        <div className="flex items-center gap-3">
          <TopBarSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={isDiscoverPage ? "Search templates..." : "Search spaces..."}
          />
          {isSpacesPage && (
            <Button variant="topbar" onClick={() => navigate('/workspace?create=true')}>
              <Plus className="h-4 w-4" />
              New Space
            </Button>
          )}
        </div>
      )}
    </div>
  );
}