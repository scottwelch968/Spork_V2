export interface SupabaseCredentials {
  projectRef: string;
  accessToken: string;
  serviceRoleKey?: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  app_metadata: {
      provider?: string;
      [key: string]: any;
  };
  user_metadata: any;
  roles?: string[]; // Array of roles from user_roles table ('admin' | 'user')
}

export interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  status: string;
  version: number;
  created_at: number;
  updated_at: number;
  verify_jwt: boolean;
  import_map: boolean;
  entrypoint_path: string;
}

export interface AuthConfig {
  site_url: string;
  disable_signup: boolean;
  external_email_enabled: boolean;
  external_phone_enabled: boolean;
  external_google_enabled: boolean;
  external_github_enabled: boolean;
  mailer_secure_email_change_enabled: boolean;
  security_captcha_enabled: boolean;
  // Extended configuration
  external_google_client_id?: string;
  external_google_secret?: string;
  external_github_client_id?: string;
  external_github_secret?: string;
  mailer_autoconfirm?: boolean;
  uri_allow_list?: string[];
  [key: string]: any;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
  updated_at: string;
}

export interface StorageFile {
  name: string;
  id?: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata?: any;
}

