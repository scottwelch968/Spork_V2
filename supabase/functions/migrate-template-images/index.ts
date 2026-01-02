import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('migrate-template-images');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sourceFolder, targetFolder } = await req.json();
    
    if (!sourceFolder || !targetFolder) {
      logger.warn('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'sourceFolder and targetFolder are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Starting migration', { sourceFolder, targetFolder });

    // List all files in source folder
    const { data: files, error: listError } = await supabase.storage
      .from('app-media')
      .list(sourceFolder);

    if (listError) {
      logger.error('Error listing files', { error: listError.message });
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!files || files.length === 0) {
      logger.info('No files found in source folder');
      return new Response(
        JSON.stringify({ message: 'No files found in source folder', migrated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Found files to migrate', { count: files.length });

    const results = {
      migrated: 0,
      failed: 0,
      errors: [] as string[],
      files: [] as string[]
    };

    for (const file of files) {
      // Skip folders
      if (!file.name || file.id === null) continue;

      const sourcePath = `${sourceFolder}/${file.name}`;
      const targetPath = `${targetFolder}/${file.name}`;

      logger.debug('Copying file', { from: sourcePath, to: targetPath });

      // Download file from source
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('app-media')
        .download(sourcePath);

      if (downloadError) {
        logger.warn('Download failed', { file: file.name, error: downloadError.message });
        results.failed++;
        results.errors.push(`Download failed for ${file.name}: ${downloadError.message}`);
        continue;
      }

      // Upload to target location
      const { error: uploadError } = await supabase.storage
        .from('app-media')
        .upload(targetPath, fileData, {
          contentType: file.metadata?.mimetype || 'image/png',
          upsert: true
        });

      if (uploadError) {
        logger.warn('Upload failed', { file: file.name, error: uploadError.message });
        results.failed++;
        results.errors.push(`Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }

      results.migrated++;
      results.files.push(file.name);
      logger.debug('Successfully migrated', { file: file.name });
    }

    logger.complete(Date.now() - startTime, { 
      migrated: results.migrated, 
      failed: results.failed 
    });

    return new Response(
      JSON.stringify({
        message: `Migration complete`,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
