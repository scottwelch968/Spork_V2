import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { Mail, Zap, Play, Code, BarChart3 } from 'lucide-react';
import { EnhancedEmailLogsTable } from './EnhancedEmailLogsTable';
import { EnhancedRuleLogsTable } from './EnhancedRuleLogsTable';
import { TestEventTriggerPanel } from './TestEventTriggerPanel';
import { EmailApiInspector } from './EmailApiInspector';
import { EmailQuickStats } from './EmailQuickStats';

export function TabThreeContent() {
    const [activeTab, setActiveTab] = useState('logs');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold font-roboto-slab text-admin-text">Email Testing & Logs</h2>
                <p className="text-sm text-admin-text-muted">
                    Test email flows, inspect API calls, and monitor delivery status
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-admin-bg-muted p-1">
                    <TabsTrigger value="logs" className="flex items-center gap-2 data-[state=active]:bg-admin-bg text-admin-text">
                        <Mail className="h-4 w-4" />
                        Email Logs
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex items-center gap-2 data-[state=active]:bg-admin-bg text-admin-text">
                        <Zap className="h-4 w-4" />
                        Rule Logs
                    </TabsTrigger>
                    <TabsTrigger value="triggers" className="flex items-center gap-2 data-[state=active]:bg-admin-bg text-admin-text">
                        <Play className="h-4 w-4" />
                        Test Triggers
                    </TabsTrigger>
                    <TabsTrigger value="api" className="flex items-center gap-2 data-[state=active]:bg-admin-bg text-admin-text">
                        <Code className="h-4 w-4" />
                        API Inspector
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-admin-bg text-admin-text">
                        <BarChart3 className="h-4 w-4" />
                        Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="logs">
                    <EnhancedEmailLogsTable />
                </TabsContent>

                <TabsContent value="rules">
                    <EnhancedRuleLogsTable />
                </TabsContent>

                <TabsContent value="triggers">
                    <TestEventTriggerPanel />
                </TabsContent>

                <TabsContent value="api">
                    <EmailApiInspector />
                </TabsContent>

                <TabsContent value="stats">
                    <EmailQuickStats />
                </TabsContent>
            </Tabs>
        </div>
    );
}
