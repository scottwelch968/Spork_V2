/**
 * External Integration Handler
 * 
 * Manages credential resolution and external API calls for App Store items.
 * All external operations flow through COSMO for permission validation.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  ExternalProvider,
  IntegrationCredentials,
  ExternalOperationRequest,
  ExternalOperationResult,
  OAuthTokens,
  AppItemType,
} from './types.ts';
import { createCosmoError } from './errors.ts';
import { info, warn, error as logError, debug } from './logger.ts';

// ============= Provider Adapters =============

/**
 * Base interface for provider-specific adapters
 */
export interface ExternalProviderAdapter {
  providerKey: string;
  
  // OAuth flow
  getAuthorizationUrl(clientId: string, scopes: string[], state: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<OAuthTokens>;
  
  // API operations
  executeOperation(
    operation: string,
    credentials: IntegrationCredentials,
    payload: Record<string, unknown>
  ): Promise<unknown>;
  
  // Webhook handling (optional)
  verifyWebhookSignature?(payload: string, signature: string, secret: string): boolean;
}

// ============= Provider Registry =============

/**
 * Registry of supported provider adapters
 */
const providerAdapters: Map<string, ExternalProviderAdapter> = new Map();

/**
 * Register a provider adapter
 */
export function registerProvider(adapter: ExternalProviderAdapter): void {
  providerAdapters.set(adapter.providerKey, adapter);
}

/**
 * Get provider adapter by key
 */
export function getProviderAdapter(providerKey: string): ExternalProviderAdapter | undefined {
  return providerAdapters.get(providerKey);
}

// ============= Slack Provider =============

const slackAdapter: ExternalProviderAdapter = {
  providerKey: 'slack',
  
  getAuthorizationUrl(clientId, scopes, state, redirectUri) {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      state,
      redirect_uri: redirectUri,
    });
    return `https://slack.com/oauth/v2/authorize?${params}`;
  },
  
  async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    debug('Slack: exchanging code for tokens');
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    if (!data.ok) {
      logError('Slack OAuth token exchange failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `Slack OAuth error: ${data.error}`, 'slack');
    }
    
    info('Slack: token exchange successful', { team: data.team?.name });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      externalUserId: data.authed_user?.id,
      externalWorkspaceId: data.team?.id,
      externalWorkspaceName: data.team?.name,
    };
  },
  
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    debug('Slack: refreshing access token');
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    const data = await response.json();
    if (!data.ok) {
      logError('Slack token refresh failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `Slack token refresh error: ${data.error}`, 'slack');
    }
    
    info('Slack: token refresh successful');
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  },
  
  async executeOperation(operation, credentials, payload) {
    const [, method] = operation.split('.');
    const apiUrl = `https://slack.com/api/${method}`;
    
    debug('Slack: executing operation', { method });
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    if (!data.ok) {
      logError('Slack API operation failed', { method, error: data.error });
      throw createCosmoError('FUNCTION_FAILED', `Slack API error: ${data.error}`, `slack.${method}`);
    }
    
    info('Slack: operation successful', { method });
    return data;
  },
  
  verifyWebhookSignature(payload, signature, secret) {
    // Slack signing verification
    const [version, hash] = signature.split('=');
    const timestamp = payload.split(',')[0]?.split('=')[1];
    const baseString = `${version}:${timestamp}:${payload}`;
    
    // Note: In production, use crypto.subtle for HMAC verification
    debug('Slack webhook verification', { version, hasHash: !!hash });
    return true; // Simplified for now
  },
};

// ============= Google Drive Provider =============

