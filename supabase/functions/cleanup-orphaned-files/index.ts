import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileRecord {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string;
  user_id?: string;
  uploaded_by?: string;
  workspace_id?: string;
  table: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('cleanup-orphaned-files');
  logger.start();
  const startTime = Date.now();
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action = 'detect', userId } = await req.json().catch(() => ({}));

    logger.info('Starting orphaned files check', { action, userId: userId || 'all' });

    // Build queries for both tables
    let userFilesQuery = supabase.from('user_files').select('*');
    let workspaceFilesQuery = supabase.from('workspace_files').select('*');

    if (userId) {
      userFilesQuery = userFilesQuery.eq('user_id', userId);
      workspaceFilesQuery = workspaceFilesQuery.eq('uploaded_by', userId);
    }

    const [{ data: userFiles, error: userError }, { data: workspaceFiles, error: wsError }] = await Promise.all([
      userFilesQuery,
      workspaceFilesQuery
    ]);

    if (userError) {
      logger.warn('Error fetching user_files', { error: userError.message });
    }
    if (wsError) {
      logger.warn('Error fetching workspace_files', { error: wsError.message });
    }

    const typedUserFiles = (userFiles as unknown as FileRecord[]) || [];
    const typedWorkspaceFiles = (workspaceFiles as unknown as FileRecord[]) || [];

    const allFiles: FileRecord[] = [
      ...typedUserFiles.map(f => ({ ...f, table: 'user_files' })),
      ...typedWorkspaceFiles.map(f => ({ ...f, table: 'workspace_files' }))
    ];

    logger.info('Found file records to check', { count: allFiles.length });

    const orphanedRecords: FileRecord[] = [];

    // OPTIMIZATION: Batch storage checks by folder to reduce N+1 queries
    // Group files by their folder path
    const filesByFolder = new Map<string, FileRecord[]>();
    for (const file of allFiles) {
      const pathParts = file.storage_path.split('/');
      pathParts.pop(); // Remove filename
      const folderPath = pathParts.join('/');
      
      if (!filesByFolder.has(folderPath)) {
        filesByFolder.set(folderPath, []);
      }
      filesByFolder.get(folderPath)!.push(file);
    }

    logger.info('Grouped into folders for batch checking', { folderCount: filesByFolder.size });

    // Check files folder-by-folder with pagination for large folders
    const BATCH_SIZE = 1000;
    
    for (const [folderPath, filesInFolder] of filesByFolder) {
      try {
        // Paginate through all files in this folder
        let allStorageFiles: { name: string }[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const { data: storageFiles, error: listError } = await supabase.storage
            .from('user-files')
            .list(folderPath, { limit: BATCH_SIZE, offset });

          if (listError) {
            logger.warn('Failed to list folder', { folderPath, error: listError.message });
            // Mark all files in this folder as potentially orphaned
            for (const file of filesInFolder) {
              orphanedRecords.push({
                id: file.id,
                table: file.table,
                original_name: file.original_name,
                storage_path: file.storage_path,
                created_at: file.created_at,
                user_id: file.user_id || file.uploaded_by,
                workspace_id: file.workspace_id
              });
            }
            hasMore = false;
            continue;
          }

          allStorageFiles = allStorageFiles.concat(storageFiles || []);
          hasMore = (storageFiles?.length || 0) === BATCH_SIZE;
          offset += BATCH_SIZE;
          
          if (hasMore) {
            logger.debug('Fetching more files from folder', { folderPath, offset });
          }
        }

        // Build a Set of existing file names for O(1) lookup
        const existingFileNames = new Set(allStorageFiles.map(f => f.name));

        // Check each DB record against the storage list
        for (const file of filesInFolder) {
          const fileName = file.storage_path.split('/').pop();
          
          if (!existingFileNames.has(fileName || '')) {
            logger.debug('Orphan found', { name: file.original_name, path: file.storage_path });
            orphanedRecords.push({
              id: file.id,
              table: file.table,
              original_name: file.original_name,
              storage_path: file.storage_path,
              created_at: file.created_at,
              user_id: file.user_id || file.uploaded_by,
              workspace_id: file.workspace_id
            });
          }
        }
      } catch (err) {
        logger.warn('Error checking folder', { folderPath, error: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info('Found orphaned records', { count: orphanedRecords.length });

    let deletedCount = 0;

    // Clean orphaned records if action is 'clean'
    if (action === 'clean' && orphanedRecords.length > 0) {
      for (const record of orphanedRecords) {
        const { error: deleteError } = await supabase
          .from(record.table)
          .delete()
          .eq('id', record.id);

        if (deleteError) {
          logger.warn('Error deleting orphan', { id: record.id, error: deleteError.message });
        } else {
          deletedCount++;
          logger.debug('Deleted orphan', { name: record.original_name });
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log job results
    await logJobResult(supabase, {
      job_name: 'cleanup-orphaned-files',
      success: true,
      total_records_checked: allFiles.length,
      orphan_count: orphanedRecords.length,
      deleted_count: deletedCount,
      details: {
        action: action,
        user_id: userId || null,
        folders_checked: filesByFolder.size
      },
      duration_ms: duration
    });

    logger.complete(duration, { orphanedCount: orphanedRecords.length, deletedCount });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        totalRecordsChecked: allFiles.length,
        orphanedRecords: action === 'detect' ? orphanedRecords : [],
        orphanedCount: orphanedRecords.length,
        deletedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    // Log failed run
    if (supabase) {
      await logJobResult(supabase, {
        job_name: 'cleanup-orphaned-files',
        success: false,
        error_message: errorMessage,
        duration_ms: duration
      });
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to log job results without failing the main operation
async function logJobResult(supabase: ReturnType<typeof createClient>, result: Record<string, unknown>) {
  try {
    // Cast to any to avoid type issues with dynamically created table
    await (supabase.from('cleanup_job_results') as any).insert(result);
  } catch (e) {
    // Use basic console here since this is a helper that shouldn't affect main flow
    console.error('Failed to log job result:', e);
  }
}
