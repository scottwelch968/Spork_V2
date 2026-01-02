import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export function TabFourContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5" />
          Tab Four
        </CardTitle>
        <CardDescription>
          This tab is a placeholder for future functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Construction className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm">Content will be added here later</p>
        </div>
      </CardContent>
    </Card>
  );
}
