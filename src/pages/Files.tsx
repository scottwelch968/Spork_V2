import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '@/hooks/useFiles';
import { useFileQuota } from '@/hooks/useFileQuota';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewToggle } from '@/components/ui/view-toggle';
import { SearchBar } from '@/components/ui/search-bar';
import { Image, FileType, FileText, File, Star, HardDrive } from 'lucide-react';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { StorageQuotaWarning } from '@/components/files/StorageQuotaWarning';

export default function Files() {
  const navigate = useNavigate();
  const { files, folders, isLoading, deleteFile, toggleFavorite, moveFile, getDownloadUrl } = useFiles();
  const { usedMb, quotaMb, percentage, warningLevel, isLoading: quotaLoading } = useFileQuota();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('files-view-mode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'favorites' | 'images' | 'pdf' | 'documents'>('all');

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('files-view-mode', viewMode);
  }, [viewMode]);

  // Find the "My Chats" system folder
  const myChatsFolder = useMemo(() => 
    folders.find(f => f.folder_type === 'my_chats' && f.is_system_folder),
    [folders]
  );

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

  // Filter files to only show chat-generated content (from My Chats folder)
  const chatFiles = useMemo(() => {
    if (!myChatsFolder) return [];
    return files.filter(file => 
      file.folder_id === myChatsFolder.id &&
      file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, myChatsFolder, searchQuery]);

  // Apply file type filter
  const displayFiles = useMemo(() => {
    if (fileTypeFilter === 'all') return chatFiles;
    if (fileTypeFilter === 'favorites') return chatFiles.filter(f => f.is_favorite);
    if (fileTypeFilter === 'images') return chatFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'image');
    if (fileTypeFilter === 'pdf') return chatFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'pdf');
    if (fileTypeFilter === 'documents') return chatFiles.filter(f => getFileCategory(f.file_type, f.original_name) === 'document');
    return chatFiles;
  }, [chatFiles, fileTypeFilter]);

  return (
    <div className="container mx-auto px-6 py-4 max-w-7xl flex flex-col h-full">
        {/* Storage Quota Warning - only shows when approaching/over limit */}
        {warningLevel && (
          <div className="mb-6">
            <StorageQuotaWarning 
              warningLevel={warningLevel} 
              usedMb={usedMb} 
              quotaMb={quotaMb} 
            />
          </div>
        )}

        {/* Header with tabs, storage button, view toggle, search */}
        <div className="flex items-center justify-between mb-6 border-b border-[#ACACAC]">
          {/* File type tabs + Storage button */}
          <div className="flex items-center gap-4">
            <Tabs value={fileTypeFilter} onValueChange={(v) => setFileTypeFilter(v as any)}>
              <TabsList variant="underline">
                <TabsTrigger value="all">
                  <File className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  <Star className="h-4 w-4" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="images">
                  <Image className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="pdf">
                  <FileType className="h-4 w-4" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4" />
                  Docs
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Compact Storage Button */}
            <button
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2 rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm font-medium text-[#181818] transition-colors"
            >
              <HardDrive className="h-4 w-4" />
              <span>
                {quotaLoading ? '...' : `${usedMb.toFixed(1)} MB`}
              </span>
              <span className="text-[#181818]/60">|</span>
              <span>
                {quotaMb !== null ? `${quotaMb} MB` : '∞'}
              </span>
            </button>
          </div>

          {/* Grid/List toggle + Search */}
          <div className="flex items-center gap-3 pb-2">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search media..." 
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading media...</p>
            </div>
          ) : displayFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No media files yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {fileTypeFilter !== 'all' 
                  ? `No ${fileTypeFilter} files found.`
                  : 'Save images or responses from chat to see them here.'}
              </p>
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
        </div>
    </div>
  );
}
