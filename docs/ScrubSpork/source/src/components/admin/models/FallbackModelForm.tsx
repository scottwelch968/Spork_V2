import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFallbackModels } from '@/hooks/useFallbackModels';
import type { FallbackModel, ModelCategory } from '@/types/fallbackModels';

interface FallbackModelFormProps {
  model: FallbackModel | null;
  open: boolean;
  onClose: () => void;
}

const defaultFormData = {
  model_id: '',
  name: '',
  provider: 'Lovable AI',
  description: '',
  best_for: 'general' as ModelCategory,
  best_for_description: '',
  context_length: 128000,
  max_completion_tokens: 4096,
  input_modalities: ['text'],
  output_modalities: ['text'],
  pricing_prompt: 0,
  pricing_completion: 0,
  default_temperature: 0.7,
  default_top_p: 0.95,
  default_top_k: 0,
  default_max_tokens: 2048,
  default_frequency_penalty: 0,
  default_presence_penalty: 0,
  supported_parameters: ['temperature', 'top_p', 'max_tokens'],
  rate_limit_rpm: 60,
  rate_limit_tpm: 100000,
  is_active: true,
  is_default: false,
  is_free: false,
  requires_api_key: false,
  display_order: 0,
  icon_url: '',
};

export const FallbackModelForm = ({ model, open, onClose }: FallbackModelFormProps) => {
  const { createModel, updateModel } = useFallbackModels();
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData({
        model_id: model.model_id,
        name: model.name,
        provider: model.provider,
        description: model.description || '',
        best_for: model.best_for,
        best_for_description: model.best_for_description || '',
        context_length: model.context_length,
        max_completion_tokens: model.max_completion_tokens,
        input_modalities: model.input_modalities || ['text'],
        output_modalities: model.output_modalities || ['text'],
        pricing_prompt: model.pricing_prompt,
        pricing_completion: model.pricing_completion,
        default_temperature: model.default_temperature,
        default_top_p: model.default_top_p,
        default_top_k: model.default_top_k,
        default_max_tokens: model.default_max_tokens,
        default_frequency_penalty: model.default_frequency_penalty,
        default_presence_penalty: model.default_presence_penalty,
        supported_parameters: model.supported_parameters || ['temperature', 'top_p', 'max_tokens'],
        rate_limit_rpm: model.rate_limit_rpm,
        rate_limit_tpm: model.rate_limit_tpm,
        is_active: model.is_active,
        is_default: model.is_default,
        is_free: model.is_free,
        requires_api_key: model.requires_api_key,
        display_order: model.display_order,
        icon_url: model.icon_url || '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        icon_url: formData.icon_url || null,
        description: formData.description || null,
        best_for_description: formData.best_for_description || null,
      };

      if (model) {
        await updateModel(model.id, submitData);
      } else {
        await createModel(submitData as any);
      }
      onClose();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? 'Edit Fallback Model' : 'Add Fallback Model'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_id">Model ID</Label>
                  <Input
                    id="model_id"
                    value={formData.model_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
                    placeholder="google/gemini-2.5-flash"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Gemini 2.5 Flash"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Lovable AI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Model description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="best_for">Best For</Label>
                  <Select
                    value={formData.best_for}
                    onValueChange={(value: ModelCategory) => setFormData(prev => ({ ...prev, best_for: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="image_generation">Image Generation</SelectItem>
                      <SelectItem value="image_understanding">Image Understanding</SelectItem>
                      <SelectItem value="video_understanding">Video Understanding</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="context_length">Context Length</Label>
                  <Input
                    id="context_length"
                    type="number"
                    value={formData.context_length}
                    onChange={(e) => setFormData(prev => ({ ...prev, context_length: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_completion_tokens">Max Completion Tokens</Label>
                  <Input
                    id="max_completion_tokens"
                    type="number"
                    value={formData.max_completion_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_completion_tokens: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate_limit_rpm">Rate Limit (RPM)</Label>
                  <Input
                    id="rate_limit_rpm"
                    type="number"
                    value={formData.rate_limit_rpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_rpm: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate_limit_tpm">Rate Limit (TPM)</Label>
                  <Input
                    id="rate_limit_tpm"
                    type="number"
                    value={formData.rate_limit_tpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_tpm: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricing_prompt">Pricing (Prompt) per 1M tokens</Label>
                  <Input
                    id="pricing_prompt"
                    type="number"
                    step="0.0001"
                    value={formData.pricing_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_prompt: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing_completion">Pricing (Completion) per 1M tokens</Label>
                  <Input
                    id="pricing_completion"
                    type="number"
                    step="0.0001"
                    value={formData.pricing_completion}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_completion: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_temperature">Temperature</Label>
                  <Input
                    id="default_temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.default_temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_temperature: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_top_p">Top P</Label>
                  <Input
                    id="default_top_p"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.default_top_p}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_top_p: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_top_k">Top K</Label>
                  <Input
                    id="default_top_k"
                    type="number"
                    value={formData.default_top_k}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_top_k: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_max_tokens">Max Tokens</Label>
                  <Input
                    id="default_max_tokens"
                    type="number"
                    value={formData.default_max_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_max_tokens: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_frequency_penalty">Frequency Penalty</Label>
                  <Input
                    id="default_frequency_penalty"
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={formData.default_frequency_penalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_frequency_penalty: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_presence_penalty">Presence Penalty</Label>
                  <Input
                    id="default_presence_penalty"
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={formData.default_presence_penalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_presence_penalty: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Model is available for use</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Free Tier</Label>
                  <p className="text-sm text-muted-foreground">Available on free plan</p>
                </div>
                <Switch
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Requires API Key</Label>
                  <p className="text-sm text-muted-foreground">User must provide their own API key</p>
                </div>
                <Switch
                  checked={formData.requires_api_key}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_api_key: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon_url">Icon URL</Label>
                <Input
                  id="icon_url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : model ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
