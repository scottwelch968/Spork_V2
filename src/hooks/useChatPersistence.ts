import { supabase } from '@/integrations/supabase/client';
import { chatEvents } from './useChatEvents';

// Background save queue for non-blocking database operations
interface SaveOperation {
  table: string;
  data: any;
  retries: number;
}

const saveQueue: SaveOperation[] = [];
let isProcessingQueue = false;

async function processSaveQueue() {
  if (isProcessingQueue || saveQueue.length === 0) return;
  isProcessingQueue = true;
  
  // Batch operations for efficiency
  const batchOperations: SaveOperation[] = [];
  while (saveQueue.length > 0 && batchOperations.length < 10) {
    batchOperations.push(saveQueue.shift()!);
  }

  try {
    // Route through edge function for architecture compliance
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      // Re-queue operations if no session
      batchOperations.forEach(op => saveQueue.push(op));
      isProcessingQueue = false;
      return;
    }

    const { data, error } = await supabase.functions.invoke('chat-messages', {
      body: {
        action: 'batch_save',
        operations: batchOperations.map(op => ({
          table: op.table,
          data: op.data,
        })),
      },
    });

    if (error) {
      console.error('[SaveQueue] Batch save error:', error);
      // Re-queue failed operations with retry logic
      for (const op of batchOperations) {
        if (op.retries < 3) {
          setTimeout(() => {
            saveQueue.push({ ...op, retries: op.retries + 1 });
            processSaveQueue();
          }, Math.pow(2, op.retries) * 1000);
        } else {
          chatEvents.emit('error', {
            phase: 'background-save',
            error: new Error(`Failed to save after 3 retries: ${error.message}`),
            recoverable: false,
          });
        }
      }
    } else if (data?.data) {
      // Check individual operation results
      for (let i = 0; i < data.data.length; i++) {
        const result = data.data[i];
        if (!result.success && batchOperations[i].retries < 3) {
          setTimeout(() => {
            saveQueue.push({ ...batchOperations[i], retries: batchOperations[i].retries + 1 });
            processSaveQueue();
          }, Math.pow(2, batchOperations[i].retries) * 1000);
        }
      }
    }
  } catch (err) {
    console.error('[SaveQueue] Exception during batch save:', err);
    // Re-queue all operations
    batchOperations.forEach(op => {
      if (op.retries < 3) {
        saveQueue.push({ ...op, retries: op.retries + 1 });
      }
    });
  }
  
  isProcessingQueue = false;
  
  // Continue processing if more items in queue
  if (saveQueue.length > 0) {
    queueMicrotask(processSaveQueue);
  }
}

export function queueSave(table: string, data: any) {
  saveQueue.push({ table, data, retries: 0 });
  // Start processing on next tick (non-blocking)
  queueMicrotask(processSaveQueue);
}