const googleDriveAdapter: ExternalProviderAdapter = {
  providerKey: 'google_drive',
  
  getAuthorizationUrl(clientId, scopes, state, redirectUri) {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(' '),
      state,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
  
  async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    debug('Google: exchanging code for tokens');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      logError('Google OAuth token exchange failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `Google OAuth error: ${data.error_description || data.error}`, 'google_drive');
    }
    
    // Fetch user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${data.access_token}` },
    });
    const userInfo = await userResponse.json();
    
    info('Google: token exchange successful', { email: userInfo.email });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      externalUserId: userInfo.id,
      externalUserEmail: userInfo.email,
      externalUserName: userInfo.name,
    };
  },
  
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    debug('Google: refreshing access token');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      logError('Google token refresh failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `Google token refresh error: ${data.error_description || data.error}`, 'google_drive');
    }
    
    info('Google: token refresh successful');
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  },
  
  async executeOperation(operation, credentials, payload) {
    const [, method] = operation.split('.');
    let url = '';
    let options: RequestInit = {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    debug('Google Drive: executing operation', { method });
    switch (method) {
      case 'listFiles':
        url = 'https://www.googleapis.com/drive/v3/files';
        if (payload.query) url += `?q=${encodeURIComponent(payload.query as string)}`;
        options.method = 'GET';
        break;
      case 'getFile':
        url = `https://www.googleapis.com/drive/v3/files/${payload.fileId}`;
        options.method = 'GET';
        break;
      case 'createFile':
        url = 'https://www.googleapis.com/drive/v3/files';
        options.method = 'POST';
        options.body = JSON.stringify(payload.metadata);
        break;
      default:
        logError('Google Drive: unknown operation', { method });
        throw createCosmoError('INVALID_PAYLOAD', `Unknown Google Drive operation: ${method}`, 'google_drive');
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.error) {
      logError('Google Drive API operation failed', { method, error: data.error.message });
      throw createCosmoError('FUNCTION_FAILED', `Google Drive API error: ${data.error.message}`, `google_drive.${method}`);
    }
    
    info('Google Drive: operation successful', { method });
    return data;
  },
};

// ============= Notion Provider =============

const notionAdapter: ExternalProviderAdapter = {
  providerKey: 'notion',
  
  getAuthorizationUrl(clientId, scopes, state, redirectUri) {
    const params = new URLSearchParams({
      client_id: clientId,
      state,
      redirect_uri: redirectUri,
      response_type: 'code',
      owner: 'user',
    });
    return `https://api.notion.com/v1/oauth/authorize?${params}`;
  },
  
  async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    debug('Notion: exchanging code for tokens');
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      logError('Notion OAuth token exchange failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `Notion OAuth error: ${data.error}`, 'notion');
    }
    
    info('Notion: token exchange successful', { workspace: data.workspace_name });
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      externalWorkspaceId: data.workspace_id,
      externalWorkspaceName: data.workspace_name,
      externalUserId: data.owner?.user?.id,
    };
  },
  
  async refreshAccessToken() {
    // Notion doesn't support refresh tokens - tokens don't expire
    warn('Notion: refresh token called but Notion tokens do not expire');
    throw createCosmoError('INVALID_PAYLOAD', 'Notion tokens do not expire and cannot be refreshed', 'notion');
  },
  
  async executeOperation(operation, credentials, payload) {
    const [, method] = operation.split('.');
    let url = '';
    let options: RequestInit = {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    };
    
    debug('Notion: executing operation', { method });
    switch (method) {
      case 'searchPages':
        url = 'https://api.notion.com/v1/search';
        options.method = 'POST';
        options.body = JSON.stringify({ query: payload.query, filter: { property: 'object', value: 'page' } });
        break;
      case 'getPage':
        url = `https://api.notion.com/v1/pages/${payload.pageId}`;
        options.method = 'GET';
        break;
      case 'createPage':
        url = 'https://api.notion.com/v1/pages';
        options.method = 'POST';
        options.body = JSON.stringify(payload);
        break;
      default:
        logError('Notion: unknown operation', { method });
        throw createCosmoError('INVALID_PAYLOAD', `Unknown Notion operation: ${method}`, 'notion');
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.object === 'error') {
      logError('Notion API operation failed', { method, error: data.message });
      throw createCosmoError('FUNCTION_FAILED', `Notion API error: ${data.message}`, `notion.${method}`);
    }
    
    info('Notion: operation successful', { method });
    return data;
  },
};

// ============= HubSpot Provider =============

