import { useState, useMemo, useCallback } from 'react';
import { 
  SandpackProvider, 
  SandpackPreview,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2, Play, Github, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { SporkProject } from '@/types/sporkProject';
import { GitHubFile } from '@/hooks/useGitHubSync';
import { UseMutationResult } from '@tanstack/react-query';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' }
};

interface UnifiedPreviewPanelProps {
  // For database storage projects
  files?: Map<string, string>;
  isLoading?: boolean;
  
  // For GitHub projects
  project?: SporkProject | null;
  githubFiles?: GitHubFile[];
  isLoadingGitHubFiles?: boolean;
  fetchFilesBatch?: UseMutationResult<{ path: string; content: string; sha: string }[], Error, { paths: string[] }>;
  refetchFiles?: () => Promise<void>;
  
  // Common
  isGitHubConnected?: boolean;
}

// Core files needed for preview from GitHub
const PREVIEW_FILES = [
  'package.json',
  'src/main.tsx',
  'src/main.ts',
  'src/index.tsx',
  'src/index.ts',
  'src/App.tsx',
  'src/App.jsx',
  'src/App.ts',
  'src/index.css',
  'index.html',
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
];

// Additional source patterns for GitHub
const ADDITIONAL_SOURCE_PATTERNS = [
  /^src\/components\/.+\.(tsx|jsx|ts|js)$/,
  /^src\/hooks\/.+\.(tsx|ts)$/,
  /^src\/lib\/.+\.(ts|js)$/,
  /^src\/utils\/.+\.(ts|js)$/,
  /^src\/pages\/.+\.(tsx|jsx)$/,
  /^src\/.+\.css$/,
];

// Default starter files for empty projects
const defaultFiles: Record<string, string> = {
  '/App.tsx': `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-roboto-slab font-semibold mb-4">
          Welcome to Spork Editor
        </h1>
        <p className="text-gray-600 mb-6">
          Start editing files in the Explorer tab to see your changes here.
        </p>
        <div className="flex gap-3 justify-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            React
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
            TypeScript
          </span>
          <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
            Tailwind CSS
          </span>
        </div>
      </div>
    </div>
  );
}
`,
};

// Loading placeholder
const loadingPlaceholder: Record<string, string> = {
  '/App.tsx': `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <div className="mb-4">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-2xl font-roboto-slab font-semibold mb-2">
          Loading Project Files...
        </h1>
        <p className="text-gray-600 text-sm">
          Fetching files from repository
        </p>
      </div>
    </div>
  );
}
`,
};

// Convert Map to Sandpack format
function convertToSandpackFiles(files: Map<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, content] of files) {
    const sandpackPath = path.startsWith('/') ? path : `/${path}`;
    result[sandpackPath] = content;
  }
  return result;
}

// Convert GitHub fetched files to Sandpack format
function convertGitHubFilesToSandpack(files: { path: string; content: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const file of files) {
    const sandpackPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
    result[sandpackPath] = file.content;
  }
  return result;
}

