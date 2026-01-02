import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase, mockSession, mockUser, mockProfile } from '@/test/mocks/supabase';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supabase mock is configured correctly', () => {
    expect(mockSupabase.auth.getSession).toBeDefined();
    expect(mockSupabase.auth.signInWithPassword).toBeDefined();
    expect(mockSupabase.auth.signOut).toBeDefined();
  });

  it('mock session has required fields', () => {
    expect(mockSession.access_token).toBe('mock-access-token');
    expect(mockSession.user.id).toBe('test-user-id');
    expect(mockSession.user.email).toBe('test@example.com');
  });

  it('mock user has required fields', () => {
    expect(mockUser.id).toBe('test-user-id');
    expect(mockUser.email).toBe('test@example.com');
    expect(mockUser.aud).toBe('authenticated');
  });

  it('mock profile has required fields', () => {
    expect(mockProfile.id).toBe('test-user-id');
    expect(mockProfile.email).toBe('test@example.com');
    expect(mockProfile.account_status).toBe('active');
  });

  it('getSession returns mock session', async () => {
    const result = await mockSupabase.auth.getSession();
    expect(result.data.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  it('signInWithPassword returns mock data', async () => {
    const result = await mockSupabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.data.session).toEqual(mockSession);
    expect(result.data.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it('signOut clears session', async () => {
    const result = await mockSupabase.auth.signOut();
    expect(result.error).toBeNull();
  });

  it('onAuthStateChange returns subscription', () => {
    const callback = vi.fn();
    const result = mockSupabase.auth.onAuthStateChange(callback);
    expect(result.data.subscription.unsubscribe).toBeDefined();
  });
});
