import { useSpaceChats } from '@/hooks/useSpaceChats';
import { useFiles } from '@/hooks/useFiles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Files, Users, HardDrive } from 'lucide-react';

interface SpaceStatsCardsProps {
  spaceId: string;
  fileQuotaMb: number | null;
}

export function SpaceStatsCards({ spaceId, fileQuotaMb }: SpaceStatsCardsProps) {
  const { chats } = useSpaceChats(spaceId);
  const { files } = useFiles();

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['space-member-count', spaceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', spaceId);
      
      if (error) throw error;
      return (count || 0) + 1; // +1 for owner
    },
  });

  const totalStorageMB = files.reduce((acc, file) => acc + (file.file_size / (1024 * 1024)), 0);
  const storagePercentage = fileQuotaMb ? (totalStorageMB / fileQuotaMb) * 100 : 0;

  const stats = [
    {
      title: 'Total Chats',
      value: chats.length,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Files',
      value: files.length,
      icon: Files,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Team Members',
      value: memberCount,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Storage Used',
      value: fileQuotaMb 
        ? `${totalStorageMB.toFixed(1)} / ${fileQuotaMb} MB`
        : `${totalStorageMB.toFixed(1)} MB`,
      icon: HardDrive,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      subtitle: fileQuotaMb ? `${storagePercentage.toFixed(1)}% used` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
