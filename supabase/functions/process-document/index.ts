import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, toExecutionError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('process-document');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { documentId, storagePath } = await req.json();

    logger.info('Processing document', { documentId, storagePath });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('knowledge-base')
      .download(storagePath);

    if (downloadError) {
      logger.error('Download error', { error: downloadError.message, storagePath });
      const error = createCosmoError('FUNCTION_FAILED', `Failed to download file: ${downloadError.message}`);
      return new Response(JSON.stringify(toExecutionError(error)), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract text content based on file type
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    // Remove any null bytes at the byte level before decoding
    const filteredBytes = uint8Array.filter((byte) => byte !== 0);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(filteredBytes);

    // Sanitize text to remove any remaining problematic characters
    text = sanitizeText(text);
    
    // Split content into chunks for better retrieval
    const chunks = splitIntoChunks(text, 1000);
    
    logger.info('Content extracted', { characters: text.length, chunks: chunks.length });

    // Get user_id and workspace_id from document before updating
    const { data: doc } = await supabase
      .from('knowledge_base')
      .select('user_id, workspace_id, file_size')
      .eq('id', documentId)
      .single();

    // Update document with processed content
    const { error: updateError } = await supabase
      .from('knowledge_base')
      .update({
        content: text,
        chunks: chunks.map((chunk, index) => ({
          index,
          content: chunk,
          length: chunk.length
        }))
      })
      .eq('id', documentId);

    if (updateError) {
      logger.error('Update error', { error: updateError.message, documentId });
      const error = createCosmoError('FUNCTION_FAILED', `Failed to update document: ${updateError.message}`);
      return new Response(JSON.stringify(toExecutionError(error)), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log cost for document processing (based on size)
    const costPerPage = 0.01; // $0.01 per estimated page
    const estimatedPages = Math.ceil((doc?.file_size || 0) / 5000); // ~5KB per page
    const docCost = estimatedPages * costPerPage;

    if (doc?.user_id && doc?.workspace_id) {
      await supabase.from('usage_logs').insert({
        user_id: doc.user_id,
        workspace_id: doc.workspace_id,
        action: 'document_parse',
        action_type: 'document_parse',
        cost: docCost,
        metadata: { 
          document_id: documentId,
          chunks: chunks.length,
          file_size: doc.file_size,
          estimated_pages: estimatedPages
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.fail(error);
    const cosmoError = errorFromException(error);
    return new Response(JSON.stringify(toExecutionError(cosmoError)), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function sanitizeText(text: string): string {
  // Remove null bytes and other problematic control characters that PostgreSQL can't store
  // Keep legitimate whitespace (spaces, tabs, newlines) but remove other control chars
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove other control characters
    .trim();
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}