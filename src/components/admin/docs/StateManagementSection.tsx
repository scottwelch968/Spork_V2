import { Badge } from '@/components/ui/badge';
import type { ContextDoc } from '@/utils/generateDocumentation';

interface StateManagementSectionProps {
  contexts: ContextDoc[];
}

export function StateManagementSection({ contexts }: StateManagementSectionProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/30 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">State Management Architecture</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>React Context</strong> - Global app state (Auth, Chat)</li>
          <li>• <strong>React Query (@tanstack/react-query)</strong> - Server state caching for all API data</li>
          <li>• <strong>Local State (useState)</strong> - Component-level state</li>
          <li>• <strong>URL State (useSearchParams)</strong> - Navigation and filter state</li>
        </ul>
      </div>

      <h3 className="text-md font-semibold text-primary border-b pb-2">React Contexts</h3>
      
      <div className="grid gap-4">
        {contexts.map((context) => (
          <div key={context.name} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-mono font-semibold text-foreground">{context.name}</h4>
              <span className="text-xs text-muted-foreground font-mono">{context.path}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{context.description}</p>
            <div className="flex flex-wrap gap-2">
              {context.provides.map((item) => (
                <Badge key={item} variant="outline" className="font-mono text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-md font-semibold text-primary border-b pb-2 mt-6">Data Flow Pattern</h3>
      
      <div className="bg-card border rounded-lg p-4 font-mono text-sm">
        <pre className="text-muted-foreground whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    AuthProvider                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                  ChatProvider                        │││
│  │  │  ┌─────────────────────────────────────────────────┐│││
│  │  │  │               QueryClientProvider               ││││
│  │  │  │  ┌───────────────────────────────────────────┐  ││││
│  │  │  │  │              AppLayout                    │  ││││
│  │  │  │  │   ┌─────────┬──────────┬─────────────┐   │  ││││
│  │  │  │  │   │LeftSidebar│ TopBar │RightSidebar │   │  ││││
│  │  │  │  │   └─────────┴──────────┴─────────────┘   │  ││││
│  │  │  │  │              Page Content                │  ││││
│  │  │  │  │           (uses React Query)             │  ││││
│  │  │  │  └───────────────────────────────────────────┘  ││││
│  │  │  └─────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘`}
        </pre>
      </div>
    </div>
  );
}
