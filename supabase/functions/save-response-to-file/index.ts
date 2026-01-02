import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to find unique filename for user files
async function getUniqueFileName(
  supabase: any,
  userId: string,
  folderId: string | null,
  baseName: string,
  extension: string
): Promise<string> {
  let fileName = `${baseName}.${extension}`;
  let counter = 0;
  
  while (counter < 100) {
    let query = supabase
      .from('user_files')
      .select('id')
      .eq('user_id', userId)
      .eq('file_name', fileName);
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }
    
    const { data: existingFile } = await query.maybeSingle();
    
    if (!existingFile) {
      return fileName;
    }
    
    counter++;
    fileName = `${baseName}_${counter}.${extension}`;
  }
  
  return `${baseName}_${Date.now()}.${extension}`;
}

// Helper function to find unique filename for workspace files
async function getUniqueFileNameWorkspace(
  supabase: any,
  workspaceId: string,
  folderId: string | null,
  baseName: string,
  extension: string
): Promise<string> {
  let fileName = `${baseName}.${extension}`;
  let counter = 0;
  
  while (counter < 100) {
    let query = supabase
      .from('workspace_files')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('file_name', fileName);
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }
    
    const { data: existingFile } = await query.maybeSingle();
    
    if (!existingFile) {
      return fileName;
    }
    
    counter++;
    fileName = `${baseName}_${counter}.${extension}`;
  }
  
  return `${baseName}_${Date.now()}.${extension}`;
}

Deno.serve(async (req) => {
  const logger = createLogger('save-response-to-file');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      logger.warn('Invalid token');
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messageContent, chatTitle, isSpaceChat, spaceId, customFileName, format, pdfBase64 } = await req.json();

    if (!messageContent && !pdfBase64) {
      logger.warn('No content provided');
      return new Response(JSON.stringify({ error: 'Message content or PDF data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate content size for quota check
    let contentBytes: number;
    let fileContent: Uint8Array | string;
    let contentType: string;
    let fileExtension: string;

    if (format === 'pdf' && pdfBase64) {
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileContent = bytes;
      contentBytes = bytes.length;
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      fileContent = messageContent;
      contentBytes = new TextEncoder().encode(messageContent).length;
      contentType = 'text/plain';
      fileExtension = 'txt';
    }

    // Determine if this is a workspace file
    const isWorkspaceFile = isSpaceChat && spaceId;
    let folderId: string | null = null;

    if (isWorkspaceFile) {
      const { data: workspaceFolder } = await supabase
        .from('file_folders')
        .select('id')
        .eq('workspace_id', spaceId)
        .eq('folder_type', 'workspace_root')
        .single();
      
      folderId = workspaceFolder?.id || null;
    } else {
      const { data: myChatsFolder } = await supabase
        .from('file_folders')
        .select('id')
        .eq('user_id', user.id)
        .eq('folder_type', 'my_chats')
        .single();
      
      folderId = myChatsFolder?.id || null;
    }

    // Generate filename
    let fileName: string;
    
    if (customFileName) {
      const sanitizedCustomName = customFileName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().slice(0, 80);
      if (isWorkspaceFile) {
        fileName = await getUniqueFileNameWorkspace(supabase, spaceId, folderId, sanitizedCustomName, fileExtension);
      } else {
        fileName = await getUniqueFileName(supabase, user.id, folderId, sanitizedCustomName, fileExtension);
      }
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedTitle = (chatTitle || 'response').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
      fileName = `${sanitizedTitle}_${timestamp}.${fileExtension}`;
    }

    logger.info('Saving file', { fileName, format: fileExtension, size: contentBytes });

    // Upload to storage
    const storagePath = `${user.id}/chats/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(storagePath, fileContent, {
        contentType: contentType,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error', { error: uploadError.message });
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create file record in appropriate table
    let fileRecord: any;
    let dbError: any;

    if (isWorkspaceFile) {
      // Insert into workspace_files table
      const result = await supabase
        .from('workspace_files')
        .insert({
          workspace_id: spaceId,
          uploaded_by: user.id,
          folder_id: folderId,
          file_name: fileName,
          original_name: fileName,
          file_type: contentType,
          file_size: contentBytes,
          storage_path: storagePath,
        })
        .select()
        .single();
      
      fileRecord = result.data;
      dbError = result.error;
    } else {
      // Insert into user_files table
      const result = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          folder_id: folderId,
          file_name: fileName,
          original_name: fileName,
          file_type: contentType,
          file_size: contentBytes,
          storage_path: storagePath,
        })
        .select()
        .single();
      
      fileRecord = result.data;
      dbError = result.error;
    }

    if (dbError) {
      logger.error('DB error', { error: dbError.message });
      await supabase.storage.from('user-files').remove([storagePath]);
      return new Response(JSON.stringify({ error: 'Failed to create file record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.complete(Date.now() - startTime, { 
      fileName, 
      size: contentBytes, 
      userId: user.id 
    });

    return new Response(JSON.stringify({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileName,
        size: contentBytes,
        folderId,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
