import { NormalizedFile, FileFolder } from '@/hooks/useFiles';
import { FileCard } from './FileCard';

interface FileGridProps {
  files: NormalizedFile[];
  folders: FileFolder[];
  onDelete: (fileId: string) => Promise<void>;
  onToggleFavorite: (fileId: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
  onGetDownloadUrl: (fileId: string) => Promise<string | null>;
}

export function FileGrid({ files, folders, onDelete, onToggleFavorite, onMove, onGetDownloadUrl }: FileGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {files.map((file) => (
        <FileCard 
          key={file.id} 
          file={file}
          folders={folders}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onMove={onMove}
          onGetDownloadUrl={onGetDownloadUrl}
        />
      ))}
    </div>
  );
}
