import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Label } from '@/admin/ui/label';
import { Loader2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandingAsset {
  name: string;
  path: string;
  label: string;
  description: string;
  url: string | null;
}

export function BrandingConfigTab() {
  const [assets, setAssets] = useState<BrandingAsset[]>([
    { name: 'logo', path: 'branding/spork-logo.png', label: 'Logo', description: 'Main app logo', url: null },
    { name: 'login-hero', path: 'branding/login-hero.jpeg', label: 'Login Hero', description: 'Login page hero image', url: null },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const updatedAssets = await Promise.all(
        assets.map(async (asset) => {
          const { data } = supabase.storage.from('app-media').getPublicUrl(asset.path);
          // Check if file exists
          const response = await fetch(data.publicUrl, { method: 'HEAD' }).catch(() => null);
          return {
            ...asset,
            url: response?.ok ? data.publicUrl : null,
          };
        })
      );
      setAssets(updatedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (assetName: string, file: File) => {
    const asset = assets.find((a) => a.name === assetName);
    if (!asset) return;

    setUploadingAsset(assetName);
    try {
      // Delete existing file
      await supabase.storage.from('app-media').remove([asset.path]);

      // Upload new file
      const ext = file.name.split('.').pop();
      const newPath = `branding/${assetName}.${ext}`;
      
      const { error } = await supabase.storage.from('app-media').upload(newPath, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from('app-media').getPublicUrl(newPath);
      
      setAssets((prev) =>
        prev.map((a) => (a.name === assetName ? { ...a, path: newPath, url: data.publicUrl } : a))
      );
      toast.success(`${asset.label} uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload: ' + error.message);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleDelete = async (assetName: string) => {
    const asset = assets.find((a) => a.name === assetName);
    if (!asset) return;

    try {
      await supabase.storage.from('app-media').remove([asset.path]);
      setAssets((prev) => prev.map((a) => (a.name === assetName ? { ...a, url: null } : a)));
      toast.success(`${asset.label} removed`);
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
            <ImageIcon className="h-5 w-5" />
            Branding Assets
          </CardTitle>
          <CardDescription>Manage your app's logo and branding images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {assets.map((asset) => (
            <div key={asset.name} className="flex items-start gap-4 p-4 border border-admin-border rounded-lg">
              {/* Preview */}
              <div className="h-24 w-24 rounded-lg border border-admin-border bg-admin-bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {asset.url ? (
                  <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-admin-text-muted" />
                )}
              </div>

              {/* Info and actions */}
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-base">{asset.label}</Label>
                  <p className="text-sm text-admin-text-muted">{asset.description}</p>
                  {asset.url && (
                    <p className="text-xs text-admin-text-muted mt-1 truncate">{asset.path}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id={`upload-${asset.name}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(asset.name, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`upload-${asset.name}`)?.click()}
                    disabled={uploadingAsset === asset.name}
                  >
                    {uploadingAsset === asset.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        {asset.url ? 'Replace' : 'Upload'}
                      </>
                    )}
                  </Button>
                  {asset.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(asset.name)}
                      className="text-admin-error hover:text-admin-error"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
