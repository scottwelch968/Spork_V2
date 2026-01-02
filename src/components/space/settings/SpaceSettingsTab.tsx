import { SettingsTable } from './SettingsTable';
import { DangerZoneCard } from './DangerZoneCard';

interface SpaceSettingsTabProps {
  space: any;
  isOwner: boolean;
  isDefaultWorkspace?: boolean;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onArchive: () => void;
}

export function SpaceSettingsTab({
  space,
  isOwner,
  isDefaultWorkspace = false,
  onUpdate,
  onDelete,
  onArchive,
}: SpaceSettingsTabProps) {
  return (
    <div className="space-y-6">
      <SettingsTable
        space={space}
        isOwner={isOwner}
        isDefaultWorkspace={isDefaultWorkspace}
        onUpdate={onUpdate}
      />

      {isOwner && !isDefaultWorkspace && (
        <DangerZoneCard
          spaceName={space.name}
          isArchived={space.is_archived}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
