import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  content: string;
  chunks: any;
  metadata: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface QueryResult {
  answer: string;
  sources: {
    id: string;
    title: string;
    fileName: string;
  }[];
}

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'success' | 'failed';
export type ProgressCallback = (fileName: string, status: UploadStatus, error?: string) => void;

export const useKnowledgeBase = (workspaceId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    if (user && workspaceId) {
      fetchDocuments();
    }
  }, [user, workspaceId]);

  const fetchDocuments = async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'get_knowledge_base', workspace_id: workspaceId },
      });

      if (error) throw error;
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File, title?: string) => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    try {
      const fileName = `${workspaceId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error: createError } = await supabase.functions.invoke('file-operations', {
        body: {
          action: 'create_knowledge_doc',
          workspace_id: workspaceId,
          title: title || file.name,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
        },
      });

      if (createError) throw createError;
      const doc = data.data;

      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: doc.id,
          storagePath: fileName,
        },
      });

      if (processError) throw processError;

      toast({
        title: 'Success',
        description: 'Document uploaded and processed successfully',
      });

      await fetchDocuments();
      return doc;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocuments = async (files: File[], onProgress?: ProgressCallback) => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    let successCount = 0;
    let failedFiles: string[] = [];

    try {
      for (const file of files) {
        try {
          onProgress?.(file.name, 'uploading');
          
          const fileName = `${workspaceId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('knowledge-base')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Storage error for:', file.name, uploadError);
            onProgress?.(file.name, 'failed', `Storage upload failed: ${uploadError.message}`);
            failedFiles.push(file.name);
            continue;
          }

          onProgress?.(file.name, 'processing');

          const { data, error: createError } = await supabase.functions.invoke('file-operations', {
            body: {
              action: 'create_knowledge_doc',
              workspace_id: workspaceId,
              title: file.name,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: fileName,
            },
          });

          if (createError) {
            console.error('Database error for:', file.name, createError);
            onProgress?.(file.name, 'failed', `Database error: ${createError.message}`);
            failedFiles.push(file.name);
            continue;
          }

          await supabase.functions.invoke('process-document', {
            body: {
              documentId: data.data.id,
              storagePath: fileName,
            },
          });

          onProgress?.(file.name, 'success');
          successCount++;
        } catch (fileError: any) {
          console.error('Error processing file:', file.name, fileError);
          onProgress?.(file.name, 'failed', fileError.message || 'Unknown error');
          failedFiles.push(file.name);
        }
      }

      if (!onProgress) {
        if (successCount > 0 && failedFiles.length === 0) {
          toast({
            title: 'Success',
            description: `${successCount} document(s) uploaded successfully`,
          });
        } else if (successCount > 0 && failedFiles.length > 0) {
          toast({
            title: 'Partial Success',
            description: `${successCount} uploaded, ${failedFiles.length} failed: ${failedFiles.join(', ')}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Upload Failed',
            description: `Failed to upload: ${failedFiles.join(', ')}`,
            variant: 'destructive',
          });
        }
      }

      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      if (!onProgress) {
        toast({
          title: 'Error',
          description: 'Failed to upload documents',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentId: string, storagePath: string) => {
    if (!user) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase.functions.invoke('file-operations', {
        body: { action: 'delete_knowledge_doc', document_id: documentId },
      });

      if (deleteError) throw deleteError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const queryKnowledgeBase = async (
    question: string,
    selectedDocumentIds?: string[]
  ): Promise<QueryResult | null> => {
    if (!user || !workspaceId) return null;

    setIsQuerying(true);
    try {
      const { data, error } = await supabase.functions.invoke('query-knowledge-base', {
        body: {
          question,
          userId: user.id,
          workspaceId: workspaceId,
          documentIds: selectedDocumentIds,
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error querying knowledge base:', error);
      toast({
        title: 'Error',
        description: 'Failed to query knowledge base',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsQuerying(false);
    }
  };

  return {
    documents,
    isLoading,
    isQuerying,
    uploadDocument,
    uploadDocuments,
    deleteDocument,
    queryKnowledgeBase,
    fetchDocuments,
  };
};
