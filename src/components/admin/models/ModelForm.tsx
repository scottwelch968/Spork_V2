import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useModels } from '@/hooks/useModels';
import type { AIModel, ModelCategory } from '@/types/models';

interface ModelFormProps {
  model: AIModel | null;
  open: boolean;
  onClose: () => void;
}

export const ModelForm = ({ model, open, onClose }: ModelFormProps) => {
  const { createModel, updateModel } = useModels();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    model_id: '',
    name: '',
    provider: 'Lovable AI',
    description: '',
    best_for: 'general' as ModelCategory,
    best_for_description: '',
    context_length: 128000,
    max_completion_tokens: 4096,
    pricing_prompt: 0,
    pricing_completion: 0,
    default_temperature: 0.7,
    default_top_p: 0.95,
    default_top_k: 0,
    default_max_tokens: 2048,
    default_frequency_penalty: 0,
    default_presence_penalty: 0,
    rate_limit_rpm: 60,
    rate_limit_tpm: 100000,
    is_active: true,
    is_default: false,
    is_free: false,
    requires_api_key: false,
    display_order: 0,
  });

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
        pricing_prompt: model.pricing_prompt,
        pricing_completion: model.pricing_completion,
        default_temperature: model.default_temperature,
        default_top_p: model.default_top_p,
        default_top_k: model.default_top_k,
        default_max_tokens: model.default_max_tokens,
        default_frequency_penalty: model.default_frequency_penalty,
        default_presence_penalty: model.default_presence_penalty,
        rate_limit_rpm: model.rate_limit_rpm,
        rate_limit_tpm: model.rate_limit_tpm,
        is_active: model.is_active,
        is_default: model.is_default,
        is_free: model.is_free,
        requires_api_key: model.requires_api_key,
        display_order: model.display_order,
      });
    }
  }, [model]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const modelData = {
        ...formData,
        input_modalities: ['text'],
        output_modalities: ['text'],
        supported_parameters: ['temperature', 'top_p', 'max_tokens', 'frequency_penalty', 'presence_penalty'],
      };

      if (model) {
        await updateModel(model.id, modelData);
      } else {
        await createModel(modelData as any);
      }
      onClose();
    } catch (error) {
      console.error('Error saving model:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? 'Edit Model' : 'Add Model'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label>Model ID</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="e.g., google/gemini-2.5-flash"
              />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gemini 2.5 Flash"
              />
            </div>
            <div>
              <Label>Provider</Label>
              <Input
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Best For</Label>
              <select
                value={formData.best_for}
                onChange={(e) => setFormData({ ...formData, best_for: e.target.value as ModelCategory })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="conversation">Conversation</option>
                <option value="coding">Coding</option>
                <option value="research">Research</option>
                <option value="writing">Writing</option>
                <option value="image_generation">Image Generation</option>
                <option value="image_understanding">Image Understanding</option>
                <option value="video_understanding">Video Understanding</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <Label>Best For Description</Label>
              <Textarea
                value={formData.best_for_description}
                onChange={(e) => setFormData({ ...formData, best_for_description: e.target.value })}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <div>
              <Label>Context Length</Label>
              <Input
                type="number"
                value={formData.context_length}
                onChange={(e) => setFormData({ ...formData, context_length: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Max Completion Tokens</Label>
              <Input
                type="number"
                value={formData.max_completion_tokens}
                onChange={(e) => setFormData({ ...formData, max_completion_tokens: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <div>
              <Label>Temperature: {formData.default_temperature}</Label>
              <Slider
                value={[formData.default_temperature]}
                onValueChange={([value]) => setFormData({ ...formData, default_temperature: value })}
                min={0}
                max={2}
                step={0.1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Controls randomness (0 = focused, 2 = creative)</p>
            </div>
            <div>
              <Label>Top P: {formData.default_top_p}</Label>
              <Slider
                value={[formData.default_top_p]}
                onValueChange={([value]) => setFormData({ ...formData, default_top_p: value })}
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Nucleus sampling threshold</p>
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={formData.default_max_tokens}
                onChange={(e) => setFormData({ ...formData, default_max_tokens: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Frequency Penalty: {formData.default_frequency_penalty}</Label>
              <Slider
                value={[formData.default_frequency_penalty]}
                onValueChange={([value]) => setFormData({ ...formData, default_frequency_penalty: value })}
                min={-2}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Presence Penalty: {formData.default_presence_penalty}</Label>
              <Slider
                value={[formData.default_presence_penalty]}
                onValueChange={([value]) => setFormData({ ...formData, default_presence_penalty: value })}
                min={-2}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Top K</Label>
              <Input
                type="number"
                value={formData.default_top_k}
                onChange={(e) => setFormData({ ...formData, default_top_k: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div>
              <Label>Prompt Price (per million tokens)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.pricing_prompt}
                onChange={(e) => setFormData({ ...formData, pricing_prompt: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Completion Price (per million tokens)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.pricing_completion}
                onChange={(e) => setFormData({ ...formData, pricing_completion: parseFloat(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <div>
              <Label>Requests Per Minute</Label>
              <Input
                type="number"
                value={formData.rate_limit_rpm}
                onChange={(e) => setFormData({ ...formData, rate_limit_rpm: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Tokens Per Minute</Label>
              <Input
                type="number"
                value={formData.rate_limit_tpm}
                onChange={(e) => setFormData({ ...formData, rate_limit_tpm: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Is Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Set as Default</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Is Free</Label>
              <Switch
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Requires API Key</Label>
              <Switch
                checked={formData.requires_api_key}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_api_key: checked })}
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : model ? 'Update Model' : 'Create Model'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
