import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Switch } from '@/admin/ui/switch';
import { Label } from '@/admin/ui/label';
import { Textarea } from '@/admin/ui/textarea';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { FileText, RotateCcw, Save } from 'lucide-react';

const DEFAULT_FORMATTING_RULES = `## Response Formatting Rules

Follow these formatting guidelines for all responses:

### Headers & Structure
- Use H2 (##) for major sections (3-7 per response)
- Use H3 (###) for subsections within major sections
- Never use H1 (#) in responses - reserved for document titles only
- Include a brief overview (2-4 sentences) at the start of longer responses

### Bold Text Usage
- Bold key terms, labels, and critical information for scanning
- Bold category headers in lists (e.g., **Example:**, **Note:**, **Warning:**)
- Do not bold entire sentences - use headers instead
- Limit bold to 10-15% of text maximum

### Lists
- Use numbered lists (1, 2, 3) for sequential steps, processes, or ranked items
- Use bulleted lists (-) for features, options, or non-sequential items
- Each list item should be 1-3 complete sentences
- Use parallel structure across all items
- Leave one blank line before and after lists

### Spacing & Paragraphs
- One blank line between paragraphs
- One blank line before and after headers
- 3-5 sentences per paragraph ideal
- Break up dense content every 4-5 lines visually

### Code Blocks
- Use code blocks for technical content, commands, file paths
- Include language identifier when possible

### Writing Style
- Clear and direct - avoid passive voice
- Professional but conversational tone
- Vary sentence length (mix short 5-10 words with medium 15-20 words)
- Front-load important information in sentences
- Use active voice for instructions

### Quality Checks
- Hierarchy should be clear at a glance
- Bolded words should create a scannable outline
- Document should pass the "squint test" - look balanced and organized from afar`;

export function FormattingRulesTab() {
  const { settings, isLoading, updateSetting } = useSystemSettings();
  const [config, setConfig] = useState<{ enabled: boolean; rules: string }>({
    enabled: true,
    rules: DEFAULT_FORMATTING_RULES,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && settings.length > 0) {
      const formattingSetting = settings.find(s => s.setting_key === 'response_formatting_rules');
      if (formattingSetting?.setting_value) {
        setConfig({
          enabled: formattingSetting.setting_value.enabled ?? true,
          rules: formattingSetting.setting_value.rules || DEFAULT_FORMATTING_RULES,
        });
      }
    }
  }, [settings, isLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSetting('response_formatting_rules', config);
      toast.success('Formatting rules saved successfully');
    } catch (error: any) {
      toast.error('Failed to save formatting rules', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      enabled: true,
      rules: DEFAULT_FORMATTING_RULES,
    });
    toast.info('Reset to default formatting rules - click Save to apply');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-admin-accent" />
            <CardTitle>Response Formatting Rules</CardTitle>
          </div>
          <CardDescription>
            Configure formatting rules that are injected into all Ai responses to ensure consistent, professional styling.
            These rules are prepended to the system prompt for every chat message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="formatting-enabled" className="text-base font-medium">
                Enable Formatting Rules
              </Label>
              <p className="text-sm text-admin-text-muted">
                When enabled, formatting instructions are included in every Ai response
              </p>
            </div>
            <Switch
              id="formatting-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formatting-rules" className="text-base font-medium">
              Formatting Instructions
            </Label>
            <p className="text-sm text-admin-text-muted mb-2">
              Markdown-formatted instructions that tell the Ai how to structure and format responses.
              Use headers, lists, and clear directives.
            </p>
            <Textarea
              id="formatting-rules"
              value={config.rules}
              onChange={(e) => setConfig(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Enter formatting rules..."
              className="min-h-[400px] font-mono text-sm"
              disabled={!config.enabled}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Formatting Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-admin-text-muted">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-admin-text">Injection Order</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Formatting Rules (this setting)</li>
                <li>Ai Instructions / Space Instructions</li>
                <li>Persona System Prompt</li>
                <li>Personal Context / Knowledge Base</li>
                <li>Conversation History</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-admin-text">Best Practices</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Keep rules concise but comprehensive</li>
                <li>Use markdown formatting in the rules</li>
                <li>Focus on structure over content style</li>
                <li>Test changes with different prompt types</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
