import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Activity, Users, DollarSign, Target, LayoutDashboard, ArrowUpRight, ArrowDownRight, Zap, Plus } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Standardized Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-admin-card p-8 rounded-2xl border border-admin-border shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <LayoutDashboard className="h-32 w-32 rotate-12" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-admin-info/10 flex items-center justify-center border border-admin-info/20 shadow-inner">
                        <LayoutDashboard className="h-8 w-8 text-admin-info" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-roboto-slab font-bold tracking-tight text-admin-text">Executive Dashboard</h1>
                        <p className="text-admin-text-muted mt-2 max-w-lg leading-relaxed">
                            Comprehensive overview of system throughput, unit economics, and neural node health metrics.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-admin-success/10 px-4 py-2 rounded-xl border border-admin-success/20 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-admin-success" />
                        <span className="text-xs font-bold text-admin-success uppercase tracking-widest">System Stable</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-admin-card border-admin-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">
                            Total Users
                        </CardTitle>
                        <div className="p-2 bg-admin-info/5 rounded-lg">
                            <Users className="h-4 w-4 text-admin-info" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-admin-text font-roboto-slab">12,345</div>
                        <div className="flex items-center gap-1.5 mt-2 text-admin-success">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold font-mono">+18.2%</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-admin-text-muted">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-admin-card border-admin-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">
                            Active Models
                        </CardTitle>
                        <div className="p-2 bg-admin-accent/5 rounded-lg">
                            <Target className="h-4 w-4 text-admin-accent" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-admin-text font-roboto-slab">24</div>
                        <div className="flex items-center gap-1.5 mt-2 text-admin-info">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold font-mono">2 NEW</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-admin-text-muted">provisioned today</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-admin-card border-admin-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">
                            System Load
                        </CardTitle>
                        <div className="p-2 bg-admin-warning/5 rounded-lg">
                            <Activity className="h-4 w-4 text-admin-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-admin-text font-roboto-slab">24%</div>
                        <div className="flex items-center gap-1.5 mt-2 text-admin-success">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold font-mono">-4.1%</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-admin-text-muted">optimized latency</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-admin-card border-admin-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">
                            Revenue (ARR)
                        </CardTitle>
                        <div className="p-2 bg-admin-success/5 rounded-lg">
                            <DollarSign className="h-4 w-4 text-admin-success" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-admin-text font-roboto-slab">$54,231</div>
                        <div className="flex items-center gap-1.5 mt-2 text-admin-success">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold font-mono">+12.5%</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-admin-text-muted">expansion bias</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-admin-card border-admin-border shadow-sm">
                    <CardHeader className="py-6 border-b border-admin-border/50">
                        <CardTitle className="text-xl font-bold text-admin-text font-roboto-slab">Operational Trace</CardTitle>
                        <CardDescription className="text-admin-text-muted text-xs font-medium">
                            Synthesized ledger of system events and architectural mutations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-admin-border">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-admin-bg-muted/30 transition-colors group">
                                    <div className="h-2.5 w-2.5 rounded-full bg-admin-info/40 group-hover:bg-admin-info group-hover:scale-125 transition-all shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-admin-text truncate">
                                            Neural Protocol Registration
                                        </p>
                                        <p className="text-xs text-admin-text-muted font-mono mt-1 opacity-70">
                                            User sequence-{i * 1245}-Z attached to system core
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-admin-text-muted uppercase tracking-tighter opacity-50">
                                        {i * 12}m ago
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-admin-bg-muted/10 border-t border-admin-border text-center">
                            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-admin-info hover:text-admin-info/80 transition-colors">
                                Access Full Ledger
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-admin-card border-admin-border shadow-sm">
                    <CardHeader className="py-6 border-b border-admin-border/50">
                        <CardTitle className="text-xl font-bold text-admin-text font-roboto-slab">Core Vitality</CardTitle>
                        <CardDescription className="text-admin-text-muted text-xs font-medium">
                            Real-time neural load and provisioned memory metrics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">CPU Throughput</span>
                                <span className="text-xs font-mono font-bold text-admin-success">42.8%</span>
                            </div>
                            <div className="h-2.5 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                                <div className="h-full bg-gradient-to-r from-admin-success to-admin-info rounded-full w-[42.8%] transition-all duration-1000" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Memory Frame</span>
                                <span className="text-xs font-mono font-bold text-admin-warning">68.1%</span>
                            </div>
                            <div className="h-2.5 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                                <div className="h-full bg-gradient-to-r from-admin-warning to-admin-error/70 rounded-full w-[68.1%] transition-all duration-1000" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Neural Latency</span>
                                <span className="text-xs font-mono font-bold text-admin-info">124ms</span>
                            </div>
                            <div className="h-2.5 bg-admin-bg-muted rounded-full overflow-hidden shadow-inner border border-admin-border/50 p-0.5">
                                <div className="h-full bg-admin-info rounded-full w-[30.5%] transition-all duration-1000" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-admin-border/50 mt-4">
                            <div className="flex items-center justify-between bg-admin-bg-muted/30 p-4 rounded-xl border border-admin-border shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Cluster Status</p>
                                    <p className="text-xs font-bold text-admin-text">US-EAST-1 Protocol</p>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-admin-success/20 flex items-center justify-center animate-pulse border border-admin-success/30">
                                    <Activity className="h-4 w-4 text-admin-success" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
