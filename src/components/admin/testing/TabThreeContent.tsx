import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <h2 className="text-xl font-semibold font-roboto-slab">Email Testing & Logs</h2>
        <p className="text-muted-foreground">
          Test email flows, inspect API calls, and monitor delivery status
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Logs
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Rule Logs
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test Triggers
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API Inspector
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <EnhancedEmailLogsTable />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <EnhancedRuleLogsTable />
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <TestEventTriggerPanel />
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <EmailApiInspector />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <EmailQuickStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
