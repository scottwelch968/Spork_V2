import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '@/hooks/useFiles';
import { useFileQuota } from '@/hooks/useFileQuota';
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Search, Image, FileType, FileText, File, Star, HardDrive, Upload } from 'lucide-react';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { FileUploadZone } from '@/components/files/FileUploadZone';
import { StorageQuotaWarning } from '@/components/files/StorageQuotaWarning';
import { toast } from 'sonner';

interface SpaceFilesTabProps {
  spaceId: string;
  fileQuotaMb: number | null;
}

export function SpaceFilesTab({ spaceId, fileQuotaMb }: SpaceFilesTabProps) {
  const navigate = useNavigate();
  const { files, isLoading, deleteFile, toggleFavorite, moveFile, getDownloadUrl, uploadFiles } = useFiles(spaceId);
  const { usedMb, quotaMb, percentage, warningLevel, isLoading: quotaLoading, checkCanUpload } = useFileQuota();
  const { isTeamOrHigher } = useCurrentSubscription();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('space-files-view-mode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'favorites' | 'images' | 'pdf' | 'documents'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('space-files-view-mode', viewMode);
  }, [viewMode]);

  const getFileCategory = (fileType: string, fileName: string) => {
    const lowerType = fileType.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    if (lowerType.startsWith('image/')) return 'image';
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (
      lowerType.includes('word') || 
      lowerType.includes('document') ||
      lowerType === 'text/plain' ||
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.rtf')
    ) return 'document';
    
    return 'other';
  };

  // Filter workspace files by search query
  const filteredFiles = useMemo(() => {
    return files.filter(file => 
      file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  // Apply file type filter
  const displayFiles = useMemo(() => {
    if (fileTypeFilter === 'all') return filteredFiles;
    if (fileTypeFilter === 'favorites') return filteredFiles.filter(f => f.is_favorite);
    if (fileTypeFilter === 'images') return filteredFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'image');
    if (fileTypeFilter === 'pdf') return filteredFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'pdf');
    if (fileTypeFilter === 'documents') return filteredFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'document');
    return filteredFiles;
  }, [filteredFiles, fileTypeFilter]);

  const handleUploadClick = async () => {
    if (!isTeamOrHigher) {
      toast.error('Team subscription required to upload files');
      navigate('/billing');
      return;
    }
    if (quotaMb !== null && percentage >= 100) {
      toast.error('Storage quota exceeded. Please upgrade your plan or delete some files.');
      return;
    }
    setUploadDialogOpen(true);
  };

  const handleFilesSelected = async (selectedFiles: File[], folderId?: string | null) => {
    // Check quota before upload
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    const canUpload = await checkCanUpload(totalSize);
    
    if (!canUpload) {
      toast.error('Not enough storage space. Please upgrade your plan or delete some files.');
      return;
    }

    try {
      await uploadFiles(selectedFiles, folderId);
      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      setUploadDialogOpen(false);
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Quota Warning - only shows when approaching/over limit */}
      {warningLevel && (
        <StorageQuotaWarning 
          warningLevel={warningLevel} 
          usedMb={usedMb} 
          quotaMb={quotaMb} 
        />
      )}

      {/* Header with tabs, storage button, view toggle, search, upload */}
      <div className="flex items-center justify-between border-b border-border pb-0">
        {/* File type tabs + Storage button */}
        <div className="flex items-center gap-4">
          <Tabs value={fileTypeFilter} onValueChange={(v) => setFileTypeFilter(v as any)}>
            <TabsList className="bg-transparent p-0 h-auto gap-2">
              <TabsTrigger 
                value="all"
                className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none flex items-center gap-2"
              >
                <File className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger 
                value="favorites"
                className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger 
                value="images"
                className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger 
                value="pdf"
                className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none flex items-center gap-2"
              >
                <FileType className="h-4 w-4" />
                PDF
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Docs
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Compact Storage Button */}
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-muted-foreground transition-colors"
          >
            <HardDrive className="h-4 w-4" />
            <span>
              {quotaLoading ? '...' : `${usedMb.toFixed(1)} MB`}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span>
              {quotaMb !== null ? `${quotaMb} MB` : '∞'}
            </span>
          </button>
        </div>

        {/* Grid/List toggle + Search + Upload */}
        <div className="flex items-center gap-3 pb-2">
          <div className="flex items-center border border-border rounded-full overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-none px-3 h-9 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none px-3 h-9 ${viewMode === 'list' ? 'bg-muted' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 rounded-full"
            />
          </div>
          {isTeamOrHigher ? (
            <Button 
              onClick={handleUploadClick}
              className="rounded-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/billing')}
              variant="outline"
              className="rounded-full"
            >
              Upgrade to Team
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      ) : displayFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No files yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {fileTypeFilter !== 'all' 
              ? `No ${fileTypeFilter} files found.`
              : isTeamOrHigher 
                ? 'Upload files to share with your team.'
                : 'Upgrade to Team to upload and share files with your team.'}
          </p>
          {isTeamOrHigher ? (
            <Button onClick={handleUploadClick} className="rounded-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          ) : (
            <Button onClick={() => navigate('/billing')} variant="outline" className="rounded-full">
              Upgrade to Team
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <FileGrid 
          files={displayFiles}
          folders={[]}
          onDelete={deleteFile}
          onToggleFavorite={toggleFavorite}
          onMove={moveFile}
          onGetDownloadUrl={getDownloadUrl}
        />
      ) : (
        <FileList 
          files={displayFiles}
          folders={[]}
          onDelete={deleteFile}
          onToggleFavorite={toggleFavorite}
          onMove={moveFile}
          onGetDownloadUrl={getDownloadUrl}
        />
      )}

      {/* Upload Dialog */}
      {uploadDialogOpen && (
        <FileUploadZone
          onClose={() => setUploadDialogOpen(false)}
          onFilesSelected={handleFilesSelected}
          folders={[]}
        />
      )}
    </div>
  );
}
