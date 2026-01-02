/**
 * AI Functions Tab - Main container for function management
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { FunctionsList, ContainersList, ActorsList, EventFlowDiagram } from './functions';
import { Code, Box, Users, GitBranch } from 'lucide-react';

export function AiFunctionsTab() {
  const [activeTab, setActiveTab] = useState('functions');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">Ai Functions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage chat functions, UI containers, and actor permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger
            value="functions"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
          >
            <Code className="h-4 w-4 mr-2" />
            Functions
          </TabsTrigger>
          <TabsTrigger
            value="containers"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
          >
            <Box className="h-4 w-4 mr-2" />
            Containers
          </TabsTrigger>
          <TabsTrigger
            value="actors"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
          >
            <Users className="h-4 w-4 mr-2" />
            Actors
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Event Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="functions" className="mt-6">
          <FunctionsList />
        </TabsContent>

        <TabsContent value="containers" className="mt-6">
          <ContainersList />
        </TabsContent>

        <TabsContent value="actors" className="mt-6">
          <ActorsList />
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <EventFlowDiagram />
        </TabsContent>
      </Tabs>
    </div>
  );
}
