import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Trash2, Star } from 'lucide-react';
import { useFallbackModels } from '@/hooks/useFallbackModels';
import { ModelCategoryBadge } from './ModelCategoryBadge';
import type { FallbackModel } from '@/types/fallbackModels';

interface FallbackModelsListProps {
  onEditModel: (model: FallbackModel) => void;
}

export const FallbackModelsList = ({ onEditModel }: FallbackModelsListProps) => {
  const { models, isLoading, toggleModelActive, deleteModel, bulkToggleActive, setDefaultModel } = useFallbackModels();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.model_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || model.best_for === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedModels(filteredModels.map(m => m.id));
    } else {
      setSelectedModels([]);
    }
  };

  const handleSelectModel = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, id]);
    } else {
      setSelectedModels(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkActivate = () => {
    bulkToggleActive(selectedModels, true);
    setSelectedModels([]);
  };

  const handleBulkDeactivate = () => {
    bulkToggleActive(selectedModels, false);
    setSelectedModels([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fail Over Models (Lovable AI)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage Lovable AI models used as fallback when primary OpenRouter models fail.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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

        {/* Bulk Actions */}
        {selectedModels.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedModels.length} selected</span>
            <Button variant="outline" size="sm" onClick={handleBulkActivate}>
              Activate
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
              Deactivate
            </Button>
          </div>
        )}

        {/* Models Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedModels.length === filteredModels.length && filteredModels.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={(checked) => handleSelectModel(model.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {model.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.model_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ModelCategoryBadge category={model.best_for} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={model.is_active}
                    onCheckedChange={(checked) => toggleModelActive(model.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!model.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultModel(model.id)}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditModel(model)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteModel(model.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredModels.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No fallback models found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
