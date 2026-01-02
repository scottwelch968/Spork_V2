import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useModels } from '@/hooks/useModels';
import { toast } from 'sonner';
import { 
  Loader2, 
  Zap, 
  Save, 
  ChevronDown, 
  DollarSign, 
  Sparkles, 
  Crown,
  Brain,
  Wand2,
  FileText
} from 'lucide-react';
import type { CosmoRoutingConfig, CosmoConfig } from '@/cosmo/contracts';

const DEFAULT_ROUTING_PROMPT = `You are Cosmo, an intelligent AI routing assistant. Analyze the user prompt and determine the best category for handling it.

Categories:
- conversation: General chat, Q&A, casual discussion
- coding: Programming, debugging, code review, algorithms
- research: Analysis, investigation, deep study, comparisons
- writing: Essays, articles, blogs, creative writing, emails
- image_generation: Creating images, pictures, visual content
- video_generation: Creating videos, animations
- deep_think: Complex reasoning, math, logic puzzles

Respond with ONLY the category name, nothing else.`;

const DEFAULT_ENHANCE_PROMPT = `You are Cosmo, an expert prompt engineer. Your task is to enhance and improve the user's prompt to make it clearer, more specific, and more likely to get a high-quality AI response. 

Guidelines:
- Make the prompt more detailed and specific
- Add relevant context or constraints if helpful
- Improve clarity and structure
- Keep the original intent intact
- Return ONLY the enhanced prompt, nothing else`;

