import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Badge } from '@/admin/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { AlertTriangle, FileIcon, FolderIcon, Loader2, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrphanedFile {
  id: string;
  table: string;
  original_name: string;
  storage_path: string;
  created_at: string;
  user_id: string;
  workspace_id?: string;
}

interface FileStats {
  totalUserFiles: number;
  totalWorkspaceFiles: number;
}

export const UserFilesTab = () => {
  const [orphanedFiles, setOrphanedFiles] = useState<OrphanedFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const [{ count: userFilesCount }, { count: workspaceFilesCount }] = await Promise.all([
        supabase.from('user_files').select('*', { count: 'exact', head: true }),
        supabase.from('workspace_files' as any).select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUserFiles: userFilesCount || 0,
        totalWorkspaceFiles: workspaceFilesCount || 0
      });
    } catch (error) {
      console.error('Error fetching file stats:', error);
      toast.error('Failed to fetch file statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleScanOrphans = async () => {
    setIsScanning(true);
    setOrphanedFiles([]);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-files', {
        body: { action: 'detect' }
      });

      if (error) throw error;

      setOrphanedFiles(data?.orphanedRecords || []);
      setHasScanned(true);

      if (data?.orphanedRecords?.length === 0) {
        toast.success('No orphaned records found');
      } else {
        toast.info(`Found ${data?.orphanedRecords?.length} orphaned records`);
      }
    } catch (error) {
      console.error('Error scanning for orphans:', error);
      toast.error('Failed to scan for orphaned files');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCleanOrphans = async () => {
    setIsCleaning(true);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-files', {
        body: { action: 'clean' }
      });

      if (error) throw error;

      toast.success(`Cleaned ${data?.deletedCount || 0} orphaned records`);
      setOrphanedFiles([]);
      await fetchStats();
    } catch (error) {
      console.error('Error cleaning orphans:', error);
      toast.error('Failed to clean orphaned files');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-roboto-slab">
            <FileIcon className="h-5 w-5" />
            File Statistics
          </CardTitle>
          <CardDescription>
            Overview of all user and workspace files in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 text-admin-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading statistics...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-admin-bg-muted/50">
                <div className="text-2xl font-bold">{stats?.totalUserFiles || 0}</div>
                <div className="text-sm text-admin-text-muted">Personal Files</div>
              </div>
              <div className="p-4 rounded-lg bg-admin-bg-muted/50">
                <div className="text-2xl font-bold">{stats?.totalWorkspaceFiles || 0}</div>
                <div className="text-sm text-admin-text-muted">Workspace Files</div>
              </div>
              <div className="p-4 rounded-lg bg-admin-bg-muted/50">
                <div className="text-2xl font-bold">
                  {(stats?.totalUserFiles || 0) + (stats?.totalWorkspaceFiles || 0)}
                </div>
                <div className="text-sm text-admin-text-muted">Total Files</div>
              </div>
              <div className="p-4 rounded-lg bg-admin-bg-muted/50">
                <div className="text-2xl font-bold">
                  {hasScanned ? orphanedFiles.length : '—'}
                </div>
                <div className="text-sm text-admin-text-muted">
                  {hasScanned ? 'Orphaned Records' : 'Not Scanned'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-roboto-slab">
            <AlertTriangle className="h-5 w-5 text-admin-warning" />
            Orphaned Record Detection
          </CardTitle>
          <CardDescription>
            Find and clean database records where the corresponding storage file no longer exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={handleScanOrphans}
              disabled={isScanning}
              variant="outline"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scan for Orphans
                </>
              )}
            </Button>

            {orphanedFiles.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleCleanOrphans}
                disabled={isCleaning}
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean {orphanedFiles.length} Orphan{orphanedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>

          {orphanedFiles.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Storage Path</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.original_name}</TableCell>
                      <TableCell>
                        <Badge variant={file.table === 'user_files' ? 'default' : 'secondary'}>
                          {file.table === 'user_files' ? 'Personal' : 'Workspace'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-admin-text-muted max-w-[300px] truncate">
                        {file.storage_path}
                      </TableCell>
                      <TableCell className="text-admin-text-muted">
                        {format(new Date(file.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {orphanedFiles.length === 0 && !isScanning && (
            <div className="text-center py-8 text-admin-text-muted">
              <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              {hasScanned ? (
                <p className="text-admin-success font-medium">All files are healthy - no orphaned records found.</p>
              ) : (
                <>
                  <p className="font-medium">No scan performed yet</p>
                  <p className="text-sm mt-1">Click "Scan for Orphans" to check for database records without corresponding storage files.</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
