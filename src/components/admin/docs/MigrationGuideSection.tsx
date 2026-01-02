import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, Download, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { useAdminDocumentation, AdminDoc, CreateDocInput, UpdateDocInput } from '@/hooks/useAdminDocumentation';
import { DocEditorDialog } from './DocEditorDialog';
import { useSystemAuth } from '@/contexts/SystemAuthContext';

interface MigrationGuideSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MigrationGuideSection({ isOpen, onToggle }: MigrationGuideSectionProps) {
  const { hasRole } = useSystemAuth();
  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const { docs, isLoading, createDoc, updateDoc, deleteDoc, exportDocs } = useAdminDocumentation('migration');
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AdminDoc | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<AdminDoc | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEdit = (doc: AdminDoc) => {
    setEditingDoc(doc);
    setEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingDoc(null);
    setEditorOpen(true);
  };

  const handleSave = (data: CreateDocInput | UpdateDocInput) => {
    if ('id' in data) {
      updateDoc.mutate(data as UpdateDocInput, {
        onSuccess: () => setEditorOpen(false),
      });
    } else {
      createDoc.mutate(data as CreateDocInput, {
        onSuccess: () => setEditorOpen(false),
      });
    }
  };

  const handleDeleteClick = (doc: AdminDoc) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteDoc.mutate(docToDelete.id);
      setDeleteDialogOpen(false);
      setDocToDelete(null);
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <CardTitle className="text-lg">Migration Guide</CardTitle>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportDocs('markdown')}
                  className="h-8"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  MD
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportDocs('json')}
                  className="h-8"
                >
                  <FileJson className="h-3.5 w-3.5 mr-1" />
                  JSON
                </Button>
                {isAdmin && (
                  <Button size="sm" onClick={handleAdd} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Section
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No migration documentation yet. Click "Add Section" to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <Collapsible
                      key={doc.id}
                      open={expandedSections.has(doc.id)}
                      onOpenChange={() => toggleSection(doc.id)}
                    >
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="p-0 hover:bg-transparent flex-1 justify-start">
                              <div className="flex items-center gap-2">
                                {expandedSections.has(doc.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{doc.title}</span>
                                {!doc.is_published && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                    Draft
                                  </span>
                                )}
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(doc)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(doc)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <CollapsibleContent>
                          <div className="p-4 border-t prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{doc.content}</ReactMarkdown>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <DocEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        doc={editingDoc}
        category="migration"
        onSave={handleSave}
        isLoading={createDoc.isPending || updateDoc.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{docToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
