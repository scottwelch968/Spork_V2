import { Button } from '@/components/ui/button';

interface TemplateSectionProps {
  title: string;
  templates: any[];
  onViewAll: () => void;
  renderGrid: (templates: any[]) => React.ReactNode;
  emptyMessage?: string;
  maxItems?: number;
  viewAllLabel?: string;
}

export function TemplateSection({
  title,
  templates,
  onViewAll,
  renderGrid,
  emptyMessage = 'No templates found',
  maxItems = 5,
  viewAllLabel = 'View all',
}: TemplateSectionProps) {
  const displayTemplates = templates.slice(0, maxItems);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold font-roboto-slab">{title}</h2>
        {viewAllLabel && (
          <Button variant="link" onClick={onViewAll} className="text-primary">
            {viewAllLabel}
          </Button>
        )}
      </div>
      {renderGrid(displayTemplates)}
    </div>
  );
}
