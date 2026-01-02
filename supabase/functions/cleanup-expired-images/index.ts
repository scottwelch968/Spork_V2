import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('cleanup-expired-images');
  logger.start();
  const startTime = Date.now();
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // 72 hours cutoff
    const EXPIRY_HOURS = 72;
    const cutoffTime = Date.now() - (EXPIRY_HOURS * 60 * 60 * 1000);
    const cutoffDate = new Date(cutoffTime);
    logger.info('Starting cleanup with cutoff date', { cutoffDate: cutoffDate.toISOString() });

    const expiredFiles: string[] = [];
    const expiredUrls: string[] = [];

    // Paginate through root folders to handle large datasets
    const PAGE_SIZE = 100;
    let offset = 0;
    let hasMoreFolders = true;

    while (hasMoreFolders) {
      const { data: rootFolderPage, error: pageError } = await supabase.storage
        .from('user-files')
        .list('', { limit: PAGE_SIZE, offset });

      if (pageError) {
        logger.warn('Error listing root folders', { error: pageError.message });
        throw pageError;
      }

      if (!rootFolderPage || rootFolderPage.length === 0) {
        hasMoreFolders = false;
        continue;
      }

      // Iterate through user folders to find temp-ai-images
      for (const folder of rootFolderPage) {
        if (folder.id === null) continue; // Skip if it's a file at root level

        const tempPath = `${folder.name}/temp-ai-images`;
        
        // Paginate through temp files as well
        let tempOffset = 0;
        let hasMoreTempFiles = true;
        
        while (hasMoreTempFiles) {
          const { data: tempFiles, error: tempError } = await supabase.storage
            .from('user-files')
            .list(tempPath, { limit: PAGE_SIZE, offset: tempOffset });

          if (tempError || !tempFiles || tempFiles.length === 0) {
            hasMoreTempFiles = false;
            continue;
          }

          for (const file of tempFiles) {
            if (!file.name || file.id === null) continue;

            // Extract timestamp from filename: ai-image-{timestamp}.{ext}
            // Also handle format: {timestamp}-{uuid}.{ext}
            const timestampMatch = file.name.match(/ai-image-(\d+)\.|^(\d+)-/);
            let fileTimestamp: number | null = null;

            if (timestampMatch) {
              fileTimestamp = parseInt(timestampMatch[1] || timestampMatch[2], 10);
            } else if (file.created_at) {
              // Fallback to file creation date if available
              fileTimestamp = new Date(file.created_at).getTime();
            }

            if (fileTimestamp && fileTimestamp < cutoffTime) {
              const fullPath = `${tempPath}/${file.name}`;
              expiredFiles.push(fullPath);

              // Build URL for message content matching
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-files/${fullPath}`;
              expiredUrls.push(publicUrl);

              logger.debug('Found expired file', { path: fullPath, created: new Date(fileTimestamp).toISOString() });
            }
          }

          tempOffset += PAGE_SIZE;
          if (tempFiles.length < PAGE_SIZE) hasMoreTempFiles = false;
        }
      }

      offset += PAGE_SIZE;
      if (rootFolderPage.length < PAGE_SIZE) hasMoreFolders = false;
    }

    logger.info('Found expired temp images', { count: expiredFiles.length });

    if (expiredFiles.length === 0) {
      const duration = Date.now() - startTime;
      
      // Log successful run with no files found
      await logJobResult(supabase, {
        job_name: 'cleanup-expired-images',
        success: true,
        deleted_count: 0,
        updated_messages: 0,
        details: {
          cutoff_date: cutoffDate.toISOString(),
          expired_files_found: 0
        },
        duration_ms: duration
      });

      logger.complete(duration, { deletedCount: 0, updatedMessages: 0 });

      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired images found",
          deletedCount: 0,
          updatedMessages: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete expired files from storage in batches
    const BATCH_SIZE = 100;
    let totalDeleted = 0;

    for (let i = 0; i < expiredFiles.length; i += BATCH_SIZE) {
      const batch = expiredFiles.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove(batch);

      if (deleteError) {
        logger.warn('Error deleting batch', { batchNumber: Math.floor(i / BATCH_SIZE) + 1, error: deleteError.message });
      } else {
        totalDeleted += batch.length;
        logger.debug('Deleted batch', { batchNumber: Math.floor(i / BATCH_SIZE) + 1, count: batch.length });
      }
    }

    // Update messages that reference deleted images - PRESERVE PROMPT for regeneration
    let updatedMessages = 0;

    for (const url of expiredUrls) {
      // Update personal chat messages table - preserve prompt after marker
      const { data: messages, error: msgFetchError } = await supabase
        .from('messages')
        .select('id, content')
        .like('content', `%${url}%`);

      if (!msgFetchError && messages) {
        const typedMessages = messages as unknown as { id: string; content: string }[];
        for (const msg of typedMessages) {
          // Extract prompt from content (format: [IMAGE:url]\nprompt or just prompt)
          let prompt = msg.content;
          if (prompt.includes('\n')) {
            prompt = prompt.split('\n').slice(1).join('\n').trim();
          } else if (prompt.startsWith('[IMAGE:')) {
            prompt = '';
          }
          
          // Preserve prompt after expired marker for regeneration
          const newContent = prompt ? `[IMAGE:EXPIRED]\n${prompt}` : '[IMAGE:EXPIRED]';
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({ content: newContent })
            .eq('id', msg.id);
          
          if (!updateError) updatedMessages++;
        }
      }

      // Update workspace chat messages table - preserve prompt
      const { data: spaceMessages, error: spaceMsgFetchError } = await supabase
        .from('space_chat_messages')
        .select('id, content')
        .like('content', `%${url}%`);

      if (!spaceMsgFetchError && spaceMessages) {
        const typedSpaceMessages = spaceMessages as unknown as { id: string; content: string }[];
        for (const msg of typedSpaceMessages) {
          let prompt = msg.content;
          if (prompt.includes('\n')) {
            prompt = prompt.split('\n').slice(1).join('\n').trim();
          } else if (prompt.startsWith('[IMAGE:')) {
            prompt = '';
          }
          
          const newContent = prompt ? `[IMAGE:EXPIRED]\n${prompt}` : '[IMAGE:EXPIRED]';
          
          const { error: updateError } = await supabase
            .from('space_chat_messages')
            .update({ content: newContent })
            .eq('id', msg.id);
          
          if (!updateError) updatedMessages++;
        }
      }
    }

    logger.info('Updated message records', { count: updatedMessages });

    const duration = Date.now() - startTime;

    // Log successful run
    await logJobResult(supabase, {
      job_name: 'cleanup-expired-images',
      success: true,
      deleted_count: totalDeleted,
      updated_messages: updatedMessages,
      details: {
        cutoff_date: cutoffDate.toISOString(),
        expired_files_found: expiredFiles.length
      },
      duration_ms: duration
    });

    logger.complete(duration, { deletedCount: totalDeleted, updatedMessages });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed successfully`,
        deletedCount: totalDeleted,
        updatedMessages: updatedMessages,
        cutoffDate: cutoffDate.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const duration = Date.now() - startTime;

    // Log failed run
    if (supabase) {
      await logJobResult(supabase, {
        job_name: 'cleanup-expired-images',
        success: false,
        error_message: errorMessage,
        duration_ms: duration
      });
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
