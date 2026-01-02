import type { ToolManifest } from '@/types/sporkTools';

export const DEFAULT_TOOL_MANIFEST: ToolManifest = {
  name: 'My Tool',
  version: '1.0.0',
  description: 'A custom tool for Spork',
  icon: '🔧',
  category: 'utility',
  permissions: ['workspace'],
  entry_point: 'src/index.tsx',
  config_schema: {
    type: 'object',
    properties: {},
  },
};

export const TOOL_STARTER_FILES: Record<string, string> = {
  'manifest.json': JSON.stringify(DEFAULT_TOOL_MANIFEST, null, 2),
  
  'src/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToolApp } from './ToolApp';
import './styles.css';

// This is the entry point for your tool
const container = document.getElementById('tool-root');
if (container) {
  const root = createRoot(container);
  root.render(<ToolApp />);
}

export { ToolApp };
`,

  'src/ToolApp.tsx': `import React from 'react';

interface ToolAppProps {
  api?: any; // SporkToolAPI will be injected
  config?: Record<string, any>;
}

export function ToolApp({ api, config }: ToolAppProps) {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    // Example: Load workspace data when tool starts
    if (api?.workspace) {
      api.workspace.getCurrent().then(setData);
    }
  }, [api]);

  return (
    <div className="tool-container">
      <h1>My Custom Tool</h1>
      <p>Edit src/ToolApp.tsx to build your tool!</p>
      
      {data && (
        <div className="workspace-info">
          <h2>Current Workspace</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div className="tool-actions">
        <button 
          onClick={() => api?.ui?.showToast('Hello from your tool!', 'success')}
        >
          Show Toast
        </button>
      </div>
    </div>
  );
}
`,

  'src/styles.css': `.tool-container {
  padding: 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.tool-container h1 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.tool-container p {
  color: #666;
  margin-bottom: 1rem;
}

.workspace-info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.workspace-info h2 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.workspace-info pre {
  font-size: 0.75rem;
  overflow: auto;
  max-height: 200px;
}

.tool-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tool-actions button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.tool-actions button:hover {
  background: #f5f5f5;
}
`,

  'README.md': `# My Custom Tool

A custom tool for the Spork platform.

## Getting Started

1. Edit \`src/ToolApp.tsx\` to build your tool's UI
2. Use the \`api\` prop to interact with Spork features
3. Configure permissions in \`manifest.json\`

## Available API Methods

### Workspace
- \`api.workspace.getCurrent()\` - Get current workspace info
- \`api.workspace.getMembers()\` - Get workspace members
- \`api.workspace.getActivity(limit)\` - Get recent activity

### Files
- \`api.files.list(path)\` - List files in directory
- \`api.files.read(path)\` - Read file content
- \`api.files.write(path, content)\` - Write file
- \`api.files.delete(path)\` - Delete file

### Chat
- \`api.chat.send(message, model)\` - Send chat message
- \`api.chat.getHistory(chatId)\` - Get chat history

### AI
- \`api.ai.complete(prompt, options)\` - AI text completion
- \`api.ai.generateImage(prompt)\` - Generate image

### Storage (tool-specific)
- \`api.storage.get(key)\` - Get stored value
- \`api.storage.set(key, value)\` - Store value
- \`api.storage.delete(key)\` - Delete stored value

### UI
- \`api.ui.showToast(message, type)\` - Show toast notification
- \`api.ui.showDialog(options)\` - Show confirmation dialog
- \`api.ui.openFile(path)\` - Open file in editor
`,
};

export function getToolStarterFiles(toolName: string): Record<string, string> {
  const manifest: ToolManifest = {
    ...DEFAULT_TOOL_MANIFEST,
    name: toolName,
  };

  return {
    ...TOOL_STARTER_FILES,
    'manifest.json': JSON.stringify(manifest, null, 2),
  };
}
