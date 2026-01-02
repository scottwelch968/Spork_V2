import { useState } from 'react';
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' }
};

export function EditorPreviewPanel() {
  const [currentPath, setCurrentPath] = useState('/');
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get the current app URL from environment
  const baseUrl = window.location.origin;
  const previewUrl = `${baseUrl}${currentPath}`;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Input
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          className="h-7 text-xs font-mono"
          placeholder="/"
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={handleOpenExternal}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <div className="border-l pl-2 ml-1">
          <ToggleGroup 
            type="single" 
            value={viewport} 
            onValueChange={(v) => v && setViewport(v as ViewportSize)}
            size="sm"
          >
            <ToggleGroupItem value="desktop" className="h-7 w-7 p-0">
              <Monitor className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" className="h-7 w-7 p-0">
              <Tablet className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" className="h-7 w-7 p-0">
              <Smartphone className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex items-start justify-center bg-muted/30 p-4 overflow-auto">
        <div 
          className="bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{ 
            width: viewportSizes[viewport].width,
            maxWidth: '100%',
            height: viewport === 'desktop' ? '100%' : 'calc(100% - 2rem)'
          }}
        >
          <iframe
            key={refreshKey}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>

      {/* Status */}
      <div className="px-3 py-1.5 border-t text-xs text-muted-foreground shrink-0 flex items-center justify-between">
        <span>{viewportSizes[viewport].label} view</span>
        <span className="font-mono">{previewUrl}</span>
      </div>
    </div>
  );
}