export function CosmoConfigurationTab() {
  const { settings, isLoading: settingsLoading, updateSetting, getSetting } = useSystemSettings();
  const { models, isLoading: modelsLoading } = useModels();
  
  // Routing state
  const [routingEnabled, setRoutingEnabled] = useState(true);
  const [routingModelId, setRoutingModelId] = useState('');
  const [costWeight, setCostWeight] = useState(50);
  const [routingPrompt, setRoutingPrompt] = useState(DEFAULT_ROUTING_PROMPT);
  
  // Enhancement state
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [enhanceModelId, setEnhanceModelId] = useState('');
  const [enhancePrompt, setEnhancePrompt] = useState(DEFAULT_ENHANCE_PROMPT);
  const [usePreMessageContext, setUsePreMessageContext] = useState(false);
  
  // Response formatting state
  const [formattingEnabled, setFormattingEnabled] = useState(false);
  const [formattingRules, setFormattingRules] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedSettings = useRef(false);

  // Section collapse state
  const [routingOpen, setRoutingOpen] = useState(true);
  const [enhanceOpen, setEnhanceOpen] = useState(true);
  const [formattingOpen, setFormattingOpen] = useState(false);

  const openRouterModels = models.filter(m => m.provider === 'OpenRouter' && m.is_active);

  useEffect(() => {
    if (!settingsLoading && settings.length > 0 && !hasLoadedSettings.current) {
      hasLoadedSettings.current = true;
      
      // Load routing config
      const routingConfig = settings.find(s => s.setting_key === 'cosmo_routing_config');
      if (routingConfig?.setting_value) {
        const config = routingConfig.setting_value as CosmoRoutingConfig;
        setRoutingEnabled(config.enabled ?? true);
        setRoutingModelId(config.model_id || '');
        setCostWeight(config.cost_performance_weight ?? 50);
        setRoutingPrompt(config.system_prompt || DEFAULT_ROUTING_PROMPT);
      }
      
      // Load enhance config
      const enhanceConfig = getSetting('cosmo_config');
      if (enhanceConfig?.setting_value) {
        const config = enhanceConfig.setting_value as CosmoConfig;
        setEnhanceEnabled(config.enabled ?? true);
        setEnhanceModelId(config.model_id || '');
        setEnhancePrompt(config.system_prompt || DEFAULT_ENHANCE_PROMPT);
        setUsePreMessageContext(config.use_pre_message_context ?? false);
      }
      
      // Load formatting rules
      const formattingConfig = getSetting('response_formatting_rules');
      if (formattingConfig?.setting_value) {
        const config = formattingConfig.setting_value as { enabled?: boolean; rules?: string };
        setFormattingEnabled(config.enabled ?? false);
        setFormattingRules(config.rules || '');
      }
    }
  }, [settingsLoading, settings, getSetting]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save routing config
      await updateSetting('cosmo_routing_config', {
        enabled: routingEnabled,
        model_id: routingModelId,
        provider: 'OpenRouter',
        cost_performance_weight: costWeight,
        system_prompt: routingPrompt,
        available_categories: ['conversation', 'coding', 'research', 'writing', 'image_generation', 'video_generation', 'deep_think'],
        fallback_category: 'conversation',
      });
      
      // Save enhance config
      await updateSetting('cosmo_config', {
        enabled: enhanceEnabled,
        model_id: enhanceModelId,
        system_prompt: enhancePrompt,
        use_pre_message_context: usePreMessageContext,
      });
      
      // Save formatting rules
      await updateSetting('response_formatting_rules', {
        enabled: formattingEnabled,
        rules: formattingRules,
      });
      
      toast.success('All COSMO configuration saved successfully');
    } catch (error: any) {
      toast.error('Failed to save configuration', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getCostTierLabel = (weight: number): string => {
    if (weight <= 33) return 'Lowest Cost';
    if (weight <= 66) return 'Balanced';
    return 'Best Quality';
  };

  const getCostTierIcon = (weight: number) => {
    if (weight <= 33) return <DollarSign className="h-4 w-4 text-green-500" />;
    if (weight <= 66) return <Sparkles className="h-4 w-4 text-yellow-500" />;
    return <Crown className="h-4 w-4 text-purple-500" />;
  };

  const isLoading = settingsLoading || modelsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Routing Configuration */}
      <Collapsible open={routingOpen} onOpenChange={setRoutingOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Model Routing</CardTitle>
                    <CardDescription>Configure intelligent model selection</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={routingEnabled}
                    onCheckedChange={setRoutingEnabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ChevronDown className={`h-4 w-4 transition-transform ${routingOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label>Cosmo's Brain (Routing Model)</Label>
                <Select value={routingModelId} onValueChange={setRoutingModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an OpenRouter model" />
                  </SelectTrigger>
                  <SelectContent>
                    {openRouterModels.map((model) => (
                      <SelectItem key={model.id} value={model.model_id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Cost-Performance Weight</Label>
                  <div className="flex items-center gap-2">
                    {getCostTierIcon(costWeight)}
                    <span className="text-sm font-medium">{getCostTierLabel(costWeight)}</span>
                  </div>
                </div>
                <Slider
                  value={[costWeight]}
                  onValueChange={(value) => setCostWeight(value[0])}
                  min={0}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lowest Cost</span>
                  <span>Balanced</span>
                  <span>Best Quality</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Routing System Prompt</Label>
                  <Button variant="ghost" size="sm" onClick={() => setRoutingPrompt(DEFAULT_ROUTING_PROMPT)}>
                    Reset
                  </Button>
                </div>
                <Textarea
                  value={routingPrompt}
                  onChange={(e) => setRoutingPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Enhancement Configuration */}
      <Collapsible open={enhanceOpen} onOpenChange={setEnhanceOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Wand2 className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Prompt Enhancement</CardTitle>
                    <CardDescription>Configure how prompts are improved before sending</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={enhanceEnabled}
                    onCheckedChange={setEnhanceEnabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ChevronDown className={`h-4 w-4 transition-transform ${enhanceOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label>Enhancement Model</Label>
                <Select value={enhanceModelId} onValueChange={setEnhanceModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an OpenRouter model" />
                  </SelectTrigger>
                  <SelectContent>
                    {openRouterModels.map((model) => (
                      <SelectItem key={model.id} value={model.model_id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Pre-Message Context</Label>
                  <p className="text-sm text-muted-foreground">
                    Include persona, personal context, and history
                  </p>
                </div>
                <Switch
                  checked={usePreMessageContext}
                  onCheckedChange={setUsePreMessageContext}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Enhancement System Prompt</Label>
                  <Button variant="ghost" size="sm" onClick={() => setEnhancePrompt(DEFAULT_ENHANCE_PROMPT)}>
                    Reset
                  </Button>
                </div>
                <Textarea
                  value={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Response Formatting */}
      <Collapsible open={formattingOpen} onOpenChange={setFormattingOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Response Formatting</CardTitle>
                    <CardDescription>Global formatting rules for AI responses</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formattingEnabled}
                    onCheckedChange={setFormattingEnabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ChevronDown className={`h-4 w-4 transition-transform ${formattingOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Formatting Rules</Label>
                <Textarea
                  value={formattingRules}
                  onChange={(e) => setFormattingRules(e.target.value)}
                  rows={10}
                  placeholder="Enter formatting guidelines that will be prepended to all AI responses..."
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  These rules will be added to the system prompt for all chat responses.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save All Configuration
        </Button>
      </div>
    </div>
  );
}
