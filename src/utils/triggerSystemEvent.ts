import { supabase } from '@/integrations/supabase/client';

interface SystemEvent {
  event_type: string;
  event_id?: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export const triggerSystemEvent = async (event: SystemEvent) => {
  try {
    const { data, error } = await supabase.functions.invoke('process-system-event', {
      body: event,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error triggering system event:', error);
    throw error;
  }
};
