import { useState, useEffect, useRef } from 'react';
import { NormalizedFile, FileFolder } from '@/hooks/useFiles';
import { 
  Download, Trash2, Star, MoreVertical, Eye,
  Image, FileText, FileType, File
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PDFViewerModal } from './PDFViewer';
import { ImageLightbox } from './ImageLightbox';
import { DeleteFileDialog } from './DeleteFileDialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface FileRowProps {
  file: NormalizedFile;
  folders: FileFolder[];
  onDelete: (fileId: string) => Promise<void>;
  onToggleFavorite: (fileId: string) => Promise<void>;
  onMove: (fileId: string, folderId: string | null) => Promise<void>;
  onGetDownloadUrl: (fileId: string) => Promise<string | null>;
}

export function FileRow({ file, folders, onDelete, onToggleFavorite, onMove, onGetDownloadUrl }: FileRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<'above' | 'below'>('below');
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const isImage = file.file_type.toLowerCase().startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.original_name);

  // Preload thumbnail for images
  useEffect(() => {
    if (isImage) {
      onGetDownloadUrl(file.id).then(url => {
        if (url) setThumbnailUrl(url);
      }).catch(() => {});
    }
  }, [file.id, isImage, onGetDownloadUrl]);

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

  const handleViewPDF = async () => {
    const url = await onGetDownloadUrl(file.id);
    if (url) {
      setPdfUrl(url);
      setShowPDFViewer(true);
    }
  };

  const handleViewImage = async () => {
    const url = await onGetDownloadUrl(file.id);
    if (url) {
      setImageUrl(url);
      setShowImageLightbox(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isPDF = file.file_type.toLowerCase() === 'application/pdf' || 
                file.original_name.toLowerCase().endsWith('.pdf');

  const isViewable = isPDF || isImage;

  const formatFileType = (mimeType: string, fileName: string) => {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'Adobe PDF',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'application/msword': 'Microsoft DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Microsoft DOCX',
      'application/vnd.ms-excel': 'Microsoft XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Microsoft XLSX',
      'application/vnd.ms-powerpoint': 'Microsoft PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Microsoft PPTX',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
      'application/json': 'JSON',
      'application/zip': 'ZIP',
    };
    
    if (mimeMap[mimeType.toLowerCase()]) {
      return mimeMap[mimeType.toLowerCase()];
    }
    
    // Fallback: extract extension from filename
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || mimeType;
  };

  const handleRowClick = () => {
    if (isImage) {
      handleViewImage();
    } else if (isPDF) {
      handleViewPDF();
    }
  };

  const handleMouseEnter = () => {
    if (thumbnailRef.current) {
      const rect = thumbnailRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      setPreviewPosition(rect.top > viewportHeight / 2 ? 'above' : 'below');
    }
  };

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

  const getFileIconForList = () => {
    const category = getFileCategory(file.file_type, file.original_name);
    
    switch (category) {
      case 'image':
        return { icon: Image, iconColor: 'text-emerald-500' };
      case 'pdf':
        return { icon: FileType, iconColor: 'text-red-500' };
      case 'document':
        return { icon: FileText, iconColor: 'text-gray-500' };
      default:
        return { icon: File, iconColor: 'text-blue-500' };
    }
  };

  return (
    <>
      <div 
        onClick={handleRowClick}
        className={`grid grid-cols-[1fr_100px_120px_180px_80px] gap-4 items-center px-4 py-4 transition-colors ${isViewable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      >
        {/* Name Column */}
        <div className="flex items-center gap-2 min-w-0">
          <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div 
                ref={thumbnailRef}
                className="relative flex-shrink-0"
                onMouseEnter={handleMouseEnter}
              >
                {isImage && thumbnailUrl ? (
                  <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                    <img 
                      src={thumbnailUrl} 
                      alt={file.original_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  (() => {
                    const { icon: IconComponent, iconColor } = getFileIconForList();
                    return <IconComponent className={`h-8 w-8 ${iconColor}`} />;
                  })()
                )}
                {file.is_favorite && (
                  <Star className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </HoverCardTrigger>
            {isImage && thumbnailUrl && (
              <HoverCardContent 
                side={previewPosition === 'above' ? 'top' : 'bottom'}
                align="start"
                className="p-1 w-[250px] h-[250px]"
              >
                <img 
                  src={thumbnailUrl} 
                  alt={file.original_name}
                  className="w-full h-full object-contain rounded"
                />
              </HoverCardContent>
            )}
          </HoverCard>
          <span className="truncate text-sm" title={file.original_name}>{file.original_name}</span>
        </div>

        {/* Size Column */}
        <div className="text-sm text-muted-foreground">{formatFileSize(file.file_size)}</div>

        {/* Type Column */}
        <div className="text-sm text-muted-foreground">{formatFileType(file.file_type, file.original_name)}</div>

        {/* Modified Column */}
        <div className="text-sm text-muted-foreground">
          {format(new Date(file.created_at), 'MMM d, yyyy h:mm a')}
        </div>

        {/* Actions Column */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPDF && (
                <DropdownMenuItem onClick={handleViewPDF}>
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
      </div>
      
      {showPDFViewer && pdfUrl && (
        <PDFViewerModal
          pdfUrl={pdfUrl}
          pdfName={file.original_name}
          onClose={() => setShowPDFViewer(false)}
          onDownload={handleDownload}
        />
      )}
      
      {showImageLightbox && imageUrl && (
        <ImageLightbox
          imageUrl={imageUrl}
          imageName={file.original_name}
          onClose={() => setShowImageLightbox(false)}
        />
      )}
      
      <DeleteFileDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        fileName={file.original_name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
