import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageFile {
  name: string;
  path: string;
  url: string;
}

interface TemplateImageLibraryTabProps {
  folder: string;
  title: string;
  description: string;
}

export function TemplateImageLibraryTab({ folder, title, description }: TemplateImageLibraryTabProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    let uploaded = 0;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 2MB)`);
          continue;
        }

        const fileName = `img-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage
          .from('app-media')
          .upload(`${folder}/${fileName}`, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }
        uploaded++;
      }

      if (uploaded > 0) {
        toast.success(`Uploaded ${uploaded} image(s)`);
        loadImages();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (image: ImageFile) => {
    try {
      const { error } = await supabase.storage.from('app-media').remove([image.path]);
      if (error) throw error;

      setImages((prev) => prev.filter((i) => i.path !== image.path));
      toast.success('Image deleted');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description} ({images.length} images)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload section */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              id={`image-upload-${folder.replace(/\//g, '-')}`}
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById(`image-upload-${folder.replace(/\//g, '-')}`)?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">PNG, JPG or WebP. Max 2MB each.</p>
          </div>

          {/* Image grid */}
          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No images uploaded yet</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {images.map((image) => (
                <div key={image.path} className="relative group">
                  <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(image)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
