import { useState } from 'react';
import { NormalizedFile, FileFolder } from '@/hooks/useFiles';
import { FileRow } from './FileRow';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FileListProps {
  files: NormalizedFile[];
  folders: FileFolder[];
  onDelete: (fileId: string) => Promise<void>;
  onToggleFavorite: (fileId: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
  onGetDownloadUrl: (fileId: string) => Promise<string | null>;
}

export function FileList({ files, folders, onDelete, onToggleFavorite, onMove, onGetDownloadUrl }: FileListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

  const totalItems = files.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedFiles = files.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    if (value === 'all') {
      setItemsPerPage('all');
    } else {
      setItemsPerPage(Number(value));
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Content Card - fills remaining space */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Table Header - fixed */}
        <div className="grid grid-cols-[1fr_100px_120px_180px_80px] gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border flex-shrink-0">
          <div>Name</div>
          <div>Size</div>
          <div>Type</div>
          <div>Modified</div>
          <div>Actions</div>
        </div>

        {/* Content Rows - scrollable */}
        <div className="divide-y divide-border flex-1 overflow-auto">
          {paginatedFiles.map((file) => (
            <FileRow 
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
      </div>

      {/* Pagination Controls - fixed at bottom */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={itemsPerPage === 'all' ? 'all' : String(itemsPerPage)}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {itemsPerPage === 'all' 
              ? `Showing all ${totalItems} items`
              : `${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}`
            }
          </span>
        </div>

        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
