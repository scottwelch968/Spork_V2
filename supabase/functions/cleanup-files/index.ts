import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('cleanup-files');
  logger.start();
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results = {
      userFilesBucket: { deleted: 0, errors: [] as string[] },
      knowledgeBaseBucket: { deleted: 0, errors: [] as string[] },
    };

    // Clean user-files bucket
    logger.info('Cleaning user-files bucket');
    const { data: userFiles, error: listUserFilesError } = await supabase.storage
      .from('user-files')
      .list('', { limit: 1000 });

    if (listUserFilesError) {
      logger.warn('Error listing user-files', { error: listUserFilesError.message });
      results.userFilesBucket.errors.push(listUserFilesError.message);
    } else if (userFiles && userFiles.length > 0) {
      const filePaths = userFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove(filePaths);
      
      if (deleteError) {
        logger.warn('Error deleting user-files', { error: deleteError.message });
        results.userFilesBucket.errors.push(deleteError.message);
      } else {
        results.userFilesBucket.deleted = filePaths.length;
        logger.info('Deleted files from user-files bucket', { count: filePaths.length });
      }
    }

    // Clean knowledge-base bucket
    logger.info('Cleaning knowledge-base bucket');
    const { data: kbFiles, error: listKbError } = await supabase.storage
      .from('knowledge-base')
      .list('', { limit: 1000 });

    if (listKbError) {
      logger.warn('Error listing knowledge-base', { error: listKbError.message });
      results.knowledgeBaseBucket.errors.push(listKbError.message);
    } else if (kbFiles && kbFiles.length > 0) {
      const filePaths = kbFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage
        .from('knowledge-base')
        .remove(filePaths);
      
      if (deleteError) {
        logger.warn('Error deleting knowledge-base files', { error: deleteError.message });
        results.knowledgeBaseBucket.errors.push(deleteError.message);
      } else {
        results.knowledgeBaseBucket.deleted = filePaths.length;
        logger.info('Deleted files from knowledge-base bucket', { count: filePaths.length });
      }
    }

    logger.complete(Date.now() - startTime, results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
