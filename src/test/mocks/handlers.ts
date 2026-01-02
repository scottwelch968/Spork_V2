import { http, HttpResponse } from 'msw';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://localhost.supabase.co'; // Use .env for real project, localhost for tests

export const handlers = [
  // Chat edge function
  http.post(`${SUPABASE_URL}/functions/v1/chat`, async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"Test response from AI"}\n\n'));
        controller.enqueue(encoder.encode('data: {"metadata":{"actualModelUsed":"openai/gpt-4o","tokens":{"prompt":10,"completion":20}}}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
    
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }),

  // Image generation
  http.post(`${SUPABASE_URL}/functions/v1/generate-image`, async () => {
    return HttpResponse.json({ 
      url: 'https://example.com/generated-image.png',
      model: 'flux/schnell'
    });
  }),

  // Check quota
  http.post(`${SUPABASE_URL}/functions/v1/check-quota`, async () => {
    return HttpResponse.json({ 
      allowed: true, 
      remaining: 100,
      quotaType: 'chat_tokens'
    });
  }),

  // Track usage
  http.post(`${SUPABASE_URL}/functions/v1/track-usage`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // Admin data
  http.post(`${SUPABASE_URL}/functions/v1/admin-data`, async ({ request }) => {
    const body = await request.json() as { action: string };
    
    if (body.action === 'get_test_runs') {
      return HttpResponse.json({ data: [] });
    }
    
    if (body.action === 'get_latest_test_run') {
      return HttpResponse.json({ data: null });
    }
    
    return HttpResponse.json({ data: {} });
  }),

  // Report test results
  http.post(`${SUPABASE_URL}/functions/v1/report-test-results`, async () => {
    return HttpResponse.json({ success: true, id: 'test-run-123' });
  }),
];
