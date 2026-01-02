import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { DependencyDoc } from '@/utils/generateDocumentation';

interface DependenciesSectionProps {
  dependencies: DependencyDoc[];
}

export function DependenciesSection({ dependencies }: DependenciesSectionProps) {
  const [search, setSearch] = useState('');

  const filteredDeps = dependencies.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedDeps = filteredDeps.reduce((acc, dep) => {
    if (!acc[dep.category]) {
      acc[dep.category] = [];
    }
    acc[dep.category].push(dep);
    return acc;
  }, {} as Record<string, DependencyDoc[]>);

  const categoryOrder = [
    'Core',
    'State Management',
    'Backend',
    'UI',
    'Radix UI',
    'Forms',
    'Data Viz',
    'Theming',
    'Content',
    'Interactions',
    'Layout',
    'Notifications',
    'Export',
    'Utilities',
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dependencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categoryDeps = groupedDeps[category];
          if (!categoryDeps) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-md font-semibold text-primary border-b pb-2">
                {category}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {categoryDeps.length}
                </Badge>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Package</th>
                      <th className="text-left p-3 font-medium">Version</th>
                      <th className="text-left p-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryDeps.map((dep) => (
                      <tr key={dep.name} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-mono text-foreground">{dep.name}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {dep.version}
                        </td>
                        <td className="p-3 text-muted-foreground">{dep.description}</td>
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
        <strong>Total Dependencies:</strong> {dependencies.length} |{' '}
        <strong>Categories:</strong> {Object.keys(groupedDeps).length}
      </div>
    </div>
  );
}
