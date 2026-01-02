import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ModelCategoryBadge } from './ModelCategoryBadge';
import { useModels } from '@/hooks/useModels';
import type { AIModel } from '@/types/models';

interface ModelsListProps {
  onEditModel: (model: AIModel) => void;
}

export const ModelsList = ({ onEditModel }: ModelsListProps) => {
  const { models, isLoading, toggleModelActive, deleteModel } = useModels();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<'name' | 'provider' | 'best_for' | 'is_active' | 'pricing_prompt' | 'is_default'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch = 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.model_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvider = filterProvider === 'all' || model.provider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [models, searchQuery, filterProvider]);

  const sortedModels = useMemo(() => {
    const sorted = [...filteredModels];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
        case 'provider':
        case 'best_for':
          comparison = a[sortColumn].toLowerCase().localeCompare(b[sortColumn].toLowerCase());
          break;
        case 'is_active':
        case 'is_default':
          comparison = (a[sortColumn] === b[sortColumn]) ? 0 : a[sortColumn] ? -1 : 1;
          break;
        case 'pricing_prompt':
          comparison = a.pricing_prompt - b.pricing_prompt;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredModels, sortColumn, sortDirection]);

  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedModels.slice(startIndex, endIndex);
  }, [sortedModels, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedModels.length / itemsPerPage);

  const providers = ['all', ...Array.from(new Set(models.map((m) => m.provider)))];

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleProviderChange = (value: string) => {
    setFilterProvider(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteModel(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="px-4 py-2 rounded-md border border-border bg-background"
        >
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider === 'all' ? 'All Providers' : provider}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Model
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('provider')}
              >
                <div className="flex items-center">
                  Provider
                  {getSortIcon('provider')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('best_for')}
              >
                <div className="flex items-center">
                  Category
                  {getSortIcon('best_for')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('is_active')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('pricing_prompt')}
              >
                <div className="flex items-center">
                  Pricing
                  {getSortIcon('pricing_prompt')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('is_default')}
              >
                <div className="flex items-center">
                  Default
                  {getSortIcon('is_default')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No models found
                </TableCell>
              </TableRow>
            ) : (
              paginatedModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.model_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{model.provider}</TableCell>
                  <TableCell>
                    <ModelCategoryBadge category={model.best_for} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={(checked) => toggleModelActive(model.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {model.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {model.is_free ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <div className="text-sm">
                        <div>${model.pricing_prompt.toFixed(2)}/M prompt</div>
                        <div className="text-muted-foreground">${model.pricing_completion.toFixed(2)}/M completion</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {model.is_default && <Badge>Default</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        onClick={() => handleDelete(model.id, model.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {sortedModels.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, sortedModels.length)} of {sortedModels.length} models
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first page, last page, current page, and pages around current
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, array) => (
                <div key={page} className="flex items-center gap-1">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-9"
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
