import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, X, Check, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageFile {
  name: string;
  path: string;
  url: string;
}

interface TemplateImageGalleryPickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
}

export function TemplateImageGalleryPicker({
  value,
  onChange,
  folder,
  label = 'Image',
}: TemplateImageGalleryPickerProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');

  useEffect(() => {
    loadImages();
  }, [folder]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.from('app-media').list(folder, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      const imageList = (data || [])
        .filter((file) => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('app-media')
            .getPublicUrl(`${folder}/${file.name}`);
          return {
            name: file.name,
            path: `${folder}/${file.name}`,
            url: urlData.publicUrl,
          };
        });

      setImages(imageList);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `img-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage
        .from('app-media')
        .upload(`${folder}/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('app-media')
        .getPublicUrl(`${folder}/${fileName}`);

      onChange(urlData.publicUrl);
      toast.success('Image uploaded');
      loadImages();
      setActiveTab('gallery');
    } catch (error: any) {
      toast.error('Failed to upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Selected preview */}
      {value && (
        <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/50">
          <img
            src={value}
            alt="Selected"
            className="h-12 w-12 rounded-lg object-cover"
          />
          <span className="text-sm text-muted-foreground flex-1 truncate">Selected image</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gallery" className="text-xs">
            <ImageIcon className="h-3 w-3 mr-1" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No images in library. Upload some in the Image Library tab.
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
              {images.map((image) => (
                <button
                  key={image.path}
                  type="button"
                  onClick={() => onChange(image.url)}
                  className={cn(
                    'relative h-12 w-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                    value === image.url
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-cover"
                  />
                  {value === image.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-2">
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              id={`upload-${folder.replace(/\//g, '-')}`}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`upload-${folder.replace(/\//g, '-')}`)?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3 w-3" />
                  Upload New
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG or WebP. Max 2MB.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
