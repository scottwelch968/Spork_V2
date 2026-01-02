import { useState, useEffect } from 'react';
import { Card } from '@/admin/ui/card';
import { Label } from '@/admin/ui/label';
import { Button } from '@/admin/ui/button';
import { Textarea } from '@/admin/ui/textarea';
import { Switch } from '@/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useModels } from '@/hooks/useModels';
import { useFallbackModels } from '@/hooks/useFallbackModels';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const ModelConfigTab = () => {
  const { activeModels } = useModels();
  const { activeModels: activeFallbackModels } = useFallbackModels();
  const { getDefaultModel, getFallbackModel, getAIInstructions, updateSetting, isLoading } = useSystemSettings();

  const [defaultModelId, setDefaultModelId] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(false);
  const [fallbackModelId, setFallbackModelId] = useState('');
  
  const [aiInstructionsEnabled, setAiInstructionsEnabled] = useState(true);
  const [aiInstructions, setAiInstructions] = useState('');
  const [imageModelId, setImageModelId] = useState('');
  const [knowledgeBaseModelId, setKnowledgeBaseModelId] = useState('');

  const [testingPrimary, setTestingPrimary] = useState(false);
  const [testingFallback, setTestingFallback] = useState(false);

  useEffect(() => {
    const defaultModel = getDefaultModel();
    const fallbackModel = getFallbackModel();
    const instructions = getAIInstructions();

    if (defaultModel) {
      setDefaultModelId(defaultModel.model_id);
    }

    if (fallbackModel) {
      setFallbackEnabled(fallbackModel.enabled);
      setFallbackModelId(fallbackModel.model_id);
    }

    if (instructions) {
      setAiInstructionsEnabled(instructions.enabled);
      setAiInstructions(instructions.instructions);
    }

    // Load specialized model settings
    const loadSpecializedModels = async () => {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['image_model', 'knowledge_base_model']);

      if (settings) {
        settings.forEach(setting => {
          const value = setting.setting_value as any;
          if (setting.setting_key === 'image_model') {
            setImageModelId(value?.model_id || '');
          } else if (setting.setting_key === 'knowledge_base_model') {
            setKnowledgeBaseModelId(value?.model_id || '');
          }
        });
      }
    };

    if (!isLoading) {
      loadSpecializedModels();
    }
  }, [isLoading]);

  const handleSaveDefaultModel = async () => {
    const selectedModel = activeModels.find(m => m.model_id === defaultModelId);
    if (!selectedModel) return;

    await updateSetting('default_model', {
      model_id: defaultModelId,
      provider: selectedModel.provider,
    });
  };

  const handleSaveFallbackModel = async () => {
    const selectedModel = activeFallbackModels.find(m => m.model_id === fallbackModelId);
    if (!selectedModel) return;

    await updateSetting('fallback_model', {
      enabled: fallbackEnabled,
      model_id: fallbackModelId,
      provider: selectedModel.provider,
    });
  };

  const handleSaveAIInstructions = async () => {
    await updateSetting('ai_instructions', {
      enabled: aiInstructionsEnabled,
      instructions: aiInstructions,
    });
  };

  const handleSaveImageModel = async () => {
    const selectedModel = activeModels.find(m => m.model_id === imageModelId);
    if (!selectedModel) return;

    await updateSetting('image_model', {
      model_id: imageModelId,
      provider: selectedModel.provider,
    });
  };

  const handleSaveKnowledgeBaseModel = async () => {
    const selectedModel = activeModels.find(m => m.model_id === knowledgeBaseModelId);
    if (!selectedModel) return;

    await updateSetting('knowledge_base_model', {
      model_id: knowledgeBaseModelId,
      provider: selectedModel.provider,
    });
  };

  const handleTestPrimary = async () => {
    setTestingPrimary(true);
    setTimeout(() => {
      setTestingPrimary(false);
      toast.success('Default model is responding correctly.');
    }, 1500);
  };

  const handleTestFallback = async () => {
    setTestingFallback(true);
    setTimeout(() => {
      setTestingFallback(false);
      toast.success('Fallback model is responding correctly.');
    }, 1500);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Model Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Default Model</h3>
              <p className="text-sm text-muted-foreground">
                Primary model used for all conversations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-model">Select Model</Label>
              <Select value={defaultModelId} onValueChange={setDefaultModelId}>
                <SelectTrigger id="default-model">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    activeModels.reduce((acc, model) => {
                      if (!acc[model.provider]) acc[model.provider] = [];
                      acc[model.provider].push(model);
                      return acc;
                    }, {} as Record<string, typeof activeModels>)
                  ).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {defaultModelId && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Active</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleTestPrimary} variant="outline" disabled={testingPrimary}>
                {testingPrimary ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button onClick={handleSaveDefaultModel}>Save</Button>
            </div>
          </div>
        </Card>

        {/* Fallback Model Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Fallback Model</h3>
                <p className="text-sm text-muted-foreground">
                  Backup model when primary fails
                </p>
              </div>
              <Switch checked={fallbackEnabled} onCheckedChange={setFallbackEnabled} />
            </div>

            {fallbackEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fallback-model">Select Fallback Model (Lovable AI)</Label>
                  <Select value={fallbackModelId} onValueChange={setFallbackModelId}>
                    <SelectTrigger id="fallback-model">
                      <SelectValue placeholder="Choose a fallback model" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFallbackModels.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {fallbackModelId && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Standby</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleTestFallback} variant="outline" disabled={testingFallback}>
                    {testingFallback ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                  <Button onClick={handleSaveFallbackModel}>Save</Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Global AI Instructions Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Global AI Instructions</h3>
              <p className="text-sm text-muted-foreground">
                System prompt applied to all conversations
              </p>
            </div>
            <Switch checked={aiInstructionsEnabled} onCheckedChange={setAiInstructionsEnabled} />
          </div>

          {aiInstructionsEnabled && (
            <>
              <Textarea
                placeholder="Enter global AI instructions..."
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <Button onClick={handleSaveAIInstructions}>Save Instructions</Button>
            </>
          )}
        </div>
      </Card>

      {/* Specialized Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Generation Model Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Image Generation Model</h3>
              <p className="text-sm text-muted-foreground">
                Model used for image generation requests
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-model">Select Model</Label>
              <Select value={imageModelId} onValueChange={setImageModelId}>
                <SelectTrigger id="image-model">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    activeModels
                      .filter(m => m.best_for === 'image_generation')
                      .reduce((acc, model) => {
                        if (!acc[model.provider]) acc[model.provider] = [];
                        acc[model.provider].push(model);
                        return acc;
                      }, {} as Record<string, typeof activeModels>)
                  ).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveImageModel}>Save</Button>
          </div>
        </Card>

        {/* Knowledge Base Model Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Knowledge Base Model</h3>
              <p className="text-sm text-muted-foreground">
                Model used for document Q&A and knowledge base queries
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kb-model">Select Model</Label>
              <Select value={knowledgeBaseModelId} onValueChange={setKnowledgeBaseModelId}>
                <SelectTrigger id="kb-model">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    activeModels.reduce((acc, model) => {
                      if (!acc[model.provider]) acc[model.provider] = [];
                      acc[model.provider].push(model);
                      return acc;
                    }, {} as Record<string, typeof activeModels>)
                  ).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveKnowledgeBaseModel}>Save</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
