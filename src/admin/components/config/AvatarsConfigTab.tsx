import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Loader2, Upload, Trash2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Avatar {
  name: string;
  path: string;
  url: string;
}

export function AvatarsConfigTab() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.from('app-media').list('templates/avatars', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      const avatarList = (data || [])
        .filter((file) => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('app-media')
            .getPublicUrl(`templates/avatars/${file.name}`);
          return {
            name: file.name,
            path: `templates/avatars/${file.name}`,
            url: urlData.publicUrl,
          };
        });

      setAvatars(avatarList);
    } catch (error) {
      console.error('Error loading avatars:', error);
      toast.error('Failed to load avatars');
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

        const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage
          .from('app-media')
          .upload(`templates/avatars/${fileName}`, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }
        uploaded++;
      }

      if (uploaded > 0) {
        toast.success(`Uploaded ${uploaded} avatar(s)`);
        loadAvatars();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatars');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (avatar: Avatar) => {
    try {
      const { error } = await supabase.storage.from('app-media').remove([avatar.path]);
      if (error) throw error;

      setAvatars((prev) => prev.filter((a) => a.path !== avatar.path));
      toast.success('Avatar deleted');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-admin-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persona Avatars
          </CardTitle>
          <CardDescription>
            Manage the avatar library used for persona templates ({avatars.length} avatars)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload section */}
          <div className="border-2 border-dashed border-admin-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              id="avatar-upload"
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('avatar-upload')?.click()}
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
                  Upload Avatars
                </>
              )}
            </Button>
            <p className="text-sm text-admin-text-muted mt-2">PNG, JPG or WebP. Max 2MB each.</p>
          </div>

          {/* Avatar grid */}
          {avatars.length === 0 ? (
            <p className="text-sm text-admin-text-muted text-center py-8">No avatars uploaded yet</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {avatars.map((avatar) => (
                <div key={avatar.path} className="relative group">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-admin-border bg-admin-bg-muted">
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(avatar)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-admin-error text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
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
