import React from 'react';
import { RenderNode } from '@/lib/chatFunctions/registry';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DynamicContainerProps {
  schema: RenderNode | RenderNode[];
  data: Record<string, unknown>;
  styleConfig?: Record<string, string>;
  className?: string;
}

// Resolve {{fieldName}} template syntax in strings
function resolveTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const value = path.split('.').reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
    return value !== undefined ? String(value) : '';
  });
}

// Resolve templates in any value (string, object, array)
function resolveValue(value: unknown, data: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return resolveTemplate(value, data);
  }
  if (Array.isArray(value)) {
    return value.map(v => resolveValue(v, data));
  }
  if (value && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, data);
    }
    return resolved;
  }
  return value;
}

// Render a single node
function renderNode(node: RenderNode, data: Record<string, unknown>, index: number): React.ReactNode {
  const { type, children, ...props } = node;
  const resolvedProps = resolveValue(props, data) as Record<string, unknown>;
  const key = `${type}-${index}`;

  switch (type) {
    case 'card':
      return (
        <Card key={key} className={cn(resolvedProps.className as string)}>
          {resolvedProps.title && (
            <CardHeader>
              <CardTitle>{resolvedProps.title as string}</CardTitle>
              {resolvedProps.description && (
                <CardDescription>{resolvedProps.description as string}</CardDescription>
              )}
            </CardHeader>
          )}
          <CardContent>
            {children?.map((child, i) => renderNode(child, data, i))}
          </CardContent>
        </Card>
      );

    case 'text':
      const TextTag = (resolvedProps.variant as string) === 'heading' ? 'h3' : 
                      (resolvedProps.variant as string) === 'subheading' ? 'h4' : 'p';
      return (
        <TextTag 
          key={key} 
          className={cn(
            resolvedProps.variant === 'heading' && 'text-lg font-semibold',
            resolvedProps.variant === 'subheading' && 'text-base font-medium',
            resolvedProps.variant === 'muted' && 'text-sm text-muted-foreground',
            resolvedProps.className as string
          )}
        >
          {resolvedProps.content as string}
        </TextTag>
      );

    case 'image':
      return (
        <img
          key={key}
          src={resolvedProps.src as string}
          alt={resolvedProps.alt as string || ''}
          className={cn('rounded-md', resolvedProps.className as string)}
        />
      );

    case 'list':
      const items = resolvedProps.items as unknown[];
      const itemTemplate = children?.[0];
      return (
        <ul key={key} className={cn('space-y-2', resolvedProps.className as string)}>
          {items?.map((item, i) => (
            <li key={i}>
              {itemTemplate 
                ? renderNode(itemTemplate, { ...data, item }, i)
                : String(item)
              }
            </li>
          ))}
        </ul>
      );

    case 'row':
      return (
        <div 
          key={key} 
          className={cn('flex items-center gap-2', resolvedProps.className as string)}
        >
          {children?.map((child, i) => renderNode(child, data, i))}
        </div>
      );

    case 'grid':
      const cols = resolvedProps.cols as number || 2;
      return (
        <div 
          key={key} 
          className={cn(`grid gap-4`, resolvedProps.className as string)}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {children?.map((child, i) => renderNode(child, data, i))}
        </div>
      );

    case 'button':
      return (
        <Button
          key={key}
          variant={(resolvedProps.variant as 'default' | 'outline' | 'ghost') || 'default'}
          size={(resolvedProps.size as 'sm' | 'default' | 'lg') || 'default'}
          className={cn(resolvedProps.className as string)}
          onClick={() => {
            if (resolvedProps.action) {
              // Emit action event - to be handled by parent
              console.log('Button action:', resolvedProps.action);
            }
          }}
        >
          {resolvedProps.label as string}
        </Button>
      );

    case 'badge':
      return (
        <Badge
          key={key}
          variant={(resolvedProps.variant as 'default' | 'secondary' | 'destructive' | 'outline') || 'default'}
          className={cn(resolvedProps.className as string)}
        >
          {resolvedProps.label as string}
        </Badge>
      );

    case 'divider':
      return <Separator key={key} className={cn('my-4', resolvedProps.className as string)} />;

    case 'code':
      return (
        <pre 
          key={key} 
          className={cn('bg-muted p-3 rounded-md overflow-x-auto text-sm', resolvedProps.className as string)}
        >
          <code>{resolvedProps.content as string}</code>
        </pre>
      );

    case 'conditional':
      const condition = resolvedProps.condition as string;
      const conditionValue = resolveTemplate(`{{${condition}}}`, data);
      const shouldRender = conditionValue && conditionValue !== 'false' && conditionValue !== '';
      
      if (shouldRender) {
        return children?.map((child, i) => renderNode(child, data, i));
      }
      return null;

    default:
      console.warn(`Unknown render node type: ${type}`);
      return null;
  }
}

export function DynamicContainer({ schema, data, styleConfig, className }: DynamicContainerProps) {
  const nodes = Array.isArray(schema) ? schema : [schema];
  
  // Apply style_config classes to wrapper
  const wrapperClasses = cn(
    'dynamic-container',
    styleConfig?.wrapper,
    className
  );

  return (
    <div className={wrapperClasses}>
      {nodes.map((node, index) => renderNode(node, data, index))}
    </div>
  );
}

export default DynamicContainer;
