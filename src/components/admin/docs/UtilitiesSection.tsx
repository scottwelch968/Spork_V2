import { Badge } from '@/components/ui/badge';
import type { UtilityDoc } from '@/utils/generateDocumentation';

interface UtilitiesSectionProps {
  utilities: UtilityDoc[];
}

export function UtilitiesSection({ utilities }: UtilitiesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {utilities.map((util) => (
          <div key={util.name} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-mono font-semibold text-foreground">{util.name}</h3>
              <span className="text-xs text-muted-foreground font-mono">{util.path}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{util.description}</p>
            <div className="flex flex-wrap gap-2">
              {util.functions.map((fn) => (
                <Badge key={fn} variant="outline" className="font-mono text-xs">
                  {fn}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
        <strong>Total Utilities:</strong> {utilities.length}
      </div>
    </div>
  );
}
