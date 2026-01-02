import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailEventType {
  event_type: string;
  display_name: string;
  category: string;
  description?: string;
  available_variables: string[];
  is_critical: boolean;
  created_at: string;
}

export const useEmailEventTypes = () => {
  const [eventTypes, setEventTypes] = useState<EmailEventType[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEventTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_system_event_types')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setEventTypes((data || []).map(event => ({
        ...event,
        available_variables: Array.isArray(event.available_variables) 
          ? event.available_variables as string[]
          : [],
      })) as EmailEventType[]);
    } catch (error: any) {
      console.error('Error loading event types:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypesByCategory = (category: string) => {
    return eventTypes.filter(event => event.category === category);
  };

  const getEventType = (eventType: string) => {
    return eventTypes.find(event => event.event_type === eventType);
  };

  useEffect(() => {
    loadEventTypes();
  }, []);

  return {
    eventTypes,
    loading,
    loadEventTypes,
    getEventTypesByCategory,
    getEventType,
  };
};
