import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Eye, Save } from 'lucide-react';
import type { ToolManifest, ToolCategory, ToolPermission } from '@/types/sporkTools';

const TOOL_CATEGORIES: { value: ToolCategory; label: string }[] = [
  { value: 'productivity', label: 'Productivity' },
  { value: 'ai-assistant', label: 'AI Assistant' },
  { value: 'editor', label: 'Editor' },
  { value: 'utility', label: 'Utility' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'integration', label: 'Integration' },
  { value: 'other', label: 'Other' },
];

const TOOL_PERMISSIONS: { value: ToolPermission; label: string; description: string }[] = [
  { value: 'workspace', label: 'Workspace', description: 'Access workspace info and members' },
  { value: 'files', label: 'Files', description: 'Read and write workspace files' },
  { value: 'chat', label: 'Chat', description: 'Send messages and access chat history' },
  { value: 'ai', label: 'AI', description: 'Use AI completions and image generation' },
  { value: 'storage', label: 'Storage', description: 'Store tool-specific data' },
];

interface ManifestEditorProps {
  manifest: ToolManifest;
  onChange: (manifest: ToolManifest) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function ManifestEditor({ manifest, onChange, onSave, isSaving }: ManifestEditorProps) {
  const [activeTab, setActiveTab] = useState('general');

  const handlePermissionToggle = (permission: ToolPermission, checked: boolean) => {
    const newPermissions = checked
      ? [...manifest.permissions, permission]
      : manifest.permissions.filter(p => p !== permission);
    onChange({ ...manifest, permissions: newPermissions });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="preview">Preview JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input
                id="tool-name"
                value={manifest.name}
                onChange={(e) => onChange({ ...manifest, name: e.target.value })}
                placeholder="My Awesome Tool"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-version">Version</Label>
              <Input
                id="tool-version"
                value={manifest.version}
                onChange={(e) => onChange({ ...manifest, version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-description">Description</Label>
            <Textarea
              id="tool-description"
              value={manifest.description}
              onChange={(e) => onChange({ ...manifest, description: e.target.value })}
              placeholder="Describe what your tool does..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tool-icon">Icon (emoji or URL)</Label>
              <Input
                id="tool-icon"
                value={manifest.icon}
                onChange={(e) => onChange({ ...manifest, icon: e.target.value })}
                placeholder="🔧"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-category">Category</Label>
              <Select
                value={manifest.category}
                onValueChange={(value: ToolCategory) => onChange({ ...manifest, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-entry">Entry Point</Label>
            <Input
              id="tool-entry"
              value={manifest.entry_point}
              onChange={(e) => onChange({ ...manifest, entry_point: e.target.value })}
              placeholder="src/index.tsx"
            />
            <p className="text-xs text-muted-foreground">
              The main file that bootstraps your tool
            </p>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool Permissions</CardTitle>
              <CardDescription>
                Select what your tool can access. Users will see these permissions before installing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {TOOL_PERMISSIONS.map(perm => (
                <div key={perm.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={`perm-${perm.value}`}
                    checked={manifest.permissions.includes(perm.value)}
                    onCheckedChange={(checked) => handlePermissionToggle(perm.value, !!checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`perm-${perm.value}`} className="font-medium cursor-pointer">
                      {perm.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  manifest.json
                </CardTitle>
                <Badge variant="secondary">Preview</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-[400px]">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onSave && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Manifest'}
          </Button>
        </div>
      )}
    </div>
  );
}
