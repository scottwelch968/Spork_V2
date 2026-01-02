import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{doc ? 'Edit Section' : 'Add New Section'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>

          <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-fit">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="flex-1 overflow-hidden mt-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your documentation in Markdown..."
                className="h-full min-h-[300px] font-mono text-sm resize-none"
              />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-auto mt-2 border rounded-md p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !title.trim() || !content.trim()}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
