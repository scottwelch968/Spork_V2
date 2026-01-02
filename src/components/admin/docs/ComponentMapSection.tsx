import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { ComponentDoc } from '@/utils/generateDocumentation';

interface ComponentMapSectionProps {
  components: ComponentDoc[];
}

export function ComponentMapSection({ components }: ComponentMapSectionProps) {
  const [search, setSearch] = useState('');

  const filteredComponents = components.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedComponents = filteredComponents.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<string, ComponentDoc[]>);

  const categoryOrder = ['Layout', 'Auth', 'Chat', 'Files', 'Spaces', 'Settings', 'Templates', 'Admin'];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categoryComponents = groupedComponents[category];
          if (!categoryComponents) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-md font-semibold text-primary border-b pb-2">{category}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Component</th>
                      <th className="text-left p-3 font-medium">Path</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">Uses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryComponents.map((component) => (
                      <tr key={component.name} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-mono font-medium text-foreground">
                          {component.name}
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {component.path.replace('src/components/', '')}
                        </td>
                        <td className="p-3 text-muted-foreground">{component.description}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {component.uses?.map((use) => (
                              <Badge key={use} variant="secondary" className="text-xs">
                                {use}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
        <strong>Total Components:</strong> {components.length} |{' '}
        <strong>Categories:</strong> {Object.keys(groupedComponents).length}
      </div>
    </div>
  );
}
