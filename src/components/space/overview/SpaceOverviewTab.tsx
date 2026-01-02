import { RecentActivityPanel } from './RecentActivityPanel';

interface SpaceOverviewTabProps {
  spaceId: string;
  fileQuotaMb: number | null;
}

export function SpaceOverviewTab({ spaceId, fileQuotaMb }: SpaceOverviewTabProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <RecentActivityPanel spaceId={spaceId} />
    </div>
  );
}
