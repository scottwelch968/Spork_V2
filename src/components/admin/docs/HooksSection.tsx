import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { HookDoc } from '@/utils/generateDocumentation';

interface HooksSectionProps {
  hooks: HookDoc[];
}

export function HooksSection({ hooks }: HooksSectionProps) {
  const [search, setSearch] = useState('');

  const filteredHooks = hooks.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search hooks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Hook</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-left p-3 font-medium">Returns</th>
            </tr>
          </thead>
          <tbody>
            {filteredHooks.map((hook) => (
              <tr key={hook.name} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono font-medium text-primary whitespace-nowrap">
                  {hook.name}
                </td>
                <td className="p-3 text-muted-foreground">{hook.description}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground max-w-md">
                  {hook.returns}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
        <strong>Total Hooks:</strong> {hooks.length}
      </div>
    </div>
  );
}
