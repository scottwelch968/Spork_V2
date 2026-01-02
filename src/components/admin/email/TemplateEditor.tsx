import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmailTemplate } from '@/hooks/useEmailTemplates';
import { Save } from 'lucide-react';

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
}

export const TemplateEditor = ({ open, onOpenChange, template, onSave }: TemplateEditorProps) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'transactional',
    status: 'draft',
    subject_template: '',
    html_content: '',
    text_content: '',
    variables: [] as string[],
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  // Sanitize HTML content for safe preview rendering
  const sanitizedHtmlContent = useMemo(() => {
    if (!formData.html_content) {
      return '<p class="text-muted-foreground">HTML content will appear here</p>';
    }
    return DOMPurify.sanitize(formData.html_content, {
      ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'a', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'ul', 'ol', 'li',
                     'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'style', 'header', 'footer', 'section'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'width', 'height', 'cellpadding', 'cellspacing',
                     'border', 'align', 'valign', 'bgcolor', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }, [formData.html_content]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        slug: template.slug,
        category: template.category,
        status: template.status,
        subject_template: template.subject_template,
        html_content: template.html_content,
        text_content: template.text_content || '',
        variables: template.variables || [],
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        category: 'transactional',
        status: 'draft',
        subject_template: '',
        html_content: '',
        text_content: '',
        variables: [],
      });
    }
  }, [template, open]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !template ? generateSlug(name) : prev.slug,
    }));
  };

  const extractVariables = (text: string) => {
    const regex = /\{\{([^}|]+)(?:\|[^}]+)?\}\}/g;
    const matches = text.matchAll(regex);
    const vars = new Set<string>();
    for (const match of matches) {
      vars.add(match[1].trim());
    }
    return Array.from(vars);
  };

  const handleContentChange = (field: 'subject_template' | 'html_content', value: string) => {
    const allVars = new Set([
      ...extractVariables(formData.subject_template),
      ...extractVariables(formData.html_content),
    ]);
    
    if (field === 'subject_template' || field === 'html_content') {
      allVars.forEach(v => extractVariables(value).forEach(newVar => allVars.add(newVar)));
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
      variables: Array.from(allVars),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update the email template configuration' : 'Create a new email template with variables'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Welcome Email"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="welcome-email"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="lifecycle">Lifecycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
                {formData.variables.length === 0 && (
                  <p className="text-sm text-muted-foreground">Variables will be extracted automatically from your content</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={formData.subject_template}
                onChange={(e) => handleContentChange('subject_template', e.target.value)}
                placeholder="Welcome to {{company_name}}, {{first_name}}!"
              />
              <p className="text-xs text-muted-foreground">Use {`{{variable_name}}`} for dynamic content</p>
            </div>

            <div className="space-y-2">
              <Label>HTML Content</Label>
              <Textarea
                value={formData.html_content}
                onChange={(e) => handleContentChange('html_content', e.target.value)}
                placeholder="<html><body>Hi {{first_name}},...</body></html>"
                className="font-mono text-sm min-h-[300px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Plain Text Fallback (Optional)</Label>
              <Textarea
                value={formData.text_content}
                onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                placeholder="Hi {{first_name}}..."
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Preview</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
              </div>
            </div>

            <div className={`border border-border rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-md mx-auto' : ''}`}>
              <div className="bg-muted p-3 border-b border-border">
                <p className="text-sm font-medium">{formData.subject_template || 'Subject line preview'}</p>
              </div>
              <div 
                className="bg-background p-6 overflow-auto max-h-[400px]"
                dangerouslySetInnerHTML={{ __html: sanitizedHtmlContent }}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
