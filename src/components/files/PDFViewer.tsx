import { X, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerModalProps {
  pdfUrl: string;
  pdfName: string;
  onClose: () => void;
  onDownload?: () => void;
}

export function PDFViewerModal({ pdfUrl, pdfName, onClose, onDownload }: PDFViewerModalProps) {
  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <span className="text-white font-medium truncate max-w-[60%]">{pdfName}</span>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={handleOpenInNewTab} className="text-white hover:bg-white/20">
            <ExternalLink className="h-5 w-5" />
          </Button>
          {onDownload && (
            <Button size="icon" variant="ghost" onClick={onDownload} className="text-white hover:bg-white/20">
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* PDF Viewer using iframe with Google Docs viewer as fallback */}
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
          className="w-full h-full rounded-lg bg-white"
          title={pdfName}
        />
      </div>
    </div>
  );
}
