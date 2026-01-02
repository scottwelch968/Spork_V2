import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from '@/admin/ui';
import { Construction, Sparkles } from 'lucide-react';

export function TabFourContent() {
    return (
        <Card className="bg-admin-card border-admin-border overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-32 w-32 text-admin-info" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-admin-text font-roboto-slab">
                    <Construction className="h-5 w-5 text-admin-warning" />
                    Extended Testing Features
                </CardTitle>
                <CardDescription className="text-admin-text-muted">
                    Advanced debugging and performance monitoring tools
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                    <div className="p-6 bg-admin-warning/10 rounded-full animate-pulse">
                        <Construction className="h-16 w-16 text-admin-warning" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-bold text-admin-text font-roboto-slab">Coming Soon</h3>
                        <p className="text-sm text-admin-text-muted">
                            We are currently developing advanced email performance monitoring and A/B testing simulators.
                        </p>
                    </div>

                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-admin-text-muted uppercase tracking-wider">
                            <span>Development Progress</span>
                            <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2 bg-admin-bg-muted" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
