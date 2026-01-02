import { SupabaseCredentials } from '../types';
import { supabaseService } from './supabaseService';
import { authClient } from './authClient';
import { storageClient } from './storageClient';
import { realtimeService } from './realtimeService';

// Simplified AI service that uses OpenRouter API
// This is a basic implementation - function calling can be added later

export const aiService = {
  async askAssistant(
    prompt: string, 
    creds: SupabaseCredentials, 
    modelId: string,
    context?: string
  ): Promise<string> {
    try {
      // For now, use a simple approach: call OpenRouter API directly
      // In production, this should go through your backend API
      const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in environment variables.');
      }

      const chatContext = `
        Context: You are "Antigravity Bridge", an expert Admin AI for Supabase.
        Project Ref: ${creds.projectRef}
        Current Page: ${context || 'General'}
        
        Capabilities:
        - **Database**: Run SQL, View Schemas, Inspect Constraints (FKs), Inspect RLS Policies. Supports creating tables with constraints.
        - **Functions**: Deploy, Update, Delete Edge Functions.
        - **Auth**: Manage Users, Configure Providers.
        - **Storage**: Manage Buckets, List Files, Upload Text Files, Delete Files.
        - **Realtime**: Enable tables via SQL, Send Broadcast messages.
        
        Instructions:
        - Be concise and helpful.
        - If the user asks about specific Supabase operations, you can help guide them.
        - For actual operations, you would use function calling (to be implemented).
      `;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Antigravity Bridge'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: chatContext },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        throw new Error(errorData.error?.message || errorText || `API Error: ${response.status}`);
      }

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response from AI service: ${responseText.substring(0, 100)}`);
      }
      return data.choices[0]?.message?.content || "I couldn't process that request.";

    } catch (error: any) {
      console.error("AI Service Error:", error);
      return `I encountered an error: ${error.message || 'Unknown error'}. Please check your configuration and try again.`;
    }
  }
};

