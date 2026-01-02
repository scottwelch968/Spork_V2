import { createClient } from '@supabase/supabase-js';
import { SupabaseCredentials } from '../types';

export const realtimeService = {
  /**
   * Sends a one-off broadcast message to a Supabase Realtime channel.
   * Useful for the AI to trigger events or alerts.
   */
  async sendBroadcast(creds: SupabaseCredentials, channelName: string, event: string, payload: any) {
    if (!creds.serviceRoleKey) {
        throw new Error("Service Role Key is required to send broadcasts via the API.");
    }

    const supabase = createClient(`https://${creds.projectRef}.supabase.co`, creds.serviceRoleKey);
    
    return new Promise((resolve, reject) => {
        const channel = supabase.channel(channelName);
        
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                try {
                    await channel.send({
                        type: 'broadcast',
                        event: event,
                        payload: payload
                    });
                    
                    // Cleanup and disconnect
                    supabase.removeChannel(channel);
                    resolve({ success: true, message: `Broadcast '${event}' sent to '${channelName}'` });
                } catch (err) {
                    reject(err);
                }
            } else if (status === 'CHANNEL_ERROR') {
                reject(new Error("Failed to connect to Realtime channel"));
            }
        });

        // Timeout safety
        setTimeout(() => {
            supabase.removeChannel(channel);
            reject(new Error("Realtime broadcast timed out"));
        }, 5000);
    });
  }
};



