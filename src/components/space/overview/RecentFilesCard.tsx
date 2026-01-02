import { useFiles } from '@/hooks/useFiles';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Files, Download, FileText, Image, Video, File as FileIcon, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

interface RecentFilesCardProps {
  spaceId: string;
}

interface UnifiedFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  source: 'file' | 'knowledge-base';
  storagePath?: string;
}

export function RecentFilesCard({ spaceId }: RecentFilesCardProps) {
  const { files, isLoading: filesLoading, getDownloadUrl } = useFiles();
  const { documents, isLoading: docsLoading } = useKnowledgeBase();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  
  const isLoading = filesLoading || docsLoading;
  
  // Combine and normalize both data sources
  const recentFiles = useMemo(() => {
    const unifiedFiles: UnifiedFile[] = [
      ...files.map(f => ({
        id: f.id,
        name: f.original_name,
        fileType: f.file_type,
        fileSize: f.file_size,
        createdAt: f.created_at,
        source: 'file' as const,
      })),
      ...documents.map(d => ({
        id: d.id,
        name: d.file_name,
        fileType: d.file_type,
        fileSize: d.file_size,
        createdAt: d.created_at,
        source: 'knowledge-base' as const,
        storagePath: d.storage_path,
      })),
    ];
    
    return unifiedFiles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [files, documents]);

  const handleDownload = async (file: UnifiedFile) => {
    try {
      let url: string | null = null;
      
      if (file.source === 'file') {
        url = await getDownloadUrl(file.id);
      } else {
        // Knowledge base document - create signed URL
        const { data } = await supabase.storage
          .from('knowledge-base')
          .createSignedUrl(file.storagePath!, 60);
        url = data?.signedUrl || null;
      }
      
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getFileIcon = (fileType: string, source: 'file' | 'knowledge-base') => {
    if (source === 'knowledge-base') return BookOpen;
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Recent Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Files className="h-5 w-5" />
          Recent Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet</p>
        ) : (
          <div className="space-y-3">
            {recentFiles.map((file) => {
              const Icon = getFileIcon(file.fileType, file.source);
              return (
                <div
                  key={`${file.source}-${file.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-sm">{file.name}</p>
                        {file.source === 'knowledge-base' && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">KB</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        
        {(files.length > 5 || documents.length > 0) && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setSearchParams({ tab: 'files' })}
          >
            View All Files
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
