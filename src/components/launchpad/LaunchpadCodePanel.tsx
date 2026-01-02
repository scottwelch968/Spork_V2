import { LaunchpadTabs } from './LaunchpadTabs';
import { LaunchpadCodeEditor } from './LaunchpadCodeEditor';

interface LaunchpadCodePanelProps {
  openFiles: string[];
  activeFile: string | null;
  activeFileContent: string;
  modifiedFiles: Set<string>;
  onFileClose: (path: string) => void;
  onActiveFileChange: (path: string) => void;
  onContentChange: (path: string, content: string) => void;
}

export function LaunchpadCodePanel({
  openFiles,
  activeFile,
  activeFileContent,
  modifiedFiles,
  onFileClose,
  onActiveFileChange,
  onContentChange
}: LaunchpadCodePanelProps) {
  
  const getLanguage = (filePath: string | null): string => {
    if (!filePath) return 'typescript';
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'css': 'css',
      'scss': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql'
    };
    return langMap[ext] || 'typescript';
  };

  return (
    <div className="h-full flex flex-col lp-code-panel">
      {/* Tabs */}
      <LaunchpadTabs
        openFiles={openFiles}
        activeFile={activeFile}
        modifiedFiles={modifiedFiles}
        onTabClick={onActiveFileChange}
        onTabClose={onFileClose}
      />

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <LaunchpadCodeEditor
            value={activeFileContent}
            onChange={(value) => onContentChange(activeFile, value)}
            language={getLanguage(activeFile)}
          />
        ) : (
          <div className="h-full flex items-center justify-center lp-code-empty">
            <div className="text-center">
              <p className="text-sm">No file open</p>
              <p className="text-xs mt-1">Select a file from the Explorer tab</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
