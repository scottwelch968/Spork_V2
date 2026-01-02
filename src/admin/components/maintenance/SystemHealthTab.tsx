import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress } from '@/admin/ui';
import { Database, HardDrive, Cpu, Activity, Zap, Shield, Server, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemHealthTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Vital Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cloud Instance', val: 'Healthy', icon: Database, color: 'text-admin-info', bg: 'bg-admin-info/10', border: 'border-admin-info/20', sub: 'Neural Parity Active' },
          { label: 'Storage Cluster', val: 'Online', icon: HardDrive, color: 'text-admin-accent', bg: 'bg-admin-accent/10', border: 'border-admin-accent/20', sub: '99.9% Uptime' },
          { label: 'Edge Nodes', val: 'Synchronized', icon: Cpu, color: 'text-admin-warning', bg: 'bg-admin-warning/10', border: 'border-admin-warning/20', sub: '8 Functions Active' },
          { label: 'API Gateway', val: 'Optimal', icon: Zap, color: 'text-admin-success', bg: 'bg-admin-success/10', border: 'border-admin-success/20', sub: '12ms Avg Latency' },
        ].map((item, i) => (
          <Card key={i} className="bg-admin-card border-admin-border shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className={cn("h-1 w-full", i === 0 ? "bg-admin-info" : i === 1 ? "bg-admin-accent" : i === 2 ? "bg-admin-warning" : "bg-admin-success")} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-500", item.bg, item.border)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">{item.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-admin-text font-roboto-slab truncate">{item.val}</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-admin-success animate-pulse shrink-0" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-admin-text-muted opacity-50 flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Resource Allocation */}
        <Card className="lg:col-span-2 bg-admin-card border-admin-border shadow-sm overflow-hidden">
          <CardHeader className="py-6 border-b border-admin-border/50 bg-admin-bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-admin-text font-roboto-slab">Resource Allocation</CardTitle>
                <CardDescription className="text-admin-text-muted text-xs font-medium">Distribution of system-wide architectural resources.</CardDescription>
              </div>
              <Badge className="bg-admin-info/10 text-admin-info border-admin-info/20 px-3 py-1">LIVE TELEMETRY</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-admin-text-muted">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-admin-info" />
                  <span>Compute Protocol</span>
                </div>
                <span className="text-admin-text">34.2%</span>
              </div>
              <div className="h-3 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                <div className="h-full bg-admin-info rounded-full w-[34.2%] transition-all duration-1000 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-admin-info via-admin-info-muted to-admin-info" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-admin-text-muted">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-admin-accent" />
                  <span>Storage Parity</span>
                </div>
                <span className="text-admin-text">68.9%</span>
              </div>
              <div className="h-3 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                <div className="h-full bg-admin-accent rounded-full w-[68.9%] transition-all duration-1000" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-admin-text-muted">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-admin-warning" />
                  <span>Network Throughput</span>
                </div>
                <span className="text-admin-text">12.5%</span>
              </div>
              <div className="h-3 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                <div className="h-full bg-admin-warning rounded-full w-[12.5%] transition-all duration-1000" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs / Notifications */}
        <Card className="bg-admin-card border-admin-border shadow-sm">
          <CardHeader className="py-6 border-b border-admin-border/50 bg-admin-bg-muted/10">
            <CardTitle className="text-xl font-bold text-admin-text font-roboto-slab">System Ledger</CardTitle>
            <CardDescription className="text-admin-text-muted text-xs font-medium">Neural activity and fault sequence audit.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-admin-border">
              {[
                { type: 'info', msg: 'Neural cache flushed successfully', time: '2m ago' },
                { type: 'success', msg: 'New node provisioned: AWS-USE1', time: '14m ago' },
                { type: 'warning', msg: 'High latency detected in cluster B', time: '45m ago' },
                { type: 'info', msg: 'System backup cycle completed', time: '1h ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-4 p-5 hover:bg-admin-bg-muted/30 transition-colors">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                    log.type === 'success' ? 'bg-admin-success' : log.type === 'warning' ? 'bg-admin-warning' : 'bg-admin-info'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-admin-text leading-tight">{log.msg}</p>
                    <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-tighter mt-1 opacity-50">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-admin-bg-muted/10 border-t border-admin-border text-center">
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-admin-info hover:text-admin-info/80 transition-colors">
                View Full Sequence
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Diagnostics Container */}
      <Card className="bg-admin-card border-admin-border shadow-xl border-dashed relative overflow-hidden group">
        <div className="absolute inset-0 bg-grid-admin opacity-[0.02]" />
        <CardContent className="p-16 text-center z-10 relative">
          <div className="h-20 w-20 bg-admin-bg-muted rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-admin-border rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Activity className="h-10 w-10 text-admin-text-muted opacity-30" />
          </div>
          <h3 className="text-2xl font-bold text-admin-text font-roboto-slab tracking-tight">Advanced Diagnostics Protocol</h3>
          <p className="text-admin-text-muted text-sm max-w-lg mx-auto mt-4 leading-relaxed">
            Autonomous system health monitoring and neural self-healing protocols are currently being synthesized. Detailed database introspection and cluster analysis coming soon.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Badge variant="outline" className="border-admin-border text-admin-text-muted px-4 py-1 uppercase tracking-widest text-[9px] font-bold">V2.4 PREVIEW</Badge>
            <Badge className="bg-admin-accent/10 text-admin-accent border-admin-accent/20 px-4 py-1 uppercase tracking-widest text-[9px] font-bold">ALPHA PROTOCOL</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


