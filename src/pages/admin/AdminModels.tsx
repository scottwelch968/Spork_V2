import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw } from 'lucide-react';
import { ModelsList, ModelForm, ModelConfigTab, PreMessageConfigTab, FallbackModelsList, FallbackModelForm } from '@/admin/components/models';
import type { AIModel } from '@/types/models';
import type { FallbackModel } from '@/types/fallbackModels';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useModels } from '@/hooks/useModels';
import { useFallbackModels } from '@/hooks/useFallbackModels';
const AdminModels = () => {
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedFallbackModel, setSelectedFallbackModel] = useState<FallbackModel | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFallbackFormOpen, setIsFallbackFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('models');
  const { toast } = useToast();
  const { refetch } = useModels();
  const { refetch: refetchFallback } = useFallbackModels();

  const handleAddModel = () => {
    setSelectedModel(null);
    setIsFormOpen(true);
  };

  const handleEditModel = (model: AIModel) => {
    setSelectedModel(model);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedModel(null);
    setIsFormOpen(false);
  };

  const handleAddFallbackModel = () => {
    setSelectedFallbackModel(null);
    setIsFallbackFormOpen(true);
  };

  const handleEditFallbackModel = (model: FallbackModel) => {
    setSelectedFallbackModel(model);
    setIsFallbackFormOpen(true);
  };

  const handleCloseFallbackForm = () => {
    setSelectedFallbackModel(null);
    setIsFallbackFormOpen(false);
  };

  const handleSyncOpenRouter = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-openrouter-models');
      
      if (error) throw error;

      toast({
        title: 'Sync complete',
        description: `Fetched ${data.total_fetched} models. Added ${data.new_models} new, updated ${data.updated_models} existing.`,
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="models" className="data-[state=active]:bg-background text-foreground">Models</TabsTrigger>
            <TabsTrigger value="failover" className="data-[state=active]:bg-background text-foreground">Fail Over Models</TabsTrigger>
            <TabsTrigger value="configuration" className="data-[state=active]:bg-background text-foreground">Configuration</TabsTrigger>
            <TabsTrigger value="pre-message" className="data-[state=active]:bg-background text-foreground">Pre-Message</TabsTrigger>
          </TabsList>

          {activeTab === 'models' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSyncOpenRouter}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync OpenRouter
              </Button>
              <Button onClick={handleAddModel}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </div>
          )}

          {activeTab === 'failover' && (
            <Button onClick={handleAddFallbackModel}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fallback Model
            </Button>
          )}
        </div>

        <TabsContent value="models" className="space-y-4">
          <ModelsList onEditModel={handleEditModel} />
        </TabsContent>

        <TabsContent value="failover" className="space-y-4">
          <FallbackModelsList onEditModel={handleEditFallbackModel} />
        </TabsContent>

        <TabsContent value="configuration">
          <ModelConfigTab />
        </TabsContent>

        <TabsContent value="pre-message">
          <PreMessageConfigTab />
        </TabsContent>
      </Tabs>

      <ModelForm
        model={selectedModel}
        open={isFormOpen}
        onClose={handleCloseForm}
      />

      <FallbackModelForm
        model={selectedFallbackModel}
        open={isFallbackFormOpen}
        onClose={handleCloseFallbackForm}
      />
    </div>
  );
};

export default AdminModels;
