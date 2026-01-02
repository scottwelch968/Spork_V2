import { useState, useEffect } from 'react';
import { Card } from '@/admin/ui/card';
import { Label } from '@/admin/ui/label';
import { Button } from '@/admin/ui/button';
import { Switch } from '@/admin/ui/switch';
import { Slider } from '@/admin/ui/slider';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Loader2, User, Brain, BookOpen, FileText, Image, MessageSquare, Sparkles, UserCog, Info } from 'lucide-react';

export const PreMessageConfigTab = () => {
  const { getPreMessageConfig, updateSetting, isLoading } = useSystemSettings();

  const [includePersona, setIncludePersona] = useState(true);
  const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [maxHistoryMessages, setMaxHistoryMessages] = useState(20);
  const [autoSelectModel, setAutoSelectModel] = useState(false);
  const [includePersonalContext, setIncludePersonalContext] = useState(true);

  useEffect(() => {
    const config = getPreMessageConfig();
    if (config) {
      setIncludePersona(config.include_persona);
      setIncludeKnowledgeBase(config.include_knowledge_base);
      setIncludeFiles(config.include_files);
      setIncludeImages(config.include_images);
      setIncludeHistory(config.include_history);
      setMaxHistoryMessages(config.max_history_messages);
      setAutoSelectModel(config.auto_select_model || false);
      setIncludePersonalContext(config.include_personal_context ?? true);
    }
  }, [isLoading]);

  const handleSave = async () => {
    await updateSetting('pre_message_config', {
      include_persona: includePersona,
      include_knowledge_base: includeKnowledgeBase,
      include_files: includeFiles,
      include_images: includeImages,
      include_history: includeHistory,
      max_history_messages: maxHistoryMessages,
      auto_select_model: autoSelectModel,
      include_personal_context: includePersonalContext,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card: Individual vs Space Chats */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Individual Chat vs Spaces</h4>
        </div>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>• <strong>Individual Chat:</strong> Uses settings below (personas from user library, personal context from profile)</li>
          <li>• <strong>Space Chat:</strong> Uses Space-specific settings (Space Personas, Space AI Instructions) which override global settings</li>
          <li>• <strong>Knowledge Base:</strong> Only available in Spaces - documents are scoped per workspace</li>
          <li>• <strong>Personal Context:</strong> Applied to individual chats only (Spaces use Space AI Instructions instead)</li>
        </ul>
      </Card>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Pre-Message Context Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure what context to include before processing each message
            </p>
          </div>

          <div className="space-y-6">
            {/* Auto-Select Model */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="auto-select-model" className="text-base font-medium">
                    Auto-Select Model
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically choose the best model based on request type
                  </p>
                </div>
              </div>
              <Switch
                id="auto-select-model"
                checked={autoSelectModel}
                onCheckedChange={setAutoSelectModel}
              />
            </div>

            {/* Include Persona */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-persona" className="text-base font-medium">
                    Include Persona System Prompt
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Apply selected persona's instructions to messages
                  </p>
                </div>
              </div>
              <Switch
                id="include-persona"
                checked={includePersona}
                onCheckedChange={setIncludePersona}
              />
            </div>

            {/* Include AI Instructions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-ai-instructions" className="text-base font-medium">
                    Include Global AI Instructions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Apply global system instructions (configured above)
                  </p>
                </div>
              </div>
              <Switch id="include-ai-instructions" checked={true} disabled />
            </div>

            {/* Include Knowledge Base */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-knowledge-base" className="text-base font-medium">
                    Include Knowledge Base Content
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Query relevant documents and include context
                  </p>
                </div>
              </div>
              <Switch
                id="include-knowledge-base"
                checked={includeKnowledgeBase}
                onCheckedChange={setIncludeKnowledgeBase}
              />
            </div>

            {/* Include Files */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-files" className="text-base font-medium">
                    Include File Attachments
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Process and include attached file content
                  </p>
                </div>
              </div>
              <Switch
                id="include-files"
                checked={includeFiles}
                onCheckedChange={setIncludeFiles}
              />
            </div>

            {/* Include Images */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-images" className="text-base font-medium">
                    Include Images
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Process and analyze image attachments
                  </p>
                </div>
              </div>
              <Switch
                id="include-images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
              />
            </div>

            {/* Include Personal Context */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="include-personal-context" className="text-base font-medium">
                    Include Personal Context
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Include user's personal context instructions from their profile settings
                  </p>
                </div>
              </div>
              <Switch
                id="include-personal-context"
                checked={includePersonalContext}
                onCheckedChange={setIncludePersonalContext}
              />
            </div>

            {/* Include Conversation History */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="include-history" className="text-base font-medium">
                      Include Conversation History
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Maintain context across messages
                    </p>
                  </div>
                </div>
                <Switch
                  id="include-history"
                  checked={includeHistory}
                  onCheckedChange={setIncludeHistory}
                />
              </div>

              {includeHistory && (
                <div className="space-y-2 pl-8">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-history">Maximum History Messages</Label>
                    <span className="text-sm font-medium">{maxHistoryMessages}</span>
                  </div>
                  <Slider
                    id="max-history"
                    min={1}
                    max={50}
                    step={1}
                    value={[maxHistoryMessages]}
                    onValueChange={(values) => setMaxHistoryMessages(values[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of previous messages to include for context
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </div>
      </Card>
    </div>
  );
};