const hubspotAdapter: ExternalProviderAdapter = {
  providerKey: 'hubspot',
  
  getAuthorizationUrl(clientId, scopes, state, redirectUri) {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(' '),
      state,
      redirect_uri: redirectUri,
    });
    return `https://app.hubspot.com/oauth/authorize?${params}`;
  },
  
  async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
    debug('HubSpot: exchanging code for tokens');
    const response = await fetch('https://api.hubspot.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      logError('HubSpot OAuth token exchange failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `HubSpot OAuth error: ${data.error_description || data.error}`, 'hubspot');
    }
    
    info('HubSpot: token exchange successful');
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: 'Bearer',
      expiresIn: data.expires_in,
    };
  },
  
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    debug('HubSpot: refreshing access token');
    const response = await fetch('https://api.hubspot.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      logError('HubSpot token refresh failed', { error: data.error });
      throw createCosmoError('INTEGRATION_EXPIRED', `HubSpot token refresh error: ${data.error_description || data.error}`, 'hubspot');
    }
    
    info('HubSpot: token refresh successful');
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: 'Bearer',
      expiresIn: data.expires_in,
    };
  },
  
  async executeOperation(operation, credentials, payload) {
    const [, method] = operation.split('.');
    let url = '';
    let options: RequestInit = {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    debug('HubSpot: executing operation', { method });
    switch (method) {
      case 'getContacts':
        url = 'https://api.hubspot.com/crm/v3/objects/contacts';
        options.method = 'GET';
        break;
      case 'createContact':
        url = 'https://api.hubspot.com/crm/v3/objects/contacts';
        options.method = 'POST';
        options.body = JSON.stringify({ properties: payload });
        break;
      case 'getDeals':
        url = 'https://api.hubspot.com/crm/v3/objects/deals';
        options.method = 'GET';
        break;
      default:
        logError('HubSpot: unknown operation', { method });
        throw createCosmoError('INVALID_PAYLOAD', `Unknown HubSpot operation: ${method}`, 'hubspot');
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.status === 'error') {
      logError('HubSpot API operation failed', { method, error: data.message });
      throw createCosmoError('FUNCTION_FAILED', `HubSpot API error: ${data.message}`, `hubspot.${method}`);
    }
    
    info('HubSpot: operation successful', { method });
    return data;
  },
};

// Register all providers
registerProvider(slackAdapter);
registerProvider(googleDriveAdapter);
registerProvider(notionAdapter);
registerProvider(hubspotAdapter);

// ============= External Integration Handler =============

export class ExternalIntegrationHandler {
  private supabase: SupabaseClient;
  
  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  /**
   * Resolve credentials for an external operation
   */
  async resolveCredentials(
    request: ExternalOperationRequest
  ): Promise<IntegrationCredentials | null> {
    // Try workspace integration first if preferred
    if (request.preferWorkspaceIntegration && request.workspaceId) {
      const workspaceIntegration = await this.getWorkspaceIntegration(
        request.workspaceId,
        request.providerKey
      );
      if (workspaceIntegration) {
        return workspaceIntegration;
      }
    }
    
    // Fall back to user integration
    return this.getUserIntegration(request.userId, request.providerKey);
  }
  
  /**
   * Get user integration credentials
   */
  async getUserIntegration(
    userId: string,
    providerKey: string
  ): Promise<IntegrationCredentials | null> {
    const { data, error } = await this.supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider_key', providerKey)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Decrypt tokens from vault (simplified - in production use vault API)
    // For now, we assume tokens are stored directly
    return {
      providerKey: data.provider_key,
      scopes: data.oauth_scopes || [],
      expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
      externalAccountId: data.external_account_id,
      externalAccountName: data.external_account_name,
      // Tokens would be decrypted from vault in production
    };
  }
  
