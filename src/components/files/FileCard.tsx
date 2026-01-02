import { useState, useEffect } from 'react';
import { NormalizedFile, FileFolder } from '@/hooks/useFiles';
import { Card } from '@/components/ui/card';
import { FileIcon, Download, Trash2, Star, MoreVertical, Image, FileText, FileType, File, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ImageLightbox } from './ImageLightbox';
import { PDFViewerModal } from './PDFViewer';
import { DeleteFileDialog } from './DeleteFileDialog';

interface FileCardProps {
  file: NormalizedFile;
  folders: FileFolder[];
  onDelete: (fileId: string) => Promise<void>;
  onToggleFavorite: (fileId: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
  onGetDownloadUrl: (fileId: string) => Promise<string | null>;
}

export function FileCard({ file, folders, onDelete, onToggleFavorite, onMove, onGetDownloadUrl }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    const url = await onGetDownloadUrl(file.id);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(file.id);
    setShowDeleteDialog(false);
    setIsDeleting(false);
  };

  const handleImageClick = async () => {
    const category = getFileCategory(file.file_type, file.original_name);
    if (category === 'image') {
      const url = await onGetDownloadUrl(file.id);
      if (url) {
        setImageUrl(url);
        setShowLightbox(true);
      }
    }
  };

  const handlePDFClick = async () => {
    const category = getFileCategory(file.file_type, file.original_name);
    if (category === 'pdf') {
      const url = await onGetDownloadUrl(file.id);
      if (url) {
        setPdfUrl(url);
        setShowPDFViewer(true);
      }
    }
  };

  // Preload image URL for images
  useEffect(() => {
    const category = getFileCategory(file.file_type, file.original_name);
    if (category === 'image') {
      onGetDownloadUrl(file.id).then(url => {
        if (url) setImageUrl(url);
      }).catch(() => {
        // Silently fail - file may not exist in storage
      });
    }
  }, [file.id, file.file_type, file.original_name, onGetDownloadUrl]);

  const getFileCategory = (fileType: string, fileName: string) => {
    const lowerType = fileType.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    // Images
    if (lowerType.startsWith('image/')) return 'image';
    
    // PDFs
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    
    // Documents
    if (
      lowerType.includes('word') || 
      lowerType.includes('document') ||
      lowerType === 'text/plain' ||
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.rtf')
    ) return 'document';
    
    // Default
    return 'other';
  };

  const getFileIcon = () => {
    const category = getFileCategory(file.file_type, file.original_name);
    
    // For actual images, show the image thumbnail
    if (category === 'image') {
      return (
        <div 
          className="h-32 rounded-t-lg cursor-pointer overflow-hidden bg-muted"
          onClick={handleImageClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={file.original_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-emerald-100">
              <Image className="h-12 w-12 text-emerald-500" />
            </div>
          )}
        </div>
      );
    }
    
    if (category === 'pdf') {
      return (
        <div 
          className="flex items-center justify-center h-32 bg-red-100 rounded-t-lg cursor-pointer hover:bg-red-200 transition-colors"
          onClick={handlePDFClick}
        >
          <FileType className="h-12 w-12 text-red-500" />
        </div>
      );
    }
    
    if (category === 'document') {
      return (
        <div className="flex items-center justify-center h-32 bg-gray-200 rounded-t-lg">
          <FileText className="h-12 w-12 text-gray-600" />
        </div>
      );
    }
    
    // Default: blue for other file types
    return (
      <div className="flex items-center justify-center h-32 bg-blue-100 rounded-t-lg">
        <File className="h-12 w-12 text-blue-500" />
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isPDF = getFileCategory(file.file_type, file.original_name) === 'pdf';

  return (
    <Card className="group overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {getFileIcon()}
      <div className="p-3 overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {file.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
            <p className="text-sm font-medium truncate min-w-0" title={file.original_name}>
              {file.original_name}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPDF && (
                <DropdownMenuItem onClick={handlePDFClick}>
                  <Eye className="h-4 w-4 mr-2" />
                  View PDF
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(file.id)}>
                <Star className={`h-4 w-4 mr-2 ${file.is_favorite ? 'fill-yellow-400' : ''}`} />
                {file.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} disabled={isDeleting} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(file.file_size)}</span>
          <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
      
      {showLightbox && imageUrl && (
        <ImageLightbox
          imageUrl={imageUrl}
          imageName={file.original_name}
          onClose={() => setShowLightbox(false)}
        />
      )}
      
      {showPDFViewer && pdfUrl && (
        <PDFViewerModal
          pdfUrl={pdfUrl}
          pdfName={file.original_name}
          onClose={() => setShowPDFViewer(false)}
          onDownload={handleDownload}
        />
      )}
      
      <DeleteFileDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        fileName={file.original_name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
