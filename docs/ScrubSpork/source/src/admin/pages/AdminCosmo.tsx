import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Brain, 
  Settings2, 
  Link2, 
  Bug, 
  FlaskConical,
  Route,
  HeartPulse,
  ListOrdered,
  DollarSign,
  Code
} from 'lucide-react';
import { 
  CosmoOverviewTab,
  CosmoIntentsTab,
  CosmoConfigurationTab,
  CosmoFunctionChainsTab,
  CosmoActionMappingsTab,
  CosmoDebugTab,
  CosmoTestingTab,
  CosmoHealthTab,
  CosmoQueueTab,
  CosmoCostsTab 
} from '@/admin/components/cosmo';
import { AiFunctionsTab } from '@/admin/components/models';

const AdminCosmo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">COSMO Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive orchestration system management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 h-auto flex-wrap gap-1">
          {/* MONITORING GROUP */}
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="health" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <HeartPulse className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger 
            value="queue" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <ListOrdered className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger 
            value="costs" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          {/* ROUTING GROUP */}
          <TabsTrigger 
            value="intents" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Brain className="h-4 w-4" />
            Intents & Routing
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Route className="h-4 w-4" />
            Action Mappings
          </TabsTrigger>
          <TabsTrigger 
            value="configuration" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          {/* FUNCTIONS GROUP */}
          <TabsTrigger 
            value="chains" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Link2 className="h-4 w-4" />
            Function Chains
          </TabsTrigger>
          <TabsTrigger 
            value="functions" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Code className="h-4 w-4" />
            Ai Functions
          </TabsTrigger>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          {/* DEVELOPMENT GROUP */}
          <TabsTrigger 
            value="debug" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <Bug className="h-4 w-4" />
            Debug Console
          </TabsTrigger>
          <TabsTrigger 
            value="testing" 
            className="data-[state=active]:bg-background text-foreground gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            Testing Sandbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CosmoOverviewTab />
        </TabsContent>

        <TabsContent value="health">
          <CosmoHealthTab />
        </TabsContent>

        <TabsContent value="queue">
          <CosmoQueueTab />
        </TabsContent>

        <TabsContent value="costs">
          <CosmoCostsTab />
        </TabsContent>

        <TabsContent value="intents">
          <CosmoIntentsTab />
        </TabsContent>

        <TabsContent value="actions">
          <CosmoActionMappingsTab />
        </TabsContent>

        <TabsContent value="configuration">
          <CosmoConfigurationTab />
        </TabsContent>

        <TabsContent value="chains">
          <CosmoFunctionChainsTab />
        </TabsContent>

        <TabsContent value="functions">
          <AiFunctionsTab />
        </TabsContent>

        <TabsContent value="debug">
          <CosmoDebugTab />
        </TabsContent>

        <TabsContent value="testing">
          <CosmoTestingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCosmo;
