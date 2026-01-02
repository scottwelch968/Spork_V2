import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
    Textarea,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/admin/ui';
import ReactMarkdown from 'react-markdown';
import { AdminDoc, CreateDocInput, UpdateDocInput } from '@/hooks/useAdminDocumentation';

interface DocEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doc?: AdminDoc | null;
    category: string;
    onSave: (data: CreateDocInput | UpdateDocInput) => void;
    isLoading?: boolean;
}

export function DocEditorDialog({
    open,
    onOpenChange,
    doc,
    category,
    onSave,
    isLoading,
}: DocEditorDialogProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isPublished, setIsPublished] = useState(true);

    useEffect(() => {
        if (doc) {
            setTitle(doc.title);
            setSlug(doc.slug);
            setContent(doc.content);
            setDisplayOrder(doc.display_order);
            setIsPublished(doc.is_published);
        } else {
            setTitle('');
            setSlug('');
            setContent('');
            setDisplayOrder(0);
            setIsPublished(true);
        }
    }, [doc, open]);

    const generateSlug = (text: string) => {
        return `${category}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!doc) {
            setSlug(generateSlug(value));
        }
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        if (doc) {
            onSave({
                id: doc.id,
                title,
                slug,
                content,
                display_order: displayOrder,
                is_published: isPublished,
            });
        } else {
            onSave({
                title,
                slug,
                category,
                content,
                display_order: displayOrder,
                is_published: isPublished,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-admin-card border-admin-border text-admin-text">
                <DialogHeader>
                    <DialogTitle className="font-roboto-slab font-bold text-xl">{doc ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-6 py-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Section title"
                                className="bg-admin-bg-muted border-admin-border text-admin-text"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">Slug</Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="url-friendly-slug"
                                className="bg-admin-bg-muted border-admin-border text-admin-text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-admin-bg-muted/30 p-4 rounded-xl border border-admin-border">
                        <div className="flex items-center gap-3">
                            <Label htmlFor="order" className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                className="w-24 bg-admin-bg-muted border-admin-border text-admin-text"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="published"
                                checked={isPublished}
                                onCheckedChange={setIsPublished}
                            />
                            <Label htmlFor="published" className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted cursor-pointer">Published</Label>
                        </div>
                    </div>

                    <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="bg-admin-bg-muted w-fit p-1">
                            <TabsTrigger value="edit" className="data-[state=active]:bg-admin-card text-admin-text">Edit Content</TabsTrigger>
                            <TabsTrigger value="preview" className="data-[state=active]:bg-admin-card text-admin-text">Live Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="flex-1 overflow-hidden mt-4">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your documentation in Markdown..."
                                className="h-full min-h-[350px] font-mono text-sm resize-none bg-admin-bg-muted/50 border-admin-border text-admin-text p-4 focus-visible:ring-admin-info"
                            />
                        </TabsContent>
                        <TabsContent value="preview" className="flex-1 overflow-auto mt-4 border border-admin-border rounded-xl p-6 bg-admin-bg-muted/10">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-admin-text">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="bg-admin-bg-muted/30 -mx-6 -mb-6 p-6 mt-2 border-t border-admin-border">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-admin-text-muted hover:text-admin-text">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || !title.trim() || !content.trim()} className="bg-admin-info hover:bg-admin-info/90 text-white min-w-[100px]">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
