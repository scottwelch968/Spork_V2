import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Loader2, Clock, CheckCircle2, XCircle, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'success' | 'failed';

export interface FileProgress {
  name: string;
  size: number;
  status: UploadStatus;
  error?: string;
}

export type ProgressCallback = (fileName: string, status: UploadStatus, error?: string) => void;

interface KnowledgeBaseUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], onProgress?: ProgressCallback) => Promise<void>;
}

export function KnowledgeBaseUploadDialog({
  open,
  onOpenChange,
  onUpload,
}: KnowledgeBaseUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'select' | 'uploading' | 'complete'>('select');
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const isUploadingRef = useRef(false);

  const acceptedTypes = ['.pdf', '.docx', '.doc', '.txt'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => 
      acceptedTypes.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => 
      acceptedTypes.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProgressUpdate: ProgressCallback = (fileName, status, error) => {
    setFileProgress(prev => 
      prev.map(fp => 
        fp.name === fileName 
          ? { ...fp, status, error } 
          : fp
      )
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    console.log('[Upload] Starting upload, setting phase to uploading');
    
    // Prevent closing during upload
    isUploadingRef.current = true;
    
    // Initialize progress tracking
    const initialProgress: FileProgress[] = selectedFiles.map(f => ({
      name: f.name,
      size: f.size,
      status: 'pending' as UploadStatus,
    }));
    setFileProgress(initialProgress);
    setUploadPhase('uploading');
    
    console.log('[Upload] Phase set to uploading, fileProgress initialized:', initialProgress);
    
    try {
      await onUpload(selectedFiles, handleProgressUpdate);
      console.log('[Upload] Upload complete');
    } catch (err) {
      console.error('[Upload] Upload error:', err);
    } finally {
      isUploadingRef.current = false;
    }
    
    console.log('[Upload] Setting phase to complete');
    setUploadPhase('complete');
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('[Dialog] handleOpenChange called:', newOpen, 'isUploading:', isUploadingRef.current);
    
    // Prevent closing during upload
    if (isUploadingRef.current && !newOpen) {
      console.log('[Dialog] Blocking close during upload');
      return;
    }
    
    if (!newOpen) {
      // Reset state when closing
      console.log('[Dialog] Resetting state on close');
      setSelectedFiles([]);
      setFileProgress([]);
      setUploadPhase('select');
    }
    onOpenChange(newOpen);
  };

  const handleClose = () => {
    if (isUploadingRef.current) return;
    handleOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <Cog className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: UploadStatus) => {
    switch (status) {
      case 'pending': return 'Waiting...';
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'success': return 'Complete';
      case 'failed': return 'Failed';
    }
  };

  const completedCount = fileProgress.filter(f => f.status === 'success' || f.status === 'failed').length;
  const successCount = fileProgress.filter(f => f.status === 'success').length;
  const failedCount = fileProgress.filter(f => f.status === 'failed').length;
  const progressPercent = fileProgress.length > 0 ? (completedCount / fileProgress.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {uploadPhase === 'select' && 'Upload Documents'}
            {uploadPhase === 'uploading' && 'Upload Progress'}
            {uploadPhase === 'complete' && 'Upload Complete'}
          </DialogTitle>
        </DialogHeader>

        {/* SELECT PHASE - File selection */}
        {uploadPhase === 'select' && (
          <>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: PDF, DOCX, TXT
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="kb-file-input"
              />
              <Button variant="outline" asChild>
                <label htmlFor="kb-file-input" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* UPLOADING PHASE - Progress view */}
        {uploadPhase === 'uploading' && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading {completedCount} of {fileProgress.length} files...</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fileProgress.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      file.status === 'success' && "bg-green-500/10",
                      file.status === 'failed' && "bg-destructive/10",
                      (file.status === 'pending' || file.status === 'uploading' || file.status === 'processing') && "bg-secondary/50"
                    )}
                  >
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs",
                        file.status === 'failed' ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {file.error || getStatusLabel(file.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Please wait...
              </Button>
            </DialogFooter>
          </>
        )}

        {/* COMPLETE PHASE - Summary view */}
        {uploadPhase === 'complete' && (
          <>
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4 text-sm">
                {successCount > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{successCount} file{successCount !== 1 ? 's' : ''} uploaded successfully</span>
                  </div>
                )}
                {failedCount > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span>{failedCount} file{failedCount !== 1 ? 's' : ''} failed</span>
                  </div>
                )}
              </div>

              {/* File list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fileProgress.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      file.status === 'success' && "bg-green-500/10",
                      file.status === 'failed' && "bg-destructive/10"
                    )}
                  >
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      {file.error && (
                        <span className="text-xs text-destructive">{file.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
