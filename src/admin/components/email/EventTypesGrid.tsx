import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Badge } from '@/admin/ui/badge';
import { EmailEventType } from '@/hooks/useEmailEventTypes';
import { EmailRule } from '@/hooks/useEmailRules';
import { Shield, User, AlertCircle, CreditCard, Bell, UserPlus } from 'lucide-react';

interface EventTypesGridProps {
  eventTypes: EmailEventType[];
  rules: EmailRule[];
  onCategoryClick: (category: string) => void;
}

const categoryIcons: Record<string, any> = {
  authentication: UserPlus,
  user_lifecycle: User,
  security: Shield,
  transactions: CreditCard,
  system_alerts: Bell,
  admin: AlertCircle,
};

const categoryColors: Record<string, string> = {
  authentication: 'bg-admin-info/10 text-admin-info',
  user_lifecycle: 'bg-admin-success/10 text-admin-success',
  security: 'bg-admin-error/10 text-admin-error',
  transactions: 'bg-admin-accent/10 text-admin-accent',
  system_alerts: 'bg-admin-warning/10 text-admin-warning',
  admin: 'bg-admin-secondary/10 text-admin-secondary-text',
};

export const EventTypesGrid = ({ eventTypes, rules, onCategoryClick }: EventTypesGridProps) => {
  const categories = [...new Set(eventTypes.map(e => e.category))];

  const getCategoryStats = (category: string) => {
    const eventsInCategory = eventTypes.filter(e => e.category === category);
    const activeRules = rules.filter(r =>
      eventsInCategory.some(e => e.event_type === r.event_type) && r.status === 'active'
    );
    return {
      totalEvents: eventsInCategory.length,
      activeRules: activeRules.length,
      configuredEvents: new Set(activeRules.map(r => r.event_type)).size,
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => {
        const Icon = categoryIcons[category] || AlertCircle;
        const stats = getCategoryStats(category);
        const colorClass = categoryColors[category] || categoryColors.admin;

        return (
          <Card key={category} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg capitalize font-roboto-slab">
                  {category.replace('_', ' ')}
                </CardTitle>
              </div>
              <CardDescription>
                {stats.totalEvents} events • {stats.activeRules} active rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-admin-text-muted">Configured</span>
                  <Badge variant="secondary">
                    {stats.configuredEvents}/{stats.totalEvents}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onCategoryClick(category)}
                >
                  View Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
