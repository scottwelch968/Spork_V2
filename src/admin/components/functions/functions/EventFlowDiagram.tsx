/**
 * Event Flow Diagram - Visual representation of function/event/container flow
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/admin/ui';
import { useChatFunctions, useChatContainers, useChatActors } from '@/hooks/useChatFunctionsAdmin';
import { GitBranch, Loader2, ArrowRight, Zap, Box, Users } from 'lucide-react';

export function EventFlowDiagram() {
  const { data: functions, isLoading: functionsLoading } = useChatFunctions();
  const { data: containers, isLoading: containersLoading } = useChatContainers();
  const { data: actors, isLoading: actorsLoading } = useChatActors();

  const isLoading = functionsLoading || containersLoading || actorsLoading;

  // Build the flow data
  const flowData = useMemo(() => {
    if (!functions || !containers) return [];

    return functions
      .filter((f) => f.is_enabled)
      .sort((a, b) => a.display_order - b.display_order)
      .map((func) => {
        const linkedContainers = containers.filter((c) =>
          c.function_key === func.function_key && c.is_enabled
        );

        const subscribingContainers = containers.filter((c) =>
          c.is_enabled && func.events_emitted.some((e) => c.subscribes_to.includes(e))
        );

        return {
          function: func,
          containers: [...new Set([...linkedContainers, ...subscribingContainers])],
        };
      });
  }, [functions, containers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actor Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            Actor Permissions Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actors?.filter((a) => a.is_enabled).map((actor) => (
              <div
                key={actor.id}
                className="p-3 border border-admin-border/50 rounded-xl bg-admin-bg-muted/30 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20">
                    {actor.actor_type}
                  </Badge>
                  <span className="text-sm font-medium">{actor.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {actor.allowed_functions.slice(0, 4).map((func) => (
                    <Badge key={func} variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-admin-accent/5 border-admin-accent/20 text-admin-accent">
                      {func}
                    </Badge>
                  ))}
                  {actor.allowed_functions.length > 4 && (
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-admin-accent/5 border-admin-accent/20 text-admin-accent">
                      +{actor.allowed_functions.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Function Flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Function → Event → Container Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {flowData.map(({ function: func, containers: linkedContainers }, index) => (
              <div key={func.id} className="relative">
                {/* Connection line to next function */}
                {index < flowData.length - 1 && (
                  <div className="absolute left-[140px] top-full w-0.5 h-6 bg-border" />
                )}

                <div className="flex items-start gap-4">
                  {/* Function Box */}
                  <div className="w-[280px] flex-shrink-0 p-3 border border-admin-info/20 rounded-xl bg-admin-info/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-admin-info/20 flex items-center justify-center text-admin-info text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{func.name}</span>
                    </div>
                    <code className="text-xs text-admin-text-muted font-mono block mb-2">
                      {func.function_key}
                    </code>
                    <div className="flex flex-wrap gap-1">
                      {func.events_emitted.map((event) => (
                        <Badge
                          key={event}
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-wider bg-admin-warning/5 text-admin-warning border-admin-warning/20 font-mono"
                        >
                          <Zap className="h-2 w-2 mr-1" />
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pt-4">
                    <ArrowRight className="h-5 w-5 text-admin-text-muted" />
                  </div>

                  {/* Containers */}
                  <div className="flex-1 flex flex-wrap gap-2 pt-2">
                    {linkedContainers.length > 0 ? (
                      linkedContainers.map((container) => (
                        <div
                          key={container.id}
                          className="p-2 border border-admin-accent/20 rounded-xl bg-admin-accent/5 min-w-[150px] shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Box className="h-3.5 w-3.5 text-admin-accent" />
                            <span className="text-sm font-medium">
                              {container.name}
                            </span>
                          </div>
                          <code className="text-xs text-admin-text-muted font-mono">
                            {container.container_key}
                          </code>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-admin-text-muted pt-2">
                        No UI containers
                      </span>
                    )}
                  </div>
                </div>

                {/* Dependencies */}
                {func.depends_on.length > 0 && (
                  <div className="ml-8 mt-2 text-xs text-admin-text-muted">
                    Depends on:{' '}
                    {func.depends_on.map((dep, i) => (
                      <span key={dep}>
                        <code className="bg-admin-bg-muted px-1 py-0.5 rounded font-mono">
                          {dep}
                        </code>
                        {i < func.depends_on.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-admin-border/50 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-admin-info/20 border border-admin-info/40" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Function</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-admin-warning/5 text-admin-warning border-admin-warning/20 text-[10px] font-bold uppercase tracking-wider">
                <Zap className="h-2 w-2 mr-1" />
                event
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-admin-accent/20 border border-admin-accent/40" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Container</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
