import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save, Check, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageMessageResponseProps {
  imageUrl: string;
  prompt: string;
  isSavedToMedia?: boolean;
  isExpired?: boolean;
  onSaveToMedia: () => Promise<void>;
  onRegenerateImage?: () => void;
}

export function ImageMessageResponse({ 
  imageUrl, 
  prompt, 
  isSavedToMedia = false,
  isExpired = false,
  onSaveToMedia,
  onRegenerateImage,
}: ImageMessageResponseProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedToMedia);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Handle expired images
  if (isExpired) {
    return (
      <div className="border border-dashed border-muted-foreground/50 rounded-lg p-6 text-center bg-muted/30">
        <ImageOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Image expired after 72 hours
        </p>
        <p className="text-xs text-muted-foreground/70 mb-3">
          Unsaved images are automatically removed to manage storage
        </p>
        {onRegenerateImage && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRegenerateImage}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Image
          </Button>
        )}
      </div>
    );
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveToMedia();
      setIsSaved(true);
      toast.success('Image saved to media');
    } catch (error) {
      console.error('Save to media error:', error);
      toast.error('Failed to save image');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image load errors - show fallback UI
  if (imageLoadError) {
    return (
      <div className="border border-dashed border-destructive/50 rounded-lg p-6 text-center bg-destructive/10">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-destructive mb-1">
          Failed to load image
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          The image may have been moved, deleted, or is temporarily unavailable
        </p>
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setImageLoadError(false)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {onRegenerateImage && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRegenerateImage}
            >
              Regenerate
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-border">
        <img 
          src={imageUrl} 
          alt={prompt}
          className="w-full h-auto"
          onError={() => setImageLoadError(true)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className="h-8 px-3"
        >
          {isSaved ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save to Media'}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="h-8 px-3"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {isDownloading ? '...' : 'Download'}
        </Button>
      </div>
    </div>
  );
}
