import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FolderOpen, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FolderStats {
  name: string;
  bucket: string;
  path: string;
  fileCount: number;
  description: string;
}

export function StorageOverviewTab() {
  const [folders, setFolders] = useState<FolderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState<string | null>(null);

  const bucketFolders = [
    { bucket: 'app-media', path: 'branding', name: 'Branding', description: 'Logo and login images' },
    { bucket: 'app-media', path: 'templates/avatars', name: 'Avatars', description: 'Persona avatar library' },
    { bucket: 'app-media', path: 'generated', name: 'Generated (Deprecated)', description: 'Old AI-generated images - can be cleaned up' },
    { bucket: 'template-images', path: 'spaces', name: 'Space Templates', description: 'Images for space template cards' },
    { bucket: 'template-images', path: 'personas', name: 'Persona Templates', description: 'Images for persona template cards' },
    { bucket: 'template-images', path: 'prompts', name: 'Prompt Templates', description: 'Images for prompt template cards' },
    { bucket: 'appstore-images', path: 'tools', name: 'App Store Tools', description: 'Tool thumbnail images' },
    { bucket: 'appstore-images', path: 'screenshots', name: 'Tool Screenshots', description: 'Tool detail screenshots' },
  ];

  useEffect(() => {
    loadFolderStats();
  }, []);

  const loadFolderStats = async () => {
    setIsLoading(true);
    try {
      const stats = await Promise.all(
        bucketFolders.map(async (folder) => {
          try {
            const { data, error } = await supabase.storage.from(folder.bucket).list(folder.path, {
              limit: 1000,
            });
            
            if (error) {
              // Folder might not exist yet
              return { ...folder, fileCount: 0 };
            }

            const fileCount = (data || []).filter((item) => !item.id?.includes('.')).length === 0
              ? (data || []).length
              : (data || []).filter((item) => item.id?.includes('.')).length;

            return { ...folder, fileCount };
          } catch {
            return { ...folder, fileCount: 0 };
          }
        })
      );
      setFolders(stats);
    } catch (error) {
      console.error('Error loading folder stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async (folder: FolderStats) => {
    setIsCleaningUp(folder.path);
    try {
      const { data, error } = await supabase.storage.from(folder.bucket).list(folder.path, {
        limit: 1000,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const filePaths = data.map((file) => `${folder.path}/${file.name}`);
        const { error: deleteError } = await supabase.storage.from(folder.bucket).remove(filePaths);
        if (deleteError) throw deleteError;
      }

      toast.success(`Cleaned up ${data?.length || 0} files from ${folder.name}`);
      loadFolderStats();
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup: ' + error.message);
    } finally {
      setIsCleaningUp(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalFiles = folders.reduce((sum, f) => sum + f.fileCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>
            Total files across all buckets: {totalFiles}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Folder cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {folders.map((folder) => (
          <Card key={`${folder.bucket}-${folder.path}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                {folder.name}
                {folder.path === 'generated' && folder.fileCount > 0 && (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {folder.bucket}/{folder.path}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{folder.fileCount}</p>
                  <p className="text-sm text-muted-foreground">{folder.description}</p>
                </div>
                {folder.path === 'generated' && folder.fileCount > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clean Up
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clean up deprecated files?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete all {folder.fileCount} files in the deprecated "generated" folder.
                          AI-generated images are now stored in user-files bucket. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCleanup(folder)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCleaningUp === folder.path ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Delete All'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
