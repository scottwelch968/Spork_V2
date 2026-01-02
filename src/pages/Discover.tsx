import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Boxes, FileText, Bot, Search, Sparkles, Star, User } from 'lucide-react';
import { getCategoryIcon } from '@/utils/categoryIcons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';
import { usePromptCategories } from '@/hooks/usePromptCategories';
import { usePrompts } from '@/hooks/usePrompts';
import { useSpace } from '@/hooks/useSpace';
import { useSpaceTemplates } from '@/hooks/useSpaceTemplates';
import { usePersonaTemplates } from '@/hooks/usePersonaTemplates';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ViewTemplateDialog } from '@/components/templates/ViewTemplateDialog';
import { ViewSpaceTemplateDialog } from '@/components/templates/ViewSpaceTemplateDialog';
import { ViewPersonaTemplateDialog } from '@/components/templates/ViewPersonaTemplateDialog';
import { TemplateSection } from '@/components/templates/TemplateSection';
import type { PromptTemplate } from '@/hooks/usePromptTemplates';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { useCategoryData } from '@/hooks/useCategoryData';
import { usePersonaActions } from '@/hooks/usePersonaActions';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

const ITEMS_PER_PAGE_DEFAULT = 10;

export default function Discover() {
  const [activeTab, setActiveTab] = useState('spaces');
  const { toast } = useToast();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topBarSearchQuery = searchParams.get('q') || '';
  
  const { currentSpace, createSpace } = useSpace();
  // Prompts now belong to user directly, not workspace
  const { createPrompt } = usePrompts();
  const [viewingTemplate, setViewingTemplate] = useState<PromptTemplate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSpaceTemplate, setViewingSpaceTemplate] = useState<any>(null);
  const [spaceViewDialogOpen, setSpaceViewDialogOpen] = useState(false);
  const [selectedSpaceCategory, setSelectedSpaceCategory] = useState<string | null>(null);
  const [spaceFilterType, setSpaceFilterType] = useState<'featured' | 'featured-all' | 'popular' | 'all'>('featured');
  const [selectedPersonaCategory, setSelectedPersonaCategory] = useState<string | null>(null);
  const [viewingPersonaTemplate, setViewingPersonaTemplate] = useState<any>(null);
  const [personaViewDialogOpen, setPersonaViewDialogOpen] = useState(false);
  const [personaFilterType, setPersonaFilterType] = useState<'featured' | 'featured-all' | 'popular' | 'all'>('featured');
  const [promptFilterType, setPromptFilterType] = useState<'featured' | 'featured-all' | 'popular' | 'all'>('featured');

  // Pagination state for each tab
  const [spacePage, setSpacePage] = useState(1);
  const [spaceItemsPerPage, setSpaceItemsPerPage] = useState<number | 'all'>(10);
  const [promptPage, setPromptPage] = useState(1);
  const [promptItemsPerPage, setPromptItemsPerPage] = useState<number | 'all'>(10);
  const [personaPage, setPersonaPage] = useState(1);
  const [personaItemsPerPage, setPersonaItemsPerPage] = useState<number | 'all'>(10);
  const {
    templates,
    featuredTemplates,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    incrementUseCount,
  } = usePromptTemplates();
  const { categories } = usePromptCategories();
  const { 
    templates: spaceTemplates, 
    loading: templatesLoading,
  } = useSpaceTemplates();
  
  // Use hook for categories
  const { spaceCategories, personaCategories } = useCategoryData();
  
  const {
    templates: personaTemplates, 
    loading: personasLoading,
  } = usePersonaTemplates();
  
  // Use hook for persona actions
  const { savePersona, importPersonaToWorkspace } = usePersonaActions();
  const { user } = useAuth();

  const handleUseTemplate = async (template: PromptTemplate) => {
    await incrementUseCount(template.id);
    await navigator.clipboard.writeText(template.content);
    toast({
      title: 'Copied to clipboard',
      description: 'Template content has been copied. You can paste it in the chat.',
    });
  };

  const handleSaveTemplate = async (template: PromptTemplate) => {

    try {
      await createPrompt(
        template.title,
        template.content,
        template.category?.name || null
      );
      await incrementUseCount(template.id);
      toast({
        title: 'Saved to your prompts',
        description: 'Template has been added to your prompt library',
      });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleViewTemplate = (template: PromptTemplate) => {
    setViewingTemplate(template);
    setViewDialogOpen(true);
  };

  const handleUseSpaceTemplate = async (template: any) => {
    try {
      await createSpace({
        name: `${template.name} - Copy`,
        description: template.description || '',
        color_code: template.color_code || '#3B82F6'
      });
      toast({
        title: 'Space created',
        description: 'New space created from template successfully',
      });
      navigate('/workspace');
    } catch (error) {
      console.error('Error creating space from template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create space from template',
        variant: 'destructive',
      });
    }
  };

  const handleViewSpaceTemplate = (template: any) => {
    setViewingSpaceTemplate(template);
    setSpaceViewDialogOpen(true);
  };

  const handleViewPersonaTemplate = (template: any) => {
    setViewingPersonaTemplate(template);
    setPersonaViewDialogOpen(true);
  };

  const handleSavePersonaTemplate = (template: any) => {
    savePersona(template);
  };

  const handleUsePersonaTemplate = (template: any) => {
    if (!currentSpace) {
      toast({
        title: 'No active space',
        description: 'Please select a space first',
        variant: 'destructive',
      });
      return;
    }

    importPersonaToWorkspace({ template, workspaceId: currentSpace.id });
    setPersonaViewDialogOpen(false);
  };


  // Featured Space Templates (only featured, active)
  const featuredSpaceTemplates = useMemo(() => {
    if (!spaceTemplates) return [];
    return spaceTemplates
      .filter(t => t.is_featured && t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [spaceTemplates]);

  // Popular Space Templates (sorted by use_count descending)
  const popularSpaceTemplates = useMemo(() => {
    if (!spaceTemplates) return [];
    return [...spaceTemplates]
      .filter(t => t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [spaceTemplates]);

  // Featured Prompt Templates
  const featuredPromptTemplates = useMemo(() => {
    return templates
      .filter(t => t.is_featured && t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [templates]);

  // Popular Prompt Templates (sorted by use_count descending)
  const popularPromptTemplates = useMemo(() => {
    return [...templates]
      .filter(t => t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [templates]);

  // Featured Persona Templates
  const featuredPersonaTemplates = useMemo(() => {
    return personaTemplates
      .filter(t => t.is_featured && t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [personaTemplates]);

  // Popular Persona Templates (sorted by use_count descending)
  const popularPersonaTemplates = useMemo(() => {
    return [...personaTemplates]
      .filter(t => t.is_active)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [personaTemplates]);

  // Filtered templates for non-featured views
  const filteredSpaceTemplates = useMemo(() => {
    if (!spaceTemplates) return [];
    
    return spaceTemplates
      .filter(template => {
        const matchesSearch = !topBarSearchQuery || 
          template.name.toLowerCase().includes(topBarSearchQuery.toLowerCase()) ||
          (template.description?.toLowerCase().includes(topBarSearchQuery.toLowerCase()) ?? false);
        
        const matchesCategory = selectedSpaceCategory === null || 
          template.category_id === selectedSpaceCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [spaceTemplates, topBarSearchQuery, selectedSpaceCategory]);

  const filteredPersonaTemplates = useMemo(() => {
    return personaTemplates
      .filter(t => {
        const matchesSearch = t.is_active && (
          !topBarSearchQuery ||
          t.name.toLowerCase().includes(topBarSearchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(topBarSearchQuery.toLowerCase()) ||
          t.category?.name?.toLowerCase().includes(topBarSearchQuery.toLowerCase())
        );
        
        const matchesCategory = selectedPersonaCategory === null || t.category_id === selectedPersonaCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [personaTemplates, topBarSearchQuery, selectedPersonaCategory]);

  const filteredPromptTemplates = useMemo(() => {
    return templates
      .filter(template => {
        const matchesCategory = !selectedCategory || template.category_id === selectedCategory;
        const matchesSearch = !topBarSearchQuery || 
          template.title.toLowerCase().includes(topBarSearchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(topBarSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
  }, [templates, selectedCategory, topBarSearchQuery]);

  // Reset pages when filters/search change
  useEffect(() => {
    setSpacePage(1);
  }, [topBarSearchQuery, selectedSpaceCategory, spaceFilterType]);

  useEffect(() => {
    setPromptPage(1);
  }, [topBarSearchQuery, selectedCategory, promptFilterType]);

  useEffect(() => {
    setPersonaPage(1);
  }, [topBarSearchQuery, selectedPersonaCategory, personaFilterType]);

  // Paginated templates
  const paginatedSpaceTemplates = usePagination(filteredSpaceTemplates, spacePage, spaceItemsPerPage);
  const paginatedFeaturedSpaceTemplates = usePagination(featuredSpaceTemplates, spacePage, spaceItemsPerPage);
  const paginatedPopularSpaceTemplates = usePagination(popularSpaceTemplates, spacePage, spaceItemsPerPage);
  
  const paginatedPromptTemplates = usePagination(filteredPromptTemplates, promptPage, promptItemsPerPage);
  const paginatedFeaturedPromptTemplates = usePagination(featuredPromptTemplates, promptPage, promptItemsPerPage);
  const paginatedPopularPromptTemplates = usePagination(popularPromptTemplates, promptPage, promptItemsPerPage);
  
  const paginatedPersonaTemplates = usePagination(filteredPersonaTemplates, personaPage, personaItemsPerPage);
  const paginatedFeaturedPersonaTemplates = usePagination(featuredPersonaTemplates, personaPage, personaItemsPerPage);
  const paginatedPopularPersonaTemplates = usePagination(popularPersonaTemplates, personaPage, personaItemsPerPage);

  // Render functions for table list with icons
  const renderSpaceList = (templates: any[]) => {
    if (templates.length === 0) {
      return (
        <div className="ui-table-list-container">
          <div className="ui-table-list-empty">
            <Boxes className="ui-table-list-empty-icon" strokeWidth={1} />
            <p className="ui-table-list-empty-title">No space templates found</p>
          </div>
        </div>
      );
    }
    return (
      <div className="ui-table-list-container">
        <div className="ui-table-list-header">
          <div className="ui-table-list-header-title">Space</div>
          <div className="ui-table-list-header-time">Category</div>
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleViewSpaceTemplate(template)}
            className="ui-table-list-row group"
          >
            <div 
              className="ui-table-list-icon" 
              style={{ backgroundColor: template.color_code || '#3B82F6' }}
            >
              <DynamicIcon name={template.icon || 'Boxes'} className="ui-table-list-icon-inner text-white" />
            </div>
            <div className="ui-table-list-content">
              <p className="ui-table-list-title flex items-center gap-2">
                {template.name}
                {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </p>
              <p className="ui-table-list-desc">{template.description || 'No description'}</p>
            </div>
            <div className="ui-table-list-time">{template.category?.name || 'General'}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPromptList = (templates: any[]) => {
    if (templates.length === 0) {
      return (
        <div className="ui-table-list-container">
          <div className="ui-table-list-empty">
            <FileText className="ui-table-list-empty-icon" strokeWidth={1} />
            <p className="ui-table-list-empty-title">No prompt templates found</p>
          </div>
        </div>
      );
    }
    return (
      <div className="ui-table-list-container">
        <div className="ui-table-list-header">
          <div className="ui-table-list-header-title">Prompt</div>
          <div className="ui-table-list-header-time">Category</div>
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleViewTemplate(template)}
            className="ui-table-list-row group"
          >
            <div 
              className="ui-table-list-icon" 
              style={{ backgroundColor: template.color_code || '#3B82F6' }}
            >
              <DynamicIcon name={template.icon || 'FileText'} className="ui-table-list-icon-inner text-white" />
            </div>
            <div className="ui-table-list-content">
              <p className="ui-table-list-title flex items-center gap-2">
                {template.title}
                {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </p>
              <p className="ui-table-list-desc">{template.description || 'No description'}</p>
            </div>
            <div className="ui-table-list-time">{template.category?.name || 'General'}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPersonaList = (templates: any[]) => {
    if (templates.length === 0) {
      return (
        <div className="ui-table-list-container">
          <div className="ui-table-list-empty">
            <Bot className="ui-table-list-empty-icon" strokeWidth={1} />
            <p className="ui-table-list-empty-title">No persona templates found</p>
          </div>
        </div>
      );
    }
    return (
      <div className="ui-table-list-container">
        <div className="ui-table-list-header">
          <div className="ui-table-list-header-title">Persona</div>
          <div className="ui-table-list-header-time">Category</div>
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleViewPersonaTemplate(template)}
            className="ui-table-list-row group"
          >
            <div className="ui-table-list-icon bg-purple-500">
              {template.image_url ? (
                <img src={template.image_url} alt={template.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <User className="ui-table-list-icon-inner text-white" />
              )}
            </div>
            <div className="ui-table-list-content">
              <p className="ui-table-list-title flex items-center gap-2">
                {template.name}
                {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </p>
              <p className="ui-table-list-desc">{template.description || 'No description'}</p>
            </div>
            <div className="ui-table-list-time">{template.persona_categories?.name || 'General'}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto pt-[54px] px-6 pb-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Reset to default 'featured' view when switching tabs
          if (value === 'spaces') {
            setSpaceFilterType('featured');
            setSelectedSpaceCategory(null);
          } else if (value === 'prompts') {
            setPromptFilterType('featured');
            setSelectedCategory(null);
          } else {
            setPersonaFilterType('featured');
            setSelectedPersonaCategory(null);
          }
        }}>
          {/* Header row with tabs on left, filters on right */}
          <div className="flex items-center justify-between mb-0 border-b border-[#ACACAC] mb-[34px]">
            {/* Left side: Tabs + Category Dropdown */}
            <div className="flex items-center gap-4">
              <TabsList variant="underline">
                <TabsTrigger value="spaces">
                  <Boxes className="w-4 h-4" />
                  Spaces
                </TabsTrigger>
                <TabsTrigger value="prompts">
                  <FileText className="w-4 h-4" />
                  Prompts
                </TabsTrigger>
                <TabsTrigger value="personas">
                  <Bot className="w-4 h-4" />
                  Personas
                </TabsTrigger>
              </TabsList>

              <Select
                value={
                  activeTab === 'spaces'
                    ? (selectedSpaceCategory || (spaceFilterType === 'featured-all' ? 'featured' : spaceFilterType))
                    : activeTab === 'prompts'
                    ? (selectedCategory || (promptFilterType === 'featured-all' ? 'featured' : promptFilterType))
                    : (selectedPersonaCategory || (personaFilterType === 'featured-all' ? 'featured' : personaFilterType))
                }
                onValueChange={(value) => {
                  if (activeTab === 'spaces') {
                    if (value === 'featured') {
                      setSpaceFilterType('featured-all');
                      setSelectedSpaceCategory(null);
                    } else if (value === 'popular' || value === 'all') {
                      setSpaceFilterType(value);
                      setSelectedSpaceCategory(null);
                    } else {
                      setSpaceFilterType('all');
                      setSelectedSpaceCategory(value);
                    }
                  } else if (activeTab === 'prompts') {
                    if (value === 'featured') {
                      setPromptFilterType('featured-all');
                      setSelectedCategory(null);
                    } else if (value === 'popular' || value === 'all') {
                      setPromptFilterType(value);
                      setSelectedCategory(null);
                    } else {
                      setPromptFilterType('all');
                      setSelectedCategory(value);
                    }
                  } else {
                    if (value === 'featured') {
                      setPersonaFilterType('featured-all');
                      setSelectedPersonaCategory(null);
                    } else if (value === 'popular' || value === 'all') {
                      setPersonaFilterType(value);
                      setSelectedPersonaCategory(null);
                    } else {
                      setPersonaFilterType('all');
                      setSelectedPersonaCategory(value);
                    }
                  }
                }}
              >
                <SelectTrigger className="ui-select-trigger">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${(() => {
                      const filterType = activeTab === 'spaces' ? spaceFilterType : activeTab === 'prompts' ? promptFilterType : personaFilterType;
                      const category = activeTab === 'spaces' ? selectedSpaceCategory : activeTab === 'prompts' ? selectedCategory : selectedPersonaCategory;
                      return (filterType === 'featured' || filterType === 'featured-all') && !category ? 'text-yellow-500' : 'text-muted-foreground';
                    })()}`} />
                    <span>
                      {(() => {
                        const filterType = activeTab === 'spaces' ? spaceFilterType : activeTab === 'prompts' ? promptFilterType : personaFilterType;
                        const category = activeTab === 'spaces' ? selectedSpaceCategory : activeTab === 'prompts' ? selectedCategory : selectedPersonaCategory;
                        const cats = activeTab === 'spaces' ? spaceCategories : activeTab === 'prompts' ? categories : personaCategories;
                        if (category) return cats.find(c => c.id === category)?.name || 'Category';
                        if (filterType === 'featured' || filterType === 'featured-all') return 'Featured';
                        if (filterType === 'popular') return 'Popular';
                        return `All ${activeTab === 'spaces' ? 'Spaces' : activeTab === 'prompts' ? 'Prompts' : 'Personas'}`;
                      })()}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="all">
                    All {activeTab === 'spaces' ? 'Spaces' : activeTab === 'prompts' ? 'Prompts' : 'Personas'}
                  </SelectItem>
                  <div className="h-px bg-border my-1" />
                  {(activeTab === 'spaces' ? spaceCategories : activeTab === 'prompts' ? categories : personaCategories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spaces Tab */}
          <TabsContent value="spaces" className="mt-0">
            {templatesLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : spaceFilterType === 'featured' && !selectedSpaceCategory && !topBarSearchQuery ? (
              <>
                {/* Featured Templates Section */}
                <TemplateSection
                  title="Featured Templates"
                  templates={featuredSpaceTemplates}
                  onViewAll={() => setSpaceFilterType('featured-all')}
                  renderGrid={renderSpaceList}
                  maxItems={5}
                  viewAllLabel="View all featured"
                />

                {/* Popular Templates Section */}
                <TemplateSection
                  title="Popular Templates"
                  templates={popularSpaceTemplates}
                  onViewAll={() => setSpaceFilterType('popular')}
                  renderGrid={renderSpaceList}
                  maxItems={5}
                  viewAllLabel="View all popular"
                />

                {featuredSpaceTemplates.length === 0 && popularSpaceTemplates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No space templates found
                  </div>
                )}

                <ViewSpaceTemplateDialog
                  open={spaceViewDialogOpen}
                  onOpenChange={setSpaceViewDialogOpen}
                  template={viewingSpaceTemplate}
                  onCreateSpace={handleUseSpaceTemplate}
                />
              </>
            ) : spaceFilterType === 'featured-all' && !selectedSpaceCategory && !topBarSearchQuery ? (
              <>
                {/* All Featured Templates */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Featured Templates</h2>
                  </div>
                  {featuredSpaceTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No featured templates found
                    </div>
                  ) : (
                    <>
                      {renderSpaceList(paginatedFeaturedSpaceTemplates)}
                      <TablePagination
                        totalItems={featuredSpaceTemplates.length}
                        currentPage={spacePage}
                        setCurrentPage={setSpacePage}
                        itemsPerPage={spaceItemsPerPage}
                        setItemsPerPage={setSpaceItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewSpaceTemplateDialog
                  open={spaceViewDialogOpen}
                  onOpenChange={setSpaceViewDialogOpen}
                  template={viewingSpaceTemplate}
                  onCreateSpace={handleUseSpaceTemplate}
                />
              </>
            ) : spaceFilterType === 'popular' && !selectedSpaceCategory && !topBarSearchQuery ? (
              <>
                {/* Popular Templates Only */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Popular Templates</h2>
                  </div>
                  {popularSpaceTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No popular templates found
                    </div>
                  ) : (
                    <>
                      {renderSpaceList(paginatedPopularSpaceTemplates)}
                      <TablePagination
                        totalItems={popularSpaceTemplates.length}
                        currentPage={spacePage}
                        setCurrentPage={setSpacePage}
                        itemsPerPage={spaceItemsPerPage}
                        setItemsPerPage={setSpaceItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewSpaceTemplateDialog
                  open={spaceViewDialogOpen}
                  onOpenChange={setSpaceViewDialogOpen}
                  template={viewingSpaceTemplate}
                  onCreateSpace={handleUseSpaceTemplate}
                />
              </>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">
                      {selectedSpaceCategory
                        ? spaceCategories.find((c) => c.id === selectedSpaceCategory)?.name || 'Space Templates'
                        : 'All Space Templates'}
                    </h2>
                  </div>
                  {filteredSpaceTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No space templates found matching your criteria
                    </div>
                  ) : (
                    <>
                      {renderSpaceList(paginatedSpaceTemplates)}
                      <TablePagination
                        totalItems={filteredSpaceTemplates.length}
                        currentPage={spacePage}
                        setCurrentPage={setSpacePage}
                        itemsPerPage={spaceItemsPerPage}
                        setItemsPerPage={setSpaceItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewSpaceTemplateDialog
                  open={spaceViewDialogOpen}
                  onOpenChange={setSpaceViewDialogOpen}
                  template={viewingSpaceTemplate}
                  onCreateSpace={handleUseSpaceTemplate}
                />
              </>
            )}
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : promptFilterType === 'featured' && !selectedCategory && !searchQuery ? (
              <>
                {/* Featured Templates Section */}
                <TemplateSection
                  title="Featured Templates"
                  templates={featuredPromptTemplates}
                  onViewAll={() => setPromptFilterType('featured-all')}
                  renderGrid={renderPromptList}
                  maxItems={5}
                  viewAllLabel="View all featured"
                />

                {/* Popular Templates Section */}
                <TemplateSection
                  title="Popular Templates"
                  templates={popularPromptTemplates}
                  onViewAll={() => setPromptFilterType('popular')}
                  renderGrid={renderPromptList}
                  maxItems={5}
                  viewAllLabel="View all popular"
                />

                {featuredPromptTemplates.length === 0 && popularPromptTemplates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No prompt templates found
                  </div>
                )}

                <ViewTemplateDialog
                  open={viewDialogOpen}
                  onOpenChange={setViewDialogOpen}
                  template={viewingTemplate}
                  onSave={handleSaveTemplate}
                />
              </>
            ) : promptFilterType === 'featured-all' && !selectedCategory && !searchQuery ? (
              <>
                {/* All Featured Templates */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Featured Templates</h2>
                  </div>
                  {featuredPromptTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No featured templates found
                    </div>
                  ) : (
                    <>
                      {renderPromptList(paginatedFeaturedPromptTemplates)}
                      <TablePagination
                        totalItems={featuredPromptTemplates.length}
                        currentPage={promptPage}
                        setCurrentPage={setPromptPage}
                        itemsPerPage={promptItemsPerPage}
                        setItemsPerPage={setPromptItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewTemplateDialog
                  open={viewDialogOpen}
                  onOpenChange={setViewDialogOpen}
                  template={viewingTemplate}
                  onSave={handleSaveTemplate}
                />
              </>
            ) : promptFilterType === 'popular' && !selectedCategory && !searchQuery ? (
              <>
                {/* Popular Templates Only */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Popular Templates</h2>
                  </div>
                  {popularPromptTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No popular templates found
                    </div>
                  ) : (
                    <>
                      {renderPromptList(paginatedPopularPromptTemplates)}
                      <TablePagination
                        totalItems={popularPromptTemplates.length}
                        currentPage={promptPage}
                        setCurrentPage={setPromptPage}
                        itemsPerPage={promptItemsPerPage}
                        setItemsPerPage={setPromptItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewTemplateDialog
                  open={viewDialogOpen}
                  onOpenChange={setViewDialogOpen}
                  template={viewingTemplate}
                  onSave={handleSaveTemplate}
                />
              </>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">
                      {selectedCategory
                        ? categories.find((c) => c.id === selectedCategory)?.name || 'Prompt Templates'
                        : 'All Prompt Templates'}
                    </h2>
                  </div>
                  {filteredPromptTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No templates found matching your criteria
                    </div>
                  ) : (
                    <>
                      {renderPromptList(paginatedPromptTemplates)}
                      <TablePagination
                        totalItems={filteredPromptTemplates.length}
                        currentPage={promptPage}
                        setCurrentPage={setPromptPage}
                        itemsPerPage={promptItemsPerPage}
                        setItemsPerPage={setPromptItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewTemplateDialog
                  open={viewDialogOpen}
                  onOpenChange={setViewDialogOpen}
                  template={viewingTemplate}
                  onSave={handleSaveTemplate}
                />
              </>
            )}
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas" className="mt-0">
            {personasLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : personaFilterType === 'featured' && !selectedPersonaCategory && !topBarSearchQuery ? (
              <>
                {/* Featured Templates Section */}
                <TemplateSection
                  title="Featured Templates"
                  templates={featuredPersonaTemplates}
                  onViewAll={() => setPersonaFilterType('featured-all')}
                  renderGrid={renderPersonaList}
                  maxItems={5}
                  viewAllLabel="View all featured"
                />

                {/* Popular Templates Section */}
                <TemplateSection
                  title="Popular Templates"
                  templates={popularPersonaTemplates}
                  onViewAll={() => setPersonaFilterType('popular')}
                  renderGrid={renderPersonaList}
                  maxItems={5}
                  viewAllLabel="View all popular"
                />

                {featuredPersonaTemplates.length === 0 && popularPersonaTemplates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No persona templates found</p>
                  </div>
                )}

                <ViewPersonaTemplateDialog
                  template={viewingPersonaTemplate}
                  open={personaViewDialogOpen}
                  onOpenChange={setPersonaViewDialogOpen}
                  onUse={handleUsePersonaTemplate}
                />
              </>
            ) : personaFilterType === 'featured-all' && !selectedPersonaCategory && !topBarSearchQuery ? (
              <>
                {/* All Featured Templates */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Featured Templates</h2>
                  </div>
                  {featuredPersonaTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No featured templates found</p>
                    </div>
                  ) : (
                    <>
                      {renderPersonaList(paginatedFeaturedPersonaTemplates)}
                      <TablePagination
                        totalItems={featuredPersonaTemplates.length}
                        currentPage={personaPage}
                        setCurrentPage={setPersonaPage}
                        itemsPerPage={personaItemsPerPage}
                        setItemsPerPage={setPersonaItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewPersonaTemplateDialog
                  template={viewingPersonaTemplate}
                  open={personaViewDialogOpen}
                  onOpenChange={setPersonaViewDialogOpen}
                  onUse={handleUsePersonaTemplate}
                />
              </>
            ) : personaFilterType === 'popular' && !selectedPersonaCategory && !topBarSearchQuery ? (
              <>
                {/* Popular Templates Only */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">Popular Templates</h2>
                  </div>
                  {popularPersonaTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No popular templates found</p>
                    </div>
                  ) : (
                    <>
                      {renderPersonaList(paginatedPopularPersonaTemplates)}
                      <TablePagination
                        totalItems={popularPersonaTemplates.length}
                        currentPage={personaPage}
                        setCurrentPage={setPersonaPage}
                        itemsPerPage={personaItemsPerPage}
                        setItemsPerPage={setPersonaItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewPersonaTemplateDialog
                  template={viewingPersonaTemplate}
                  open={personaViewDialogOpen}
                  onOpenChange={setPersonaViewDialogOpen}
                  onUse={handleUsePersonaTemplate}
                />
              </>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold font-roboto-slab">
                      {selectedPersonaCategory
                        ? personaCategories.find((c) => c.id === selectedPersonaCategory)?.name || 'Persona Templates'
                        : 'All Persona Templates'}
                    </h2>
                  </div>
                  {filteredPersonaTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No persona templates found</p>
                    </div>
                  ) : (
                    <>
                      {renderPersonaList(paginatedPersonaTemplates)}
                      <TablePagination
                        totalItems={filteredPersonaTemplates.length}
                        currentPage={personaPage}
                        setCurrentPage={setPersonaPage}
                        itemsPerPage={personaItemsPerPage}
                        setItemsPerPage={setPersonaItemsPerPage}
                      />
                    </>
                  )}
                </div>

                <ViewPersonaTemplateDialog
                  template={viewingPersonaTemplate}
                  open={personaViewDialogOpen}
                  onOpenChange={setPersonaViewDialogOpen}
                  onUse={handleUsePersonaTemplate}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

    </div>
  );
}
