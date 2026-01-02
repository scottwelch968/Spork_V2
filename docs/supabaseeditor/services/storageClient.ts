import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCredentials, StorageBucket, StorageFile } from '../types';

let supabase: SupabaseClient | null = null;

export const storageClient = {
  init(creds: SupabaseCredentials) {
    if (!creds.serviceRoleKey) return null;
    const url = `https://${creds.projectRef}.supabase.co`;
    supabase = createClient(url, creds.serviceRoleKey);
    return supabase;
  },

  isInitialized() {
    return !!supabase;
  },

  async listBuckets(): Promise<StorageBucket[]> {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return data || [];
  },

  async createBucket(name: string, isPublic: boolean = false) {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { data, error } = await supabase.storage.createBucket(name, {
      public: isPublic,
      fileSizeLimit: null, // Unlimited
      allowedMimeTypes: null // All
    });
    if (error) throw error;
    return data;
  },

  async deleteBucket(id: string) {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { error } = await supabase.storage.deleteBucket(id);
    if (error) throw error;
  },

  async updateBucket(id: string, isPublic: boolean) {
     if (!supabase) throw new Error("Storage client not initialized.");
     const { data, error } = await supabase.storage.updateBucket(id, {
         public: isPublic
     });
     if (error) throw error;
     return data;
  },

  async listFiles(bucketName: string, path: string = ''): Promise<StorageFile[]> {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    return data || [];
  },

  async uploadFile(bucketName: string, path: string, file: File) {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { data, error } = await supabase.storage.from(bucketName).upload(path, file, {
        cacheControl: '3600',
        upsert: false
    });
    if (error) throw error;
    return data;
  },

  async uploadFileText(bucketName: string, path: string, content: string, contentType: string = 'text/plain') {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { data, error } = await supabase.storage.from(bucketName).upload(path, content, {
        contentType,
        upsert: true
    });
    if (error) throw error;
    return data;
  },

  async deleteFile(bucketName: string, path: string) {
    if (!supabase) throw new Error("Storage client not initialized.");
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    if (error) throw error;
  },

  getPublicUrl(bucketName: string, path: string) {
      if (!supabase) return '';
      const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
      return data.publicUrl;
  }
};