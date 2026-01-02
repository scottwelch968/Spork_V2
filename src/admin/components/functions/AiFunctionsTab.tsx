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
        <h2 className="text-xl font-bold font-roboto-slab uppercase tracking-tight text-heading">Ai Functions</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">
          Manage chat functions, UI containers, and actor permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-admin-bg-muted/50 p-1 rounded-full border border-admin-border/50">
          <TabsTrigger
            value="functions"
            className="rounded-full data-[state=active]:bg-admin-bg data-[state=active]:text-admin-accent data-[state=active]:shadow-sm px-6 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <Code className="h-3.5 w-3.5 mr-2" />
            Functions
          </TabsTrigger>
          <TabsTrigger
            value="containers"
            className="rounded-full data-[state=active]:bg-admin-bg data-[state=active]:text-admin-accent data-[state=active]:shadow-sm px-6 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <Box className="h-3.5 w-3.5 mr-2" />
            Containers
          </TabsTrigger>
          <TabsTrigger
            value="actors"
            className="rounded-full data-[state=active]:bg-admin-bg data-[state=active]:text-admin-accent data-[state=active]:shadow-sm px-6 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <Users className="h-3.5 w-3.5 mr-2" />
            Actors
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="rounded-full data-[state=active]:bg-admin-bg data-[state=active]:text-admin-accent data-[state=active]:shadow-sm px-6 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <GitBranch className="h-3.5 w-3.5 mr-2" />
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