// Prepare files for Sandpack with smart entry point detection
function prepareSandpackFiles(converted: Record<string, string>): Record<string, string> {
  // If no files, use defaults
  if (Object.keys(converted).length === 0) {
    return defaultFiles;
  }
  
  // Check if we have any file with actual content
  const loadedFiles = Object.entries(converted).filter(
    ([_, content]) => content && content.trim().length > 0
  );
  
  if (loadedFiles.length === 0) {
    return loadingPlaceholder;
  }
  
  // Smart entry point detection
  const hasMain = converted['/src/main.tsx'] || converted['/main.tsx'] || 
                  converted['/src/index.tsx'] || converted['/index.tsx'] ||
                  converted['/src/main.ts'] || converted['/main.ts'];
  const hasApp = converted['/src/App.tsx'] || converted['/App.tsx'] ||
                 converted['/src/App.jsx'] || converted['/App.jsx'];
  
  // If we have App but no main entry, generate one
  if (hasApp && !hasMain) {
    let appImport = './App';
    if (converted['/src/App.tsx']) appImport = './App';
    else if (converted['/App.tsx']) appImport = '/App';
    
    converted['/src/main.tsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '${appImport}';
${converted['/src/index.css'] ? "import './index.css';" : ''}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  }
  
  // If no App.tsx exists at all, add defaults
  if (!hasApp) {
    return { ...defaultFiles, ...converted };
  }
  
  return converted;
}

export function UnifiedPreviewPanel({ 
  files,
  isLoading = false,
  project,
  githubFiles = [],
  isLoadingGitHubFiles = false,
  fetchFilesBatch,
  refetchFiles,
  isGitHubConnected = false,
}: UnifiedPreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFetchingGitHub, setIsFetchingGitHub] = useState(false);
  const [fetchedGitHubFiles, setFetchedGitHubFiles] = useState<Record<string, string> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Determine which GitHub files to fetch for preview
  const filesToFetch = useMemo(() => {
    if (!githubFiles.length) return [];
    
    const result: string[] = [];
    
    for (const file of githubFiles) {
      if (file.type !== 'blob') continue;
      
      if (PREVIEW_FILES.includes(file.path)) {
        result.push(file.path);
        continue;
      }
      
      for (const pattern of ADDITIONAL_SOURCE_PATTERNS) {
        if (pattern.test(file.path) && result.length < 50) {
          result.push(file.path);
          break;
        }
      }
    }
    
    return result;
  }, [githubFiles]);

  // Fetch GitHub files for preview
  const handleFetchGitHubFiles = useCallback(async () => {
    if (!fetchFilesBatch || filesToFetch.length === 0) {
      setFetchError('No files to fetch');
      return;
    }

    setIsFetchingGitHub(true);
    setFetchError(null);

    try {
      if (refetchFiles && githubFiles.length === 0) {
        await refetchFiles();
      }
      
      const fileContents = await fetchFilesBatch.mutateAsync({ paths: filesToFetch });
      
      if (fileContents.length === 0) {
        throw new Error('Could not fetch any file contents');
      }

      const converted = convertGitHubFilesToSandpack(fileContents);
      const prepared = prepareSandpackFiles(converted);
      setFetchedGitHubFiles(prepared);
      setRefreshKey(prev => prev + 1);
      toast.success(`Loaded ${fileContents.length} files for preview`);
    } catch (error: any) {
      console.error('Failed to fetch GitHub files:', error);
      setFetchError(error?.message || 'Failed to fetch files');
      toast.error('Failed to load files for preview');
    } finally {
      setIsFetchingGitHub(false);
    }
  }, [fetchFilesBatch, filesToFetch, refetchFiles, githubFiles.length]);

  // Get files for Sandpack based on storage mode
  const sandpackFiles = useMemo(() => {
    // GitHub mode: use fetched files or show start prompt
    if (isGitHubConnected) {
      if (fetchedGitHubFiles) {
        return fetchedGitHubFiles;
      }
      return null; // Will show start button
    }
    
    // Database mode: use provided files Map
    if (files) {
      const converted = convertToSandpackFiles(files);
      return prepareSandpackFiles(converted);
    }
    
    return defaultFiles;
  }, [isGitHubConnected, fetchedGitHubFiles, files]);

  const handleRefresh = useCallback(() => {
    if (isGitHubConnected) {
      handleFetchGitHubFiles();
    } else {
      setRefreshKey(prev => prev + 1);
    }
  }, [isGitHubConnected, handleFetchGitHubFiles]);

  const isAnyLoading = isLoading || isLoadingGitHubFiles || isFetchingGitHub;

  // GitHub mode but not yet fetched
  if (isGitHubConnected && !sandpackFiles) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={isAnyLoading}
          >
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 h-7 px-3 flex items-center bg-muted/50 rounded text-xs font-mono text-muted-foreground">
            {isFetchingGitHub ? 'Fetching files from GitHub...' : 'Click Start Preview to load'}
          </div>

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

        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center p-8 max-w-md">
            {fetchError ? (
              <>
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
                <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
                <Button onClick={handleFetchGitHubFiles} variant="outline" size="sm">
                  Try Again
                </Button>
              </>
            ) : isFetchingGitHub ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fetching Files</h3>
                <p className="text-sm text-muted-foreground">
                  Loading {filesToFetch.length} files from GitHub...
                </p>
              </>
            ) : (
              <>
                <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Preview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {filesToFetch.length > 0 
                    ? `${filesToFetch.length} files ready to load from GitHub`
                    : 'Click to fetch project files'}
                </p>
                <Button onClick={handleFetchGitHubFiles} variant="default" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Preview
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="px-3 py-1.5 border-t text-xs text-muted-foreground shrink-0 flex items-center justify-between">
          <span>{viewportSizes[viewport].label} view</span>
          <span>GitHub • {filesToFetch.length} files</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          {isAnyLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1 h-7 px-3 flex items-center bg-muted/50 rounded text-xs font-mono text-muted-foreground">
          {isAnyLoading ? 'Loading project files...' : 'Preview'}
        </div>

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

      {/* Preview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-start justify-center bg-muted/30 p-4 overflow-auto">
          <div 
            className="bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300"
            style={{ 
              width: viewportSizes[viewport].width,
              maxWidth: '100%',
              height: viewport === 'desktop' ? '100%' : 'calc(100% - 2rem)'
            }}
          >
            <SandpackProvider
              key={refreshKey}
              template="react-ts"
              files={sandpackFiles || defaultFiles}
              options={{
                externalResources: [
                  'https://cdn.tailwindcss.com',
                ],
              }}
              theme="auto"
            >
              <SandpackLayout style={{ height: '100%', border: 'none' }}>
                <SandpackPreview 
                  showNavigator={false}
                  showRefreshButton={false}
                  showOpenInCodeSandbox={false}
                  style={{ height: '100%', flex: 1 }}
                />
              </SandpackLayout>
            </SandpackProvider>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-3 py-1.5 border-t text-xs text-muted-foreground shrink-0 flex items-center justify-between">
        <span>{viewportSizes[viewport].label} view</span>
        <span>
          {isAnyLoading ? 'Loading...' : 
           isGitHubConnected ? `GitHub • ${Object.keys(fetchedGitHubFiles || {}).length} files` :
           files && files.size > 0 ? `${files.size} files loaded` : 'Using starter template'}
        </span>
      </div>
    </div>
  );
}