  /**
   * Get workspace integration credentials
   */
  async getWorkspaceIntegration(
    workspaceId: string,
    providerKey: string
  ): Promise<IntegrationCredentials | null> {
    const { data, error } = await this.supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider_key', providerKey)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      providerKey: data.provider_key,
      scopes: data.oauth_scopes || [],
      expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
      externalAccountId: data.external_workspace_id,
      externalAccountName: data.external_workspace_name,
    };
  }
  
  /**
   * Check if an integration is connected and valid
   */
  async checkConnection(
    userId: string,
    workspaceId: string | undefined,
    providerKey: string
  ): Promise<{ connected: boolean; status: string; requiresScopes?: string[] }> {
    // Check user integration
    const { data: userInt } = await this.supabase
      .from('user_integrations')
      .select('status, oauth_scopes, token_expires_at')
      .eq('user_id', userId)
      .eq('provider_key', providerKey)
      .single();
    
    if (userInt) {
      const isExpired = userInt.token_expires_at && new Date(userInt.token_expires_at) < new Date();
      return {
        connected: userInt.status === 'active' && !isExpired,
        status: isExpired ? 'expired' : userInt.status,
      };
    }
    
    // Check workspace integration if provided
    if (workspaceId) {
      const { data: workspaceInt } = await this.supabase
        .from('workspace_integrations')
        .select('status, oauth_scopes, token_expires_at')
        .eq('workspace_id', workspaceId)
        .eq('provider_key', providerKey)
        .single();
      
      if (workspaceInt) {
        const isExpired = workspaceInt.token_expires_at && new Date(workspaceInt.token_expires_at) < new Date();
        return {
          connected: workspaceInt.status === 'active' && !isExpired,
          status: isExpired ? 'expired' : workspaceInt.status,
        };
      }
    }
    
    return { connected: false, status: 'not_connected' };
  }
  
  /**
   * Execute authenticated call to external provider
   */
  async executeExternalCall(
    request: ExternalOperationRequest
  ): Promise<ExternalOperationResult> {
    const startTime = Date.now();
    
    // Get provider adapter
    const adapter = getProviderAdapter(request.providerKey);
    if (!adapter) {
      return {
        success: false,
        providerKey: request.providerKey,
        error: {
          code: 'provider_error',
          message: `Provider '${request.providerKey}' is not supported`,
          requiresReauth: false,
        },
      };
    }
    
    // Resolve credentials
    const credentials = await this.resolveCredentials(request);
    if (!credentials) {
      return {
        success: false,
        providerKey: request.providerKey,
        error: {
          code: 'credential_missing',
          message: `No active integration found for '${request.providerKey}'`,
          requiresReauth: true,
        },
      };
    }
    
    // Check if credentials are expired
    if (credentials.expiresAt && credentials.expiresAt < new Date()) {
      return {
        success: false,
        providerKey: request.providerKey,
        error: {
          code: 'credential_expired',
          message: 'Integration credentials have expired',
          requiresReauth: true,
        },
      };
    }
    
    // Check required scopes
    if (request.requiredScopes && request.requiredScopes.length > 0) {
      const missingScopes = request.requiredScopes.filter(
        scope => !credentials.scopes.includes(scope)
      );
      if (missingScopes.length > 0) {
        return {
          success: false,
          providerKey: request.providerKey,
          error: {
            code: 'scope_insufficient',
            message: `Missing required scopes: ${missingScopes.join(', ')}`,
            requiresReauth: true,
          },
        };
      }
    }
    
    try {
      // Execute the operation
      const data = await adapter.executeOperation(
        request.operation,
        credentials,
        request.payload
      );
      
      // Update last_used_at
      await this.updateLastUsed(request.userId, request.workspaceId, request.providerKey);
      
      // Log usage
      await this.logUsage({
        userId: request.userId,
        workspaceId: request.workspaceId,
        providerKey: request.providerKey,
        operation: request.operation,
        success: true,
        responseTimeMs: Date.now() - startTime,
      });
      
      return {
        success: true,
        data,
        providerKey: request.providerKey,
        operationTimeMs: Date.now() - startTime,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log usage failure
      await this.logUsage({
        userId: request.userId,
        workspaceId: request.workspaceId,
        providerKey: request.providerKey,
        operation: request.operation,
        success: false,
        errorMessage,
        responseTimeMs: Date.now() - startTime,
      });
      
      // Determine if reauth is needed based on error
      const requiresReauth = errorMessage.includes('invalid_auth') || 
                            errorMessage.includes('token') ||
                            errorMessage.includes('unauthorized');
      
      return {
        success: false,
        providerKey: request.providerKey,
        operationTimeMs: Date.now() - startTime,
        error: {
          code: 'provider_error',
          message: errorMessage,
          requiresReauth,
        },
      };
    }
  }
  
  /**
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(
    providerKey: string,
    userId: string,
    workspaceId: string | undefined,
    redirectUri: string,
    scopes?: string[]
  ): Promise<string> {
    debug('Generating OAuth auth URL', { providerKey, userId });
    
    // Get provider config
    const { data: provider } = await this.supabase
      .from('external_providers')
      .select('*')
      .eq('provider_key', providerKey)
      .eq('is_enabled', true)
      .single();
    
    if (!provider) {
      logError('Provider not found or disabled', { providerKey });
      throw createCosmoError('CONFIG_MISSING', `Provider '${providerKey}' not found or disabled`, providerKey);
    }
    
    const adapter = getProviderAdapter(providerKey);
    if (!adapter) {
      logError('No adapter for provider', { providerKey });
      throw createCosmoError('CONFIG_MISSING', `No adapter for provider '${providerKey}'`, providerKey);
    }
    
    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();
    
    // Store state in database
    await this.supabase.from('oauth_states').insert({
      state_token: stateToken,
      user_id: userId,
      provider_key: providerKey,
      workspace_id: workspaceId,
      redirect_uri: redirectUri,
      scopes: scopes || provider.oauth_scopes || [],
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });
    
    // Get client ID from secrets (in production, use vault)
    const clientId = Deno.env.get(`${providerKey.toUpperCase()}_CLIENT_ID`) || '';
    
    info('OAuth auth URL generated', { providerKey, userId });
    return adapter.getAuthorizationUrl(
      clientId,
      scopes || provider.oauth_scopes || [],
      stateToken,
      redirectUri
    );
  }
  
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{ success: boolean; integrationId?: string; error?: string }> {
    // Validate state token
    const { data: stateData, error: stateError } = await this.supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .single();
    
    if (stateError || !stateData) {
      return { success: false, error: 'Invalid or expired state token' };
    }
    
    // Check expiration
    if (new Date(stateData.expires_at) < new Date()) {
      await this.supabase.from('oauth_states').delete().eq('id', stateData.id);
      return { success: false, error: 'State token expired' };
    }
    
    // Get provider adapter
    const adapter = getProviderAdapter(stateData.provider_key);
    if (!adapter) {
      return { success: false, error: `No adapter for provider '${stateData.provider_key}'` };
    }
    
    try {
      // Get client credentials (in production, use vault)
      const clientId = Deno.env.get(`${stateData.provider_key.toUpperCase()}_CLIENT_ID`) || '';
      const clientSecret = Deno.env.get(`${stateData.provider_key.toUpperCase()}_CLIENT_SECRET`) || '';
      
      // Exchange code for tokens
      const tokens = await adapter.exchangeCodeForTokens(
        code,
        clientId,
        clientSecret,
        stateData.redirect_uri
      );
      
      // Store integration
      const integrationData = {
        user_id: stateData.user_id,
        provider_key: stateData.provider_key,
        oauth_scopes: stateData.scopes,
        token_expires_at: tokens.expiresIn 
          ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() 
          : null,
        external_account_id: tokens.externalUserId,
        external_account_name: tokens.externalUserName,
        external_account_email: tokens.externalUserEmail,
        status: 'active',
        // In production, store tokens in vault and reference secret IDs here
      };
      
      const { data: integration, error: insertError } = await this.supabase
        .from('user_integrations')
        .upsert(integrationData, { onConflict: 'user_id,provider_key' })
        .select()
        .single();
      
      if (insertError) {
        return { success: false, error: `Failed to store integration: ${insertError.message}` };
      }
      
      // Clean up state token
      await this.supabase.from('oauth_states').delete().eq('id', stateData.id);
      
      return { success: true, integrationId: integration.id };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
  
  // ============= Helper Methods =============
  
  private async updateLastUsed(
    userId: string,
    workspaceId: string | undefined,
    providerKey: string
  ): Promise<void> {
    await this.supabase
      .from('user_integrations')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider_key', providerKey);
    
    if (workspaceId) {
      await this.supabase
        .from('workspace_integrations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .eq('provider_key', providerKey);
    }
  }
  
  private async logUsage(params: {
    userId: string;
    workspaceId?: string;
    providerKey: string;
    operation: string;
    success: boolean;
    errorMessage?: string;
    responseTimeMs: number;
  }): Promise<void> {
    await this.supabase.from('integration_usage_log').insert({
      provider_key: params.providerKey,
      operation: params.operation,
      success: params.success,
      error_message: params.errorMessage,
      response_time_ms: params.responseTimeMs,
    });
  }
}
