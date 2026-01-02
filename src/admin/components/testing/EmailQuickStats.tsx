import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui';
import { Mail, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useEmailTesting } from '@/hooks/useEmailTesting';

export function EmailQuickStats() {
    const { stats, loadStats } = useEmailTesting();

    useEffect(() => {
        loadStats();
    }, []);

    const statCards = [
        {
            title: 'Total Sent',
            value: stats?.total_sent || 0,
            icon: CheckCircle,
            color: 'text-admin-success',
            bgColor: 'bg-admin-success/10',
        },
        {
            title: 'Total Failed',
            value: stats?.total_failed || 0,
            icon: XCircle,
            color: 'text-admin-error',
            bgColor: 'bg-admin-error/10',
        },
        {
            title: 'Success Rate',
            value: `${(stats?.success_rate || 0).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-admin-info',
            bgColor: 'bg-admin-info/10',
        },
        {
            title: 'Sent Today',
            value: stats?.sent_today || 0,
            icon: Clock,
            color: 'text-admin-warning',
            bgColor: 'bg-admin-warning/10',
        },
        {
            title: 'Sent This Week',
            value: stats?.sent_week || 0,
            icon: Calendar,
            color: 'text-admin-info',
            bgColor: 'bg-admin-info/10',
        },
        {
            title: 'Sent This Month',
            value: stats?.sent_month || 0,
            icon: Mail,
            color: 'text-admin-text-muted',
            bgColor: 'bg-admin-bg-muted',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-admin-card border-admin-border hover:border-admin-accent/50 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-admin-text-muted font-roboto-slab">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-admin-text font-roboto-slab">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity Summary */}
            <Card className="bg-admin-card border-admin-border">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-admin-text font-roboto-slab">Recent Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-admin-success/5 rounded-xl border border-admin-success/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-admin-success/10 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-admin-success" />
                                </div>
                                <div>
                                    <p className="font-bold text-admin-text text-sm">Emails Delivered</p>
                                    <p className="text-xs text-admin-text-muted">Successfully sent to recipients</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-admin-success font-roboto-slab">{stats?.total_sent || 0}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-admin-error/5 rounded-xl border border-admin-error/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-admin-error/10 rounded-lg">
                                    <XCircle className="h-5 w-5 text-admin-error" />
                                </div>
                                <div>
                                    <p className="font-bold text-admin-text text-sm">Delivery Failures</p>
                                    <p className="text-xs text-admin-text-muted">Failed to reach recipient</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-admin-error font-roboto-slab">{stats?.total_failed || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
