import { useState } from 'react';
import { useKnowledgeBase, ProgressCallback } from '@/hooks/useKnowledgeBase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Trash2, FileText, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { KnowledgeBaseUploadDialog } from './KnowledgeBaseUploadDialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SpaceKnowledgeBaseTabProps {
  spaceId: string;
}

type FilterType = 'all' | 'pdf' | 'docx' | 'txt' | 'other';

export function SpaceKnowledgeBaseTab({ spaceId }: SpaceKnowledgeBaseTabProps) {
  const {
    documents,
    isLoading,
    uploadDocuments,
    deleteDocument,
  } = useKnowledgeBase(spaceId);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string; fileName: string } | null>(null);

  const handleUpload = async (files: File[], onProgress?: ProgressCallback) => {
    await uploadDocuments(files, onProgress);
  };

  const handleDeleteClick = (docId: string, storagePath: string, fileName: string) => {
    setDeleteTarget({ id: docId, storagePath, fileName });
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteDocument(deleteTarget.id, deleteTarget.storagePath);
      setDeleteTarget(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('docx')) return 'DOCX';
    if (fileType.includes('text') || fileType.includes('txt')) return 'TXT';
    return 'Other';
  };

  const getFileTypeFilter = (fileType: string): FilterType => {
    const label = getFileTypeLabel(fileType).toLowerCase();
    if (label === 'pdf') return 'pdf';
    if (label === 'docx') return 'docx';
    if (label === 'txt') return 'txt';
    return 'other';
  };

  const filteredDocuments = documents.filter(doc => {
    if (activeFilter === 'all') return true;
    return getFileTypeFilter(doc.file_type) === activeFilter;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pdf', label: 'PDF' },
    { key: 'docx', label: 'DOCX' },
    { key: 'txt', label: 'TXT' },
    { key: 'other', label: 'Other' },
  ];

  if (isLoading && !showUploadDialog) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 mb-6">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold font-roboto-slab mb-2">Get started by uploading documents</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Upload documents to your knowledge base to enable AI-powered Q&A with your team. 
            Use "Ask Knowledge Base" in chat to query your documents.
          </p>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-primary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        <KnowledgeBaseUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUpload={handleUpload}
        />
      </>
    );
  }

  // Documents view
  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map(filter => (
          <Button
            key={filter.key}
            variant="outline"
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              "rounded-full",
              activeFilter === filter.key && "bg-muted"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-24">Size</TableHead>
              <TableHead className="w-32">Date Added</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-xs">{doc.title}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {doc.file_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {getFileTypeLabel(doc.file_type)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(doc.file_size)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(doc.id, doc.storage_path, doc.file_name)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <KnowledgeBaseUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUpload}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-medium text-foreground">"{deleteTarget?.fileName}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
