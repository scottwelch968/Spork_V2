import { useState } from 'react';
import { useEmailRules } from '@/hooks/useEmailRules';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useEmailEventTypes } from '@/hooks/useEmailEventTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EventTypesGrid } from './EventTypesGrid';
import { RuleConfigDialog } from './RuleConfigDialog';
import { RuleLogsTable } from './RuleLogsTable';
import { Plus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export const EmailRulesTab = () => {
  const { rules, loading, createRule, updateRule, deleteRule, toggleRuleStatus } = useEmailRules();
  const { templates } = useEmailTemplates();
  const { eventTypes } = useEmailEventTypes();
  const [view, setView] = useState<'categories' | 'rules'>('categories');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  const filteredRules = selectedCategory
    ? rules.filter(r => {
        const eventType = eventTypes.find(et => et.event_type === r.event_type);
        return eventType?.category === selectedCategory;
      })
    : rules;

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setView('rules');
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (selectedRule) {
      await updateRule((selectedRule as any).id, data);
    } else {
      await createRule(data);
    }
  };

  return (
    <div className="space-y-6">
      {view === 'categories' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Email Rules by Event Category</CardTitle>
              <CardDescription>
                Configure automated emails based on system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventTypesGrid
                eventTypes={eventTypes}
                rules={rules}
                onCategoryClick={handleCategoryClick}
              />
            </CardContent>
          </Card>

          <RuleLogsTable />
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setView('categories')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <CardTitle className="capitalize">{selectedCategory.replace('_', ' ')}</CardTitle>
                    <CardDescription>{filteredRules.length} rules configured</CardDescription>
                  </div>
                </div>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{rule.name}</CardTitle>
                            <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                              {rule.status}
                            </Badge>
                          </div>
                          <CardDescription>{rule.description}</CardDescription>
                        </div>
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={(checked) => 
                            toggleRuleStatus(rule.id, checked ? 'active' : 'paused')
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Event</p>
                          <p className="font-medium text-sm">{rule.event_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Template</p>
                          <p className="font-medium text-sm">{rule.email_templates?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Triggered</p>
                          <p className="font-medium text-sm">{rule.trigger_count} times</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Success Rate</p>
                          <p className="font-medium text-sm">
                            {rule.trigger_count > 0 
                              ? `${Math.round((rule.success_count / rule.trigger_count) * 100)}%`
                              : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteRule(rule.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredRules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No rules configured for this category
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <RuleConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={selectedRule}
        eventTypes={eventTypes}
        templates={templates}
        onSave={handleSave}
      />
    </div>
  );
};
