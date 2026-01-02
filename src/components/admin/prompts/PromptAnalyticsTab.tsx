import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Star, Check, TrendingUp } from 'lucide-react';
import { useAdminPromptTemplates } from '@/hooks/useAdminPromptTemplates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function PromptAnalyticsTab() {
  const { templates, categories, loading } = useAdminPromptTemplates();

  // Calculate analytics from templates
  const analytics = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    featured: templates.filter(t => t.is_featured).length,
    totalUses: templates.reduce((sum, t) => sum + (t.use_count || 0), 0),
  };

  // Get most used templates
  const mostUsedTemplates = [...templates]
    .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{analytics.active}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold">{analytics.featured}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">{analytics.totalUses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Uses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostUsedTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No usage data available
                  </TableCell>
                </TableRow>
              ) : (
                mostUsedTemplates.map((template, index) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-muted-foreground font-bold">#1</span>}
                        {index === 1 && <span className="text-muted-foreground font-bold">#2</span>}
                        {index === 2 && <span className="text-muted-foreground font-bold">#3</span>}
                        {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{template.title}</div>
                      {template.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {template.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {template.category?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {template.is_active ? (
                          <Badge variant="default" className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        {template.is_featured && (
                          <Badge variant="default" className="text-xs bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(template.use_count || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
