import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const logger = createLogger('save-image-to-media');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { imageUrl, userId, workspaceId, prompt, model, messageId, messageTable } = await req.json();

    if (!imageUrl || !userId) {
      logger.warn('Missing required fields');
      return new Response(
        JSON.stringify({ error: "imageUrl and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Validate messageTable to prevent SQL injection
    const VALID_MESSAGE_TABLES = ['messages', 'space_chat_messages'];
    if (messageTable && !VALID_MESSAGE_TABLES.includes(messageTable)) {
      logger.error('Invalid messageTable provided', { messageTable });
      return new Response(
        JSON.stringify({ error: "Invalid message table specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logger.info('Processing image save', { 
      userId, 
      workspaceId: workspaceId || 'personal',
      urlPreview: imageUrl.substring(0, 50) 
    });

    // Extract storage path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/user-files/{path}
    const urlParts = imageUrl.split('/user-files/');
    if (urlParts.length < 2) {
      logger.error('Invalid image URL format');
      return new Response(
        JSON.stringify({ error: "Invalid image URL format - not from user-files bucket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tempStoragePath = urlParts[1];
    logger.debug('Temp storage path', { path: tempStoragePath });

    // Verify the file is in temp-ai-images folder
    if (!tempStoragePath.includes('/temp-ai-images/')) {
      // File is already in permanent storage, just create DB record
      logger.info('File already in permanent storage, creating DB record only');
    }

    // Generate permanent path by replacing temp-ai-images with images
    const permanentPath = tempStoragePath.replace('/temp-ai-images/', '/images/');
    logger.debug('Permanent path', { path: permanentPath });

    // Check if we need to move the file
    if (tempStoragePath !== permanentPath) {
      // Copy file to permanent location
      const { error: copyError } = await supabase.storage
        .from('user-files')
        .copy(tempStoragePath, permanentPath);

      if (copyError) {
        logger.error('Failed to copy file', { error: copyError.message });
        return new Response(
          JSON.stringify({ error: `Failed to copy file: ${copyError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete temp file immediately after successful copy
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove([tempStoragePath]);

      if (deleteError) {
        logger.warn('Failed to delete temp file', { error: deleteError.message });
        // Continue anyway - file was saved successfully
      } else {
        logger.debug('Temp file deleted successfully');
      }
    }

    // Get public URL for permanent location
    const { data: urlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(permanentPath);

    const permanentUrl = urlData.publicUrl;
    logger.debug('Permanent URL generated', { url: permanentUrl.substring(0, 50) });

    // Extract file info
    const fileName = permanentPath.split('/').pop() || `ai-image-${Date.now()}.png`;
    const fileExtension = fileName.split('.').pop() || 'png';

    // Get file metadata from storage to get size
    const { data: fileList } = await supabase.storage
      .from('user-files')
      .list(permanentPath.substring(0, permanentPath.lastIndexOf('/')), {
        search: fileName
      });

    const fileSize = fileList?.[0]?.metadata?.size || 0;

    // Context-aware file saving
    const isWorkspaceFile = !!workspaceId;
    let folderId: string | null = null;
    let savedRecord: any = null;

    if (isWorkspaceFile) {
      // Get or create workspace images folder
      let { data: workspaceFolder } = await supabase
        .from('file_folders')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('folder_type', 'workspace_images')
        .maybeSingle();

      if (!workspaceFolder) {
        const { data: newFolder } = await supabase
          .from('file_folders')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            name: 'Ai Images',
            folder_type: 'workspace_images',
            owner_type: 'workspace',
            is_system_folder: true
          })
          .select('id')
          .single();
        workspaceFolder = newFolder;
      }
      folderId = workspaceFolder?.id || null;

      // Save to workspace_files table
      const { data: record, error: saveError } = await supabase
        .from('workspace_files')
        .insert({
          workspace_id: workspaceId,
          uploaded_by: userId,
          folder_id: folderId,
          file_name: fileName,
          file_type: `image/${fileExtension}`,
          file_size: fileSize,
          storage_path: permanentPath,
          metadata: {
            prompt: prompt?.substring(0, 500),
            model: model,
            generated: true,
            saved_from_chat: true
          }
        })
        .select('id')
        .single();

      if (saveError) {
        logger.error('Error saving to workspace_files', { error: saveError.message });
        return new Response(
          JSON.stringify({ error: `Failed to create file record: ${saveError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      savedRecord = record;
      logger.info('Image saved to workspace_files', { fileId: record?.id });
    } else {
      // Get or create user's "Ai Images" folder
      let { data: imagesFolder } = await supabase
        .from('file_folders')
        .select('id')
        .eq('user_id', userId)
        .eq('folder_type', 'my_images')
        .is('workspace_id', null)
        .maybeSingle();

      if (!imagesFolder) {
        const { data: newFolder } = await supabase
          .from('file_folders')
          .insert({
            user_id: userId,
            name: 'Ai Images',
            folder_type: 'my_images',
            owner_type: 'user',
            is_system_folder: true
          })
          .select('id')
          .single();
        imagesFolder = newFolder;
      }
      folderId = imagesFolder?.id || null;

      // Save to user_files table
      const { data: record, error: saveError } = await supabase
        .from('user_files')
        .insert({
          user_id: userId,
          folder_id: folderId,
          file_name: fileName,
          original_name: fileName,
          file_type: `image/${fileExtension}`,
          file_size: fileSize,
          storage_path: permanentPath,
          owner_type: 'user',
          metadata: {
            prompt: prompt?.substring(0, 500),
            model: model,
            generated: true,
            saved_from_chat: true
          }
        })
        .select('id')
        .single();

      if (saveError) {
        logger.error('Error saving to user_files', { error: saveError.message });
        return new Response(
          JSON.stringify({ error: `Failed to create file record: ${saveError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      savedRecord = record;
      logger.info('Image saved to user_files', { fileId: record?.id });
    }

    // Update the chat message to use permanent URL if messageId provided
    if (messageId && messageTable) {
      const { error: updateError } = await supabase
        .from(messageTable)
        .update({ content: `[IMAGE:${permanentUrl}]\n${prompt || ''}` })
        .eq('id', messageId);

      if (updateError) {
        logger.warn('Failed to update message with permanent URL', { error: updateError.message });
      } else {
        logger.debug('Message updated with permanent URL');
      }
    }

    logger.complete(Date.now() - startTime, { fileId: savedRecord?.id });

    return new Response(
      JSON.stringify({
        success: true,
        savedUrl: permanentUrl,
        fileId: savedRecord?.id,
        folderId: folderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
