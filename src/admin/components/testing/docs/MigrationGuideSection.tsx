import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, Download, FileJson } from 'lucide-react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/admin/ui';
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
                <Card className="bg-admin-card border-admin-border overflow-hidden">
                    <CardHeader className="py-4 bg-admin-bg-muted/30 border-b border-admin-border">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="p-0 hover:bg-transparent group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-admin-info/10 rounded-lg group-hover:scale-110 transition-transform">
                                            {isOpen ? <ChevronDown className="h-4 w-4 text-admin-info" /> : <ChevronRight className="h-4 w-4 text-admin-info" />}
                                        </div>
                                        <CardTitle className="text-lg font-bold text-admin-text font-roboto-slab">Migration Guide</CardTitle>
                                    </div>
                                </Button>
                            </CollapsibleTrigger>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportDocs('markdown')}
                                    className="h-9 border-admin-border text-admin-text hover:bg-admin-bg-muted"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5 text-admin-info" />
                                    Markdown
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportDocs('json')}
                                    className="h-9 border-admin-border text-admin-text hover:bg-admin-bg-muted"
                                >
                                    <FileJson className="h-3.5 w-3.5 mr-1.5 text-admin-info" />
                                    JSON
                                </Button>
                                {isAdmin && (
                                    <Button size="sm" onClick={handleAdd} className="h-9 bg-admin-info hover:bg-admin-info/90 text-white shadow-sm">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Add Section
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent className="p-6">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 w-full animate-pulse bg-admin-bg-muted rounded-xl border border-admin-border" />
                                    ))}
                                </div>
                            ) : docs.length === 0 ? (
                                <div className="text-center py-10 bg-admin-bg-muted/20 rounded-xl border border-dashed border-admin-border">
                                    <p className="text-admin-text-muted text-sm">
                                        No migration documentation yet. Click "Add Section" to create one.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {docs.map((doc) => (
                                        <Collapsible
                                            key={doc.id}
                                            open={expandedSections.has(doc.id)}
                                            onOpenChange={() => toggleSection(doc.id)}
                                            className="group"
                                        >
                                            <div className="border border-admin-border rounded-xl bg-admin-bg-muted/30 overflow-hidden group-data-[state=open]:bg-admin-bg-muted/50 transition-all duration-300">
                                                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSection(doc.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-admin-card rounded border border-admin-border">
                                                            {expandedSections.has(doc.id) ? (
                                                                <ChevronDown className="h-4 w-4 text-admin-text-muted" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-admin-text-muted" />
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-admin-text font-roboto-slab">{doc.title}</span>
                                                        {!doc.is_published && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-admin-warning/10 text-admin-warning px-2 py-0.5 rounded border border-admin-warning/20">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(doc); }}
                                                                className="h-8 w-8 text-admin-text-muted hover:text-admin-info hover:bg-admin-info/10"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc); }}
                                                                className="h-8 w-8 text-admin-text-muted hover:text-admin-error hover:bg-admin-error/10"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <CollapsibleContent>
                                                    <div className="p-6 border-t border-admin-border bg-admin-card prose prose-sm dark:prose-invert max-w-none text-admin-text animate-in slide-in-from-top-2 duration-300">
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
                <AlertDialogContent className="bg-admin-card border-admin-border text-admin-text">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-roboto-slab font-bold text-xl">Delete Section</AlertDialogTitle>
                        <AlertDialogDescription className="text-admin-text-muted">
                            Are you sure you want to delete <span className="font-bold text-admin-text">"{docToDelete?.title}"</span>? This action cannot be undone and will remove it from the documentation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="bg-admin-bg-muted/30 -mx-6 -mb-6 p-6 mt-4 border-t border-admin-border">
                        <AlertDialogCancel className="bg-transparent border-admin-border text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-muted">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-admin-error hover:bg-admin-error/90 text-white">
                            Permanently Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
