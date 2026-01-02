export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          app_section: string
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          app_section: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          app_section?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_documentation: {
        Row: {
          category: string
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_methodology_docs: {
        Row: {
          category: string
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          best_for: Database["public"]["Enums"]["model_category"]
          best_for_description: string | null
          context_length: number | null
          created_at: string | null
          default_frequency_penalty: number | null
          default_max_tokens: number | null
          default_presence_penalty: number | null
          default_temperature: number | null
          default_top_k: number | null
          default_top_p: number | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          input_modalities: Json | null
          is_active: boolean | null
          is_default: boolean | null
          is_free: boolean | null
          max_completion_tokens: number | null
          model_id: string
          name: string
          output_modalities: Json | null
          pricing_completion: number | null
          pricing_prompt: number | null
          provider: string
          rate_limit_rpm: number | null
          rate_limit_tpm: number | null
          requires_api_key: boolean | null
          skip_temperature: boolean | null
          supported_parameters: Json | null
          updated_at: string | null
        }
        Insert: {
          best_for?: Database["public"]["Enums"]["model_category"]
          best_for_description?: string | null
          context_length?: number | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          input_modalities?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_free?: boolean | null
          max_completion_tokens?: number | null
          model_id: string
          name: string
          output_modalities?: Json | null
          pricing_completion?: number | null
          pricing_prompt?: number | null
          provider: string
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          requires_api_key?: boolean | null
          skip_temperature?: boolean | null
          supported_parameters?: Json | null
          updated_at?: string | null
        }
        Update: {
          best_for?: Database["public"]["Enums"]["model_category"]
          best_for_description?: string | null
          context_length?: number | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          input_modalities?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_free?: boolean | null
          max_completion_tokens?: number | null
          model_id?: string
          name?: string
          output_modalities?: Json | null
          pricing_completion?: number | null
          pricing_prompt?: number | null
          provider?: string
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          requires_api_key?: boolean | null
          skip_temperature?: boolean | null
          supported_parameters?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_prompt_library: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          system_prompt: string
          tags: string[] | null
          updated_at: string | null
          use_count: number | null
          user_prompt_template: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          system_prompt: string
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
          user_prompt_template?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          system_prompt?: string
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
          user_prompt_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompt_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      app_item_integrations: {
        Row: {
          connection_verified_at: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          provider_key: string
          tool_installation_id: string
          use_workspace_integration: boolean | null
          user_integration_id: string | null
          workspace_integration_id: string | null
        }
        Insert: {
          connection_verified_at?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          provider_key: string
          tool_installation_id: string
          use_workspace_integration?: boolean | null
          user_integration_id?: string | null
          workspace_integration_id?: string | null
        }
        Update: {
          connection_verified_at?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          provider_key?: string
          tool_installation_id?: string
          use_workspace_integration?: boolean | null
          user_integration_id?: string | null
          workspace_integration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_item_integrations_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "external_providers"
            referencedColumns: ["provider_key"]
          },
          {
            foreignKeyName: "app_item_integrations_tool_installation_id_fkey"
            columns: ["tool_installation_id"]
            isOneToOne: false
            referencedRelation: "spork_tool_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_item_integrations_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_item_integrations_workspace_integration_id_fkey"
            columns: ["workspace_integration_id"]
            isOneToOne: false
            referencedRelation: "workspace_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_triggered_at: string | null
          threshold_percentage: number | null
          workspace_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          threshold_percentage?: number | null
          workspace_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          threshold_percentage?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_actors: {
        Row: {
          actor_type: string
          allowed_functions: string[] | null
          context_defaults: Json | null
          created_at: string | null
          default_display_mode: string | null
          description: string | null
          display_order: number | null
          function_sequence: Json | null
          id: string
          is_enabled: boolean | null
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          actor_type: string
          allowed_functions?: string[] | null
          context_defaults?: Json | null
          created_at?: string | null
          default_display_mode?: string | null
          description?: string | null
          display_order?: number | null
          function_sequence?: Json | null
          id?: string
          is_enabled?: boolean | null
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          actor_type?: string
          allowed_functions?: string[] | null
          context_defaults?: Json | null
          created_at?: string | null
          default_display_mode?: string | null
          description?: string | null
          display_order?: number | null
          function_sequence?: Json | null
          id?: string
          is_enabled?: boolean | null
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_containers: {
        Row: {
          container_key: string
          content_type: string | null
          created_at: string | null
          description: string | null
          display_config: Json | null
          display_order: number | null
          format_config: Json | null
          function_key: string | null
          id: string
          is_core: boolean | null
          is_deletable: boolean | null
          is_enabled: boolean | null
          name: string
          render_schema: Json | null
          style_config: Json | null
          subscribes_to: string[] | null
          target_actors: string[] | null
          updated_at: string | null
        }
        Insert: {
          container_key: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          display_config?: Json | null
          display_order?: number | null
          format_config?: Json | null
          function_key?: string | null
          id?: string
          is_core?: boolean | null
          is_deletable?: boolean | null
          is_enabled?: boolean | null
          name: string
          render_schema?: Json | null
          style_config?: Json | null
          subscribes_to?: string[] | null
          target_actors?: string[] | null
          updated_at?: string | null
        }
        Update: {
          container_key?: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          display_config?: Json | null
          display_order?: number | null
          format_config?: Json | null
          function_key?: string | null
          id?: string
          is_core?: boolean | null
          is_deletable?: boolean | null
          is_enabled?: boolean | null
          name?: string
          render_schema?: Json | null
          style_config?: Json | null
          subscribes_to?: string[] | null
          target_actors?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_containers_function_key_fkey"
            columns: ["function_key"]
            isOneToOne: false
            referencedRelation: "chat_functions"
            referencedColumns: ["function_key"]
          },
        ]
      }
      chat_folders: {
        Row: {
          chat_id: string
          folder_id: string
        }
        Insert: {
          chat_id: string
          folder_id: string
        }
        Update: {
          chat_id?: string
          folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_folders_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_functions: {
        Row: {
          category: string
          code_path: string | null
          cosmo_priority: number | null
          created_at: string | null
          depends_on: string[] | null
          description: string | null
          display_order: number | null
          events_emitted: string[] | null
          function_key: string
          id: string
          input_schema: Json | null
          is_core: boolean | null
          is_enabled: boolean | null
          name: string
          output_format: string | null
          output_schema: Json | null
          requires_context: string[] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          code_path?: string | null
          cosmo_priority?: number | null
          created_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          display_order?: number | null
          events_emitted?: string[] | null
          function_key: string
          id?: string
          input_schema?: Json | null
          is_core?: boolean | null
          is_enabled?: boolean | null
          name: string
          output_format?: string | null
          output_schema?: Json | null
          requires_context?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code_path?: string | null
          cosmo_priority?: number | null
          created_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          display_order?: number | null
          events_emitted?: string[] | null
          function_key?: string
          id?: string
          input_schema?: Json | null
          is_core?: boolean | null
          is_enabled?: boolean | null
          name?: string
          output_format?: string | null
          output_schema?: Json | null
          requires_context?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          model: string
          persona_id: string | null
          shared_with: Json | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model: string
          persona_id?: string | null
          shared_with?: Json | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          persona_id?: string | null
          shared_with?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_job_results: {
        Row: {
          deleted_count: number | null
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          job_name: string
          orphan_count: number | null
          run_at: string | null
          success: boolean
          total_records_checked: number | null
          updated_messages: number | null
        }
        Insert: {
          deleted_count?: number | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          orphan_count?: number | null
          run_at?: string | null
          success?: boolean
          total_records_checked?: number | null
          updated_messages?: number | null
        }
        Update: {
          deleted_count?: number | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          orphan_count?: number | null
          run_at?: string | null
          success?: boolean
          total_records_checked?: number | null
          updated_messages?: number | null
        }
        Relationships: []
      }
      cosmo_action_mappings: {
        Row: {
          action_config: Json | null
          action_key: string
          action_type: string
          conditions: Json | null
          created_at: string | null
          id: string
          intent_key: string
          is_active: boolean | null
          parameter_patterns: Json | null
          priority: number | null
          required_context: string[] | null
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_key: string
          action_type: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          intent_key: string
          is_active?: boolean | null
          parameter_patterns?: Json | null
          priority?: number | null
          required_context?: string[] | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_key?: string
          action_type?: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          intent_key?: string
          is_active?: boolean | null
          parameter_patterns?: Json | null
          priority?: number | null
          required_context?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cosmo_cost_tracking: {
        Row: {
          actual_cost: number | null
          api_calls_saved: number | null
          batch_tokens_saved: number | null
          batched_requests: number | null
          batching_savings: number | null
          context_reuse_savings: number | null
          created_at: string | null
          failed_requests: number | null
          id: string
          model_costs: Json | null
          period_end: string
          period_start: string
          period_type: string
          routing_savings: number | null
          successful_requests: number | null
          theoretical_cost: number | null
          total_completion_tokens: number | null
          total_prompt_tokens: number | null
          total_requests: number | null
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          api_calls_saved?: number | null
          batch_tokens_saved?: number | null
          batched_requests?: number | null
          batching_savings?: number | null
          context_reuse_savings?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          model_costs?: Json | null
          period_end: string
          period_start: string
          period_type: string
          routing_savings?: number | null
          successful_requests?: number | null
          theoretical_cost?: number | null
          total_completion_tokens?: number | null
          total_prompt_tokens?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          api_calls_saved?: number | null
          batch_tokens_saved?: number | null
          batched_requests?: number | null
          batching_savings?: number | null
          context_reuse_savings?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          model_costs?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          routing_savings?: number | null
          successful_requests?: number | null
          theoretical_cost?: number | null
          total_completion_tokens?: number | null
          total_prompt_tokens?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cosmo_debug_logs: {
        Row: {
          ai_instructions: string | null
          api_request_body: Json | null
          api_response_headers: Json | null
          auto_select_enabled: boolean | null
          chat_id: string | null
          completion_tokens: number | null
          context_sources: Json | null
          cost: number | null
          created_at: string | null
          detected_intent: string | null
          error_message: string | null
          fallback_used: boolean | null
          full_system_prompt: string | null
          id: string
          intent_patterns: string[] | null
          model_config: Json | null
          model_provider: string | null
          openrouter_request_id: string | null
          operation_type: string | null
          original_message: string
          persona_prompt: string | null
          prompt_tokens: number | null
          requested_model: string | null
          response_time_ms: number | null
          selected_model: string | null
          success: boolean | null
          system_prompt_preview: string | null
          tiers_attempted: Json | null
          total_tokens: number | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          ai_instructions?: string | null
          api_request_body?: Json | null
          api_response_headers?: Json | null
          auto_select_enabled?: boolean | null
          chat_id?: string | null
          completion_tokens?: number | null
          context_sources?: Json | null
          cost?: number | null
          created_at?: string | null
          detected_intent?: string | null
          error_message?: string | null
          fallback_used?: boolean | null
          full_system_prompt?: string | null
          id?: string
          intent_patterns?: string[] | null
          model_config?: Json | null
          model_provider?: string | null
          openrouter_request_id?: string | null
          operation_type?: string | null
          original_message: string
          persona_prompt?: string | null
          prompt_tokens?: number | null
          requested_model?: string | null
          response_time_ms?: number | null
          selected_model?: string | null
          success?: boolean | null
          system_prompt_preview?: string | null
          tiers_attempted?: Json | null
          total_tokens?: number | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          ai_instructions?: string | null
          api_request_body?: Json | null
          api_response_headers?: Json | null
          auto_select_enabled?: boolean | null
          chat_id?: string | null
          completion_tokens?: number | null
          context_sources?: Json | null
          cost?: number | null
          created_at?: string | null
          detected_intent?: string | null
          error_message?: string | null
          fallback_used?: boolean | null
          full_system_prompt?: string | null
          id?: string
          intent_patterns?: string[] | null
          model_config?: Json | null
          model_provider?: string | null
          openrouter_request_id?: string | null
          operation_type?: string | null
          original_message?: string
          persona_prompt?: string | null
          prompt_tokens?: number | null
          requested_model?: string | null
          response_time_ms?: number | null
          selected_model?: string | null
          success?: boolean | null
          system_prompt_preview?: string | null
          tiers_attempted?: Json | null
          total_tokens?: number | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmo_debug_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmo_debug_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cosmo_debug_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cosmo_debug_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cosmo_debug_logs_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmo_function_chains: {
        Row: {
          chain_key: string
          created_at: string | null
          description: string | null
          display_name: string
          fallback_chain_id: string | null
          function_sequence: Json
          id: string
          is_active: boolean | null
          trigger_intents: string[] | null
          updated_at: string | null
        }
        Insert: {
          chain_key: string
          created_at?: string | null
          description?: string | null
          display_name: string
          fallback_chain_id?: string | null
          function_sequence?: Json
          id?: string
          is_active?: boolean | null
          trigger_intents?: string[] | null
          updated_at?: string | null
        }
        Update: {
          chain_key?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          fallback_chain_id?: string | null
          function_sequence?: Json
          id?: string
          is_active?: boolean | null
          trigger_intents?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmo_function_chains_fallback_chain_id_fkey"
            columns: ["fallback_chain_id"]
            isOneToOne: false
            referencedRelation: "cosmo_function_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmo_intents: {
        Row: {
          category: string
          context_needs: string[] | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          intent_key: string
          is_active: boolean | null
          keywords: string[] | null
          preferred_models: string[] | null
          priority: number | null
          required_functions: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          context_needs?: string[] | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          intent_key: string
          is_active?: boolean | null
          keywords?: string[] | null
          preferred_models?: string[] | null
          priority?: number | null
          required_functions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          context_needs?: string[] | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          intent_key?: string
          is_active?: boolean | null
          keywords?: string[] | null
          preferred_models?: string[] | null
          priority?: number | null
          required_functions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cosmo_request_batches: {
        Row: {
          api_calls_saved: number | null
          combined_prompt: string | null
          combined_response: string | null
          created_at: string
          error_message: string | null
          id: string
          model_used: string | null
          processed_at: string | null
          request_ids: string[]
          request_type: string
          response_map: Json | null
          similarity_hash: string
          status: string
          tokens_saved: number | null
          window_expires_at: string
        }
        Insert: {
          api_calls_saved?: number | null
          combined_prompt?: string | null
          combined_response?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          model_used?: string | null
          processed_at?: string | null
          request_ids?: string[]
          request_type: string
          response_map?: Json | null
          similarity_hash: string
          status?: string
          tokens_saved?: number | null
          window_expires_at: string
        }
        Update: {
          api_calls_saved?: number | null
          combined_prompt?: string | null
          combined_response?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          model_used?: string | null
          processed_at?: string | null
          request_ids?: string[]
          request_type?: string
          response_map?: Json | null
          similarity_hash?: string
          status?: string
          tokens_saved?: number | null
          window_expires_at?: string
        }
        Relationships: []
      }
      cosmo_request_queue: {
        Row: {
          batch_id: string | null
          callback_url: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          max_retries: number | null
          priority: Database["public"]["Enums"]["cosmo_queue_priority"]
          priority_score: number
          processing_node: string | null
          request_payload: Json
          request_type: string
          result_payload: Json | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["cosmo_queue_status"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          batch_id?: string | null
          callback_url?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_retries?: number | null
          priority?: Database["public"]["Enums"]["cosmo_queue_priority"]
          priority_score?: number
          processing_node?: string | null
          request_payload: Json
          request_type?: string
          result_payload?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cosmo_queue_status"]
          user_id: string
          workspace_id: string
        }
        Update: {
          batch_id?: string | null
          callback_url?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_retries?: number | null
          priority?: Database["public"]["Enums"]["cosmo_queue_priority"]
          priority_score?: number
          processing_node?: string | null
          request_payload?: Json
          request_type?: string
          result_payload?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cosmo_queue_status"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmo_request_queue_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "cosmo_request_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmo_request_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          bonus_credits: number | null
          created_at: string | null
          credit_type: string
          credits_amount: number
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price_usd: number
          updated_at: string | null
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string | null
          credit_type: string
          credits_amount: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_usd: number
          updated_at?: string | null
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string | null
          credit_type?: string
          credits_amount?: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          credit_type: string | null
          credits_purchased: number
          credits_remaining: number
          currency: string | null
          discount_amount: number | null
          discount_code: string | null
          expires_at: string | null
          external_transaction_id: string | null
          id: string
          package_id: string | null
          payment_processor:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          credit_type?: string | null
          credits_purchased: number
          credits_remaining: number
          currency?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          expires_at?: string | null
          external_transaction_id?: string | null
          id?: string
          package_id?: string | null
          payment_processor?:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          credit_type?: string | null
          credits_purchased?: number
          credits_remaining?: number
          currency?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          expires_at?: string | null
          external_transaction_id?: string | null
          id?: string
          package_id?: string | null
          payment_processor?:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          recipient_email: string
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          recipient_email: string
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          recipient_email?: string
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "email_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_providers: {
        Row: {
          api_endpoint: string | null
          config_schema: Json | null
          config_values: Json | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          provider_type: string
          sdk_package: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          config_schema?: Json | null
          config_values?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          provider_type: string
          sdk_package?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          config_schema?: Json | null
          config_values?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          provider_type?: string
          sdk_package?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_rule_logs: {
        Row: {
          error_message: string | null
          event_id: string | null
          event_payload: Json | null
          event_type: string
          id: string
          processing_time_ms: number | null
          recipient_email: string
          rule_id: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          triggered_at: string | null
        }
        Insert: {
          error_message?: string | null
          event_id?: string | null
          event_payload?: Json | null
          event_type: string
          id?: string
          processing_time_ms?: number | null
          recipient_email: string
          rule_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          triggered_at?: string | null
        }
        Update: {
          error_message?: string | null
          event_id?: string | null
          event_payload?: Json | null
          event_type?: string
          id?: string
          processing_time_ms?: number | null
          recipient_email?: string
          rule_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_rule_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "email_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rule_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rules: {
        Row: {
          bcc_emails: string[] | null
          cc_emails: string[] | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          deduplicate_window_minutes: number | null
          delay_minutes: number | null
          description: string | null
          event_type: string
          failure_count: number | null
          id: string
          last_triggered_at: string | null
          max_sends_per_user_per_day: number | null
          max_sends_per_user_per_week: number | null
          name: string
          priority: number | null
          recipient_emails: string[] | null
          recipient_type: string
          send_immediately: boolean | null
          status: string
          success_count: number | null
          template_id: string | null
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          deduplicate_window_minutes?: number | null
          delay_minutes?: number | null
          description?: string | null
          event_type: string
          failure_count?: number | null
          id?: string
          last_triggered_at?: string | null
          max_sends_per_user_per_day?: number | null
          max_sends_per_user_per_week?: number | null
          name: string
          priority?: number | null
          recipient_emails?: string[] | null
          recipient_type?: string
          send_immediately?: boolean | null
          status?: string
          success_count?: number | null
          template_id?: string | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          deduplicate_window_minutes?: number | null
          delay_minutes?: number | null
          description?: string | null
          event_type?: string
          failure_count?: number | null
          id?: string
          last_triggered_at?: string | null
          max_sends_per_user_per_day?: number | null
          max_sends_per_user_per_week?: number | null
          name?: string
          priority?: number | null
          recipient_emails?: string[] | null
          recipient_type?: string
          send_immediately?: boolean | null
          status?: string
          success_count?: number | null
          template_id?: string | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_system_event_types: {
        Row: {
          available_variables: Json | null
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          event_type: string
          is_critical: boolean | null
        }
        Insert: {
          available_variables?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          event_type: string
          is_critical?: boolean | null
        }
        Update: {
          available_variables?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          event_type?: string
          is_critical?: boolean | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          name: string
          slug: string
          status: string
          subject_template: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
          version: number | null
          version_history: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          name: string
          slug: string
          status?: string
          subject_template: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
          version_history?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          subject_template?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
          version_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      external_providers: {
        Row: {
          auth_type: string
          category: string
          created_at: string | null
          description: string | null
          documentation_url: string | null
          icon_url: string | null
          id: string
          is_enabled: boolean | null
          name: string
          oauth_authorize_url: string | null
          oauth_client_id_secret_id: string | null
          oauth_client_secret_secret_id: string | null
          oauth_scopes: string[] | null
          oauth_token_url: string | null
          provider_key: string
          updated_at: string | null
        }
        Insert: {
          auth_type: string
          category: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          oauth_authorize_url?: string | null
          oauth_client_id_secret_id?: string | null
          oauth_client_secret_secret_id?: string | null
          oauth_scopes?: string[] | null
          oauth_token_url?: string | null
          provider_key: string
          updated_at?: string | null
        }
        Update: {
          auth_type?: string
          category?: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          oauth_authorize_url?: string | null
          oauth_client_id_secret_id?: string | null
          oauth_client_secret_secret_id?: string | null
          oauth_scopes?: string[] | null
          oauth_token_url?: string | null
          provider_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fallback_models: {
        Row: {
          best_for: Database["public"]["Enums"]["model_category"]
          best_for_description: string | null
          context_length: number | null
          created_at: string | null
          default_frequency_penalty: number | null
          default_max_tokens: number | null
          default_presence_penalty: number | null
          default_temperature: number | null
          default_top_k: number | null
          default_top_p: number | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          input_modalities: Json | null
          is_active: boolean | null
          is_default: boolean | null
          is_free: boolean | null
          max_completion_tokens: number | null
          model_id: string
          name: string
          output_modalities: Json | null
          pricing_completion: number | null
          pricing_prompt: number | null
          provider: string
          rate_limit_rpm: number | null
          rate_limit_tpm: number | null
          requires_api_key: boolean | null
          skip_temperature: boolean | null
          supported_parameters: Json | null
          updated_at: string | null
        }
        Insert: {
          best_for?: Database["public"]["Enums"]["model_category"]
          best_for_description?: string | null
          context_length?: number | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          input_modalities?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_free?: boolean | null
          max_completion_tokens?: number | null
          model_id: string
          name: string
          output_modalities?: Json | null
          pricing_completion?: number | null
          pricing_prompt?: number | null
          provider?: string
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          requires_api_key?: boolean | null
          skip_temperature?: boolean | null
          supported_parameters?: Json | null
          updated_at?: string | null
        }
        Update: {
          best_for?: Database["public"]["Enums"]["model_category"]
          best_for_description?: string | null
          context_length?: number | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          input_modalities?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_free?: boolean | null
          max_completion_tokens?: number | null
          model_id?: string
          name?: string
          output_modalities?: Json | null
          pricing_completion?: number | null
          pricing_prompt?: number | null
          provider?: string
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          requires_api_key?: boolean | null
          skip_temperature?: boolean | null
          supported_parameters?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      file_folders: {
        Row: {
          color: string | null
          created_at: string | null
          folder_type: string | null
          id: string
          is_system_folder: boolean | null
          name: string
          owner_type: string | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          folder_type?: string | null
          id?: string
          is_system_folder?: boolean | null
          name: string
          owner_type?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          folder_type?: string | null
          id?: string
          is_system_folder?: boolean | null
          name?: string
          owner_type?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          metadata: Json | null
          model: string
          prompt: string
          url: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          model: string
          prompt: string
          url: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          model?: string
          prompt?: string
          url?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_usage_log: {
        Row: {
          app_item_id: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          operation: string
          provider_key: string
          response_time_ms: number | null
          success: boolean | null
          user_integration_id: string | null
          workspace_integration_id: string | null
        }
        Insert: {
          app_item_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          operation: string
          provider_key: string
          response_time_ms?: number | null
          success?: boolean | null
          user_integration_id?: string | null
          workspace_integration_id?: string | null
        }
        Update: {
          app_item_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          provider_key?: string
          response_time_ms?: number | null
          success?: boolean | null
          user_integration_id?: string | null
          workspace_integration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_usage_log_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_usage_log_workspace_integration_id_fkey"
            columns: ["workspace_integration_id"]
            isOneToOne: false
            referencedRelation: "workspace_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          chunks: Json | null
          content: string
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          storage_path: string
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          chunks?: Json | null
          content: string
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          storage_path: string
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          chunks?: Json | null
          content?: string
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          storage_path?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          cosmo_selected: boolean | null
          created_at: string
          detected_category: string | null
          id: string
          model: string | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          chat_id: string
          content: string
          cosmo_selected?: boolean | null
          created_at?: string
          detected_category?: string | null
          id?: string
          model?: string | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          chat_id?: string
          content?: string
          cosmo_selected?: boolean | null
          created_at?: string
          detected_category?: string | null
          id?: string
          model?: string | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          app_item_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          provider_key: string
          redirect_uri: string
          scopes: string[] | null
          state_token: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          app_item_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          provider_key: string
          redirect_uri: string
          scopes?: string[] | null
          state_token: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          app_item_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          provider_key?: string
          redirect_uri?: string
          scopes?: string[] | null
          state_token?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_processors: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          processor_type: Database["public"]["Enums"]["payment_processor_enum"]
          supports_one_time_payments: boolean | null
          supports_subscriptions: boolean | null
          supports_webhooks: boolean | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          processor_type: Database["public"]["Enums"]["payment_processor_enum"]
          supports_one_time_payments?: boolean | null
          supports_subscriptions?: boolean | null
          supports_webhooks?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          processor_type?: Database["public"]["Enums"]["payment_processor_enum"]
          supports_one_time_payments?: boolean | null
          supports_subscriptions?: boolean | null
          supports_webhooks?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      persona_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      persona_templates: {
        Row: {
          category_id: string | null
          color_code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default_for_spaces: boolean | null
          is_default_for_users: boolean | null
          is_featured: boolean | null
          name: string
          system_prompt: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category_id?: string | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default_for_spaces?: boolean | null
          is_default_for_users?: boolean | null
          is_featured?: boolean | null
          name: string
          system_prompt: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category_id?: string | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default_for_spaces?: boolean | null
          is_default_for_users?: boolean | null
          is_featured?: boolean | null
          name?: string
          system_prompt?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "persona_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean
          name: string
          system_prompt: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          system_prompt: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          system_prompt?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          created_at: string | null
          id: string
          monthly_chat_tokens: number | null
          monthly_cost_limit: number | null
          monthly_document_parses: number | null
          monthly_image_generations: number | null
          monthly_video_generations: number | null
          price_per_month: number | null
          tier_name: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_chat_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_document_parses?: number | null
          monthly_image_generations?: number | null
          monthly_video_generations?: number | null
          price_per_month?: number | null
          tier_name: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_chat_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_document_parses?: number | null
          monthly_image_generations?: number | null
          monthly_video_generations?: number | null
          price_per_month?: number | null
          tier_name?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_analysis_reports: {
        Row: {
          analysis_type: string
          completed_at: string | null
          created_at: string
          current_phase_name: string | null
          files_analyzed: number | null
          id: string
          model_used: string | null
          phase_details: Json | null
          phases_completed: number
          phases_total: number
          recommendations: Json | null
          status: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          completed_at?: string | null
          created_at?: string
          current_phase_name?: string | null
          files_analyzed?: number | null
          id?: string
          model_used?: string | null
          phase_details?: Json | null
          phases_completed?: number
          phases_total?: number
          recommendations?: Json | null
          status?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          completed_at?: string | null
          created_at?: string
          current_phase_name?: string | null
          files_analyzed?: number | null
          id?: string
          model_used?: string | null
          phase_details?: Json | null
          phases_completed?: number
          phases_total?: number
          recommendations?: Json | null
          status?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_analysis_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_analysis_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category_id: string | null
          color_code: string | null
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_mode: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default_for_spaces: boolean | null
          is_default_for_users: boolean | null
          is_featured: boolean | null
          skill_level: string | null
          title: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category_id?: string | null
          color_code?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default_for_spaces?: boolean | null
          is_default_for_users?: boolean | null
          is_featured?: boolean | null
          skill_level?: string | null
          title: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category_id?: string | null
          color_code?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default_for_spaces?: boolean | null
          is_default_for_users?: boolean | null
          is_featured?: boolean | null
          skill_level?: string | null
          title?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prompt_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          title: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          job_name: string
          last_run_at: string | null
          last_run_success: boolean | null
          request_body: Json | null
          schedule_description: string | null
          schedule_expression: string
          target_function: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_name: string
          last_run_at?: string | null
          last_run_success?: boolean | null
          request_body?: Json | null
          schedule_description?: string | null
          schedule_expression: string
          target_function: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_name?: string
          last_run_at?: string | null
          last_run_success?: boolean | null
          request_body?: Json | null
          schedule_description?: string | null
          schedule_expression?: string
          target_function?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      space_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      space_chat_messages: {
        Row: {
          chat_id: string
          content: string
          cosmo_selected: boolean | null
          created_at: string | null
          detected_category: string | null
          id: string
          model: string | null
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          chat_id: string
          content: string
          cosmo_selected?: boolean | null
          created_at?: string | null
          detected_category?: string | null
          id?: string
          model?: string | null
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          cosmo_selected?: boolean | null
          created_at?: string | null
          detected_category?: string | null
          id?: string
          model?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "space_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      space_chats: {
        Row: {
          created_at: string | null
          id: string
          model: string | null
          persona_id: string | null
          space_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model?: string | null
          persona_id?: string | null
          space_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model?: string | null
          persona_id?: string | null
          space_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_chats_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "space_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_chats_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_chats_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_chats_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      space_folders: {
        Row: {
          color_code: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      space_personas: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          space_id: string
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          space_id: string
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          space_id?: string
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_personas_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          space_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          space_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          space_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_prompts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          space_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          space_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          space_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_tasks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_templates: {
        Row: {
          ai_instructions: string | null
          ai_model: string | null
          category_id: string | null
          color_code: string | null
          compliance_rule: string | null
          created_at: string | null
          created_by: string | null
          default_personas: Json | null
          default_prompts: Json | null
          description: string | null
          display_mode: string | null
          file_quota_mb: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_model?: string | null
          category_id?: string | null
          color_code?: string | null
          compliance_rule?: string | null
          created_at?: string | null
          created_by?: string | null
          default_personas?: Json | null
          default_prompts?: Json | null
          description?: string | null
          display_mode?: string | null
          file_quota_mb?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          ai_instructions?: string | null
          ai_model?: string | null
          category_id?: string | null
          color_code?: string | null
          compliance_rule?: string | null
          created_at?: string | null
          created_by?: string | null
          default_personas?: Json | null
          default_prompts?: Json | null
          description?: string | null
          display_mode?: string | null
          file_quota_mb?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "space_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "space_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_project_files: {
        Row: {
          content: string | null
          created_at: string | null
          file_path: string
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spork_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spork_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_projects: {
        Row: {
          ai_instructions: string | null
          codesandbox_api_key: string | null
          created_at: string | null
          created_by_system_user: string | null
          current_branch: string | null
          default_model: string | null
          description: string | null
          github_branch: string | null
          github_repo_url: string | null
          github_token: string | null
          id: string
          is_active: boolean | null
          is_system_owned: boolean | null
          is_system_sandbox: boolean | null
          last_synced_at: string | null
          name: string
          project_type: Database["public"]["Enums"]["spork_project_type"] | null
          source_tool_id: string | null
          supabase_anon_key: string | null
          supabase_service_role_key: string | null
          supabase_url: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          ai_instructions?: string | null
          codesandbox_api_key?: string | null
          created_at?: string | null
          created_by_system_user?: string | null
          current_branch?: string | null
          default_model?: string | null
          description?: string | null
          github_branch?: string | null
          github_repo_url?: string | null
          github_token?: string | null
          id?: string
          is_active?: boolean | null
          is_system_owned?: boolean | null
          is_system_sandbox?: boolean | null
          last_synced_at?: string | null
          name: string
          project_type?:
            | Database["public"]["Enums"]["spork_project_type"]
            | null
          source_tool_id?: string | null
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          ai_instructions?: string | null
          codesandbox_api_key?: string | null
          created_at?: string | null
          created_by_system_user?: string | null
          current_branch?: string | null
          default_model?: string | null
          description?: string | null
          github_branch?: string | null
          github_repo_url?: string | null
          github_token?: string | null
          id?: string
          is_active?: boolean | null
          is_system_owned?: boolean | null
          is_system_sandbox?: boolean | null
          last_synced_at?: string | null
          name?: string
          project_type?:
            | Database["public"]["Enums"]["spork_project_type"]
            | null
          source_tool_id?: string | null
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spork_projects_created_by_system_user_fkey"
            columns: ["created_by_system_user"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_projects_source_tool_id_fkey"
            columns: ["source_tool_id"]
            isOneToOne: false
            referencedRelation: "spork_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_tool_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spork_tool_files: {
        Row: {
          content: string
          created_at: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          is_entry_point: boolean | null
          tool_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          is_entry_point?: boolean | null
          tool_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          is_entry_point?: boolean | null
          tool_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spork_tool_files_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "spork_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_tool_installations: {
        Row: {
          config_values: Json | null
          id: string
          install_context: string
          installed_at: string | null
          installed_by: string
          installed_version: string
          is_enabled: boolean | null
          tool_id: string
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          config_values?: Json | null
          id?: string
          install_context?: string
          installed_at?: string | null
          installed_by: string
          installed_version: string
          is_enabled?: boolean | null
          tool_id: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          config_values?: Json | null
          id?: string
          install_context?: string
          installed_at?: string | null
          installed_by?: string
          installed_version?: string
          is_enabled?: boolean | null
          tool_id?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spork_tool_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_installations_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "spork_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_installations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_installations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_installations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_tool_versions: {
        Row: {
          changelog: string | null
          files_snapshot: Json
          id: string
          manifest_snapshot: Json
          published_at: string | null
          published_by: string | null
          tool_id: string
          version: string
        }
        Insert: {
          changelog?: string | null
          files_snapshot?: Json
          id?: string
          manifest_snapshot?: Json
          published_at?: string | null
          published_by?: string | null
          tool_id: string
          version: string
        }
        Update: {
          changelog?: string | null
          files_snapshot?: Json
          id?: string
          manifest_snapshot?: Json
          published_at?: string | null
          published_by?: string | null
          tool_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "spork_tool_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tool_versions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "spork_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      spork_tools: {
        Row: {
          category: string | null
          color_code: string | null
          config_schema: Json | null
          created_at: string | null
          creator_id: string
          current_version: string | null
          description: string | null
          display_mode: string | null
          icon: string | null
          id: string
          image_url: string | null
          install_count: number | null
          is_featured: boolean | null
          name: string
          permissions: Json | null
          project_id: string
          screenshots: Json | null
          slug: string
          status: Database["public"]["Enums"]["spork_tool_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color_code?: string | null
          config_schema?: Json | null
          created_at?: string | null
          creator_id: string
          current_version?: string | null
          description?: string | null
          display_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          install_count?: number | null
          is_featured?: boolean | null
          name: string
          permissions?: Json | null
          project_id: string
          screenshots?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["spork_tool_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color_code?: string | null
          config_schema?: Json | null
          created_at?: string | null
          creator_id?: string
          current_version?: string | null
          description?: string | null
          display_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          install_count?: number | null
          is_featured?: boolean | null
          name?: string
          permissions?: Json | null
          project_id?: string
          screenshots?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["spork_tool_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spork_tools_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tools_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spork_tools_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spork_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          allowed_models: Json | null
          created_at: string | null
          credit_price_per_unit: number | null
          daily_image_limit: number | null
          daily_token_input_limit: number | null
          daily_token_output_limit: number | null
          daily_video_limit: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          monthly_document_parsing_quota: number | null
          monthly_file_storage_quota_mb: number | null
          monthly_image_quota: number | null
          monthly_price: number | null
          monthly_token_input_quota: number | null
          monthly_token_output_quota: number | null
          monthly_video_quota: number | null
          name: string
          tier_type: Database["public"]["Enums"]["tier_type_enum"]
          trial_duration_days: number | null
          trial_usage_based: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_models?: Json | null
          created_at?: string | null
          credit_price_per_unit?: number | null
          daily_image_limit?: number | null
          daily_token_input_limit?: number | null
          daily_token_output_limit?: number | null
          daily_video_limit?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          monthly_document_parsing_quota?: number | null
          monthly_file_storage_quota_mb?: number | null
          monthly_image_quota?: number | null
          monthly_price?: number | null
          monthly_token_input_quota?: number | null
          monthly_token_output_quota?: number | null
          monthly_video_quota?: number | null
          name: string
          tier_type: Database["public"]["Enums"]["tier_type_enum"]
          trial_duration_days?: number | null
          trial_usage_based?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_models?: Json | null
          created_at?: string | null
          credit_price_per_unit?: number | null
          daily_image_limit?: number | null
          daily_token_input_limit?: number | null
          daily_token_output_limit?: number | null
          daily_video_limit?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          monthly_document_parsing_quota?: number | null
          monthly_file_storage_quota_mb?: number | null
          monthly_image_quota?: number | null
          monthly_price?: number | null
          monthly_token_input_quota?: number | null
          monthly_token_output_quota?: number | null
          monthly_video_quota?: number | null
          name?: string
          tier_type?: Database["public"]["Enums"]["tier_type_enum"]
          trial_duration_days?: number | null
          trial_usage_based?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          details: Json | null
          direction: string
          id: string
          sql_executed: string | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          direction: string
          id?: string
          sql_executed?: string | null
          status?: string
          sync_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          direction?: string
          id?: string
          sql_executed?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      system_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          system_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          system_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          system_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_audit_log_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      system_user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_key: string
          system_user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_key: string
          system_user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_key?: string
          system_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_user_permissions_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["system_role"]
          system_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["system_role"]
          system_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          system_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_user_roles_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity_at: string | null
          session_token: string
          system_user_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string | null
          session_token: string
          system_user_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string | null
          session_token?: string
          system_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_user_sessions_system_user_id_fkey"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_users: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          linked_web_user_id: string | null
          locked_until: string | null
          password_hash: string
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          linked_web_user_id?: string | null
          locked_until?: string | null
          password_hash: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          linked_web_user_id?: string | null
          locked_until?: string | null
          password_hash?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_runs: {
        Row: {
          branch: string | null
          commit_message: string | null
          commit_sha: string | null
          completed_at: string | null
          coverage_branches: number | null
          coverage_details: Json | null
          coverage_functions: number | null
          coverage_lines: number | null
          coverage_statements: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          failed: number | null
          failed_tests: Json | null
          id: string
          passed: number | null
          run_id: string
          skipped: number | null
          started_at: string | null
          status: string | null
          total_tests: number | null
          triggered_by: string | null
        }
        Insert: {
          branch?: string | null
          commit_message?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          coverage_branches?: number | null
          coverage_details?: Json | null
          coverage_functions?: number | null
          coverage_lines?: number | null
          coverage_statements?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          failed?: number | null
          failed_tests?: Json | null
          id?: string
          passed?: number | null
          run_id: string
          skipped?: number | null
          started_at?: string | null
          status?: string | null
          total_tests?: number | null
          triggered_by?: string | null
        }
        Update: {
          branch?: string | null
          commit_message?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          coverage_branches?: number | null
          coverage_details?: Json | null
          coverage_functions?: number | null
          coverage_lines?: number | null
          coverage_statements?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          failed?: number | null
          failed_tests?: Json | null
          id?: string
          passed?: number | null
          run_id?: string
          skipped?: number | null
          started_at?: string | null
          status?: string | null
          total_tests?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id: string
          model_used: string | null
          openrouter_generation_id: string | null
          request_id: string | null
          response_time_ms: number | null
          subscription_id: string | null
          tokens_input: number | null
          tokens_output: number | null
          tokens_reasoning: number | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          model_used?: string | null
          openrouter_generation_id?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          subscription_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_reasoning?: number | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          model_used?: string | null
          openrouter_generation_id?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          subscription_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_reasoning?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          action: string
          action_type: string | null
          completion_tokens: number | null
          cost: number | null
          created_at: string
          id: string
          metadata: Json | null
          model: string | null
          prompt_tokens: number | null
          tokens_used: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          action_type?: string | null
          completion_tokens?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          tokens_used?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          action_type?: string | null
          completion_tokens?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          tokens_used?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          daily_images_used: number | null
          daily_reset_at: string | null
          daily_tokens_input_used: number | null
          daily_tokens_output_used: number | null
          daily_videos_used: number | null
          documents_parsed: number | null
          documents_quota: number | null
          file_storage_quota_bytes: number | null
          file_storage_used_bytes: number | null
          id: string
          image_credits_remaining: number | null
          images_generated: number | null
          images_quota: number | null
          last_usage_at: string | null
          period_end: string
          period_start: string
          subscription_id: string | null
          token_credits_remaining: number | null
          tokens_input_quota: number | null
          tokens_input_used: number | null
          tokens_output_quota: number | null
          tokens_output_used: number | null
          updated_at: string | null
          user_id: string
          video_credits_remaining: number | null
          videos_generated: number | null
          videos_quota: number | null
        }
        Insert: {
          daily_images_used?: number | null
          daily_reset_at?: string | null
          daily_tokens_input_used?: number | null
          daily_tokens_output_used?: number | null
          daily_videos_used?: number | null
          documents_parsed?: number | null
          documents_quota?: number | null
          file_storage_quota_bytes?: number | null
          file_storage_used_bytes?: number | null
          id?: string
          image_credits_remaining?: number | null
          images_generated?: number | null
          images_quota?: number | null
          last_usage_at?: string | null
          period_end: string
          period_start: string
          subscription_id?: string | null
          token_credits_remaining?: number | null
          tokens_input_quota?: number | null
          tokens_input_used?: number | null
          tokens_output_quota?: number | null
          tokens_output_used?: number | null
          updated_at?: string | null
          user_id: string
          video_credits_remaining?: number | null
          videos_generated?: number | null
          videos_quota?: number | null
        }
        Update: {
          daily_images_used?: number | null
          daily_reset_at?: string | null
          daily_tokens_input_used?: number | null
          daily_tokens_output_used?: number | null
          daily_videos_used?: number | null
          documents_parsed?: number | null
          documents_quota?: number | null
          file_storage_quota_bytes?: number | null
          file_storage_used_bytes?: number | null
          id?: string
          image_credits_remaining?: number | null
          images_generated?: number | null
          images_quota?: number | null
          last_usage_at?: string | null
          period_end?: string
          period_start?: string
          subscription_id?: string | null
          token_credits_remaining?: number | null
          tokens_input_quota?: number | null
          tokens_input_used?: number | null
          tokens_output_quota?: number | null
          tokens_output_used?: number | null
          updated_at?: string | null
          user_id?: string
          video_credits_remaining?: number | null
          videos_generated?: number | null
          videos_quota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          metadata: Json | null
          original_name: string
          storage_path: string
          thumbnail_path: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          original_name: string
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          original_name?: string
          storage_path?: string
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token_secret_id: string | null
          api_key_secret_id: string | null
          created_at: string | null
          error_message: string | null
          external_account_email: string | null
          external_account_id: string | null
          external_account_name: string | null
          id: string
          last_used_at: string | null
          oauth_scopes: string[] | null
          provider_key: string
          refresh_token_secret_id: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_secret_id?: string | null
          api_key_secret_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_account_email?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          id?: string
          last_used_at?: string | null
          oauth_scopes?: string[] | null
          provider_key: string
          refresh_token_secret_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_secret_id?: string | null
          api_key_secret_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_account_email?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          id?: string
          last_used_at?: string | null
          oauth_scopes?: string[] | null
          provider_key?: string
          refresh_token_secret_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "external_providers"
            referencedColumns: ["provider_key"]
          },
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_chat_title: boolean
          created_at: string
          id: string
          message_voice: string | null
          personal_context: string | null
          remember_chat_settings: boolean
          send_ai_model_name: boolean
          send_current_date: boolean
          send_user_name: boolean
          slack_message_style: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_chat_title?: boolean
          created_at?: string
          id?: string
          message_voice?: string | null
          personal_context?: string | null
          remember_chat_settings?: boolean
          send_ai_model_name?: boolean
          send_current_date?: boolean
          send_user_name?: boolean
          slack_message_style?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_chat_title?: boolean
          created_at?: string
          id?: string
          message_voice?: string | null
          personal_context?: string | null
          remember_chat_settings?: boolean
          send_ai_model_name?: boolean
          send_current_date?: boolean
          send_user_name?: boolean
          slack_message_style?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_space_assignments: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          is_pinned: boolean | null
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_space_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "space_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_space_assignments_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          external_subscription_id: string | null
          id: string
          is_trial: boolean | null
          payment_processor:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          status: Database["public"]["Enums"]["subscription_status_enum"] | null
          tier_id: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          is_trial?: boolean | null
          payment_processor?:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          status?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          tier_id: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          is_trial?: boolean | null
          payment_processor?:
            | Database["public"]["Enums"]["payment_processor_enum"]
            | null
          status?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          tier_id?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_activity: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_activity_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          storage_path: string
          updated_at: string | null
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          storage_path: string
          updated_at?: string | null
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_integrations: {
        Row: {
          access_token_secret_id: string | null
          allowed_roles: string[] | null
          api_key_secret_id: string | null
          configured_by: string
          created_at: string | null
          error_message: string | null
          external_workspace_id: string | null
          external_workspace_name: string | null
          id: string
          last_used_at: string | null
          oauth_scopes: string[] | null
          provider_key: string
          refresh_token_secret_id: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          webhook_secret_id: string | null
          workspace_id: string
        }
        Insert: {
          access_token_secret_id?: string | null
          allowed_roles?: string[] | null
          api_key_secret_id?: string | null
          configured_by: string
          created_at?: string | null
          error_message?: string | null
          external_workspace_id?: string | null
          external_workspace_name?: string | null
          id?: string
          last_used_at?: string | null
          oauth_scopes?: string[] | null
          provider_key: string
          refresh_token_secret_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_secret_id?: string | null
          workspace_id: string
        }
        Update: {
          access_token_secret_id?: string | null
          allowed_roles?: string[] | null
          api_key_secret_id?: string | null
          configured_by?: string
          created_at?: string | null
          error_message?: string | null
          external_workspace_id?: string | null
          external_workspace_name?: string | null
          id?: string
          last_used_at?: string | null
          oauth_scopes?: string[] | null
          provider_key?: string
          refresh_token_secret_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_secret_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_configured_by_fkey"
            columns: ["configured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_integrations_configured_by_fkey"
            columns: ["configured_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_integrations_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "external_providers"
            referencedColumns: ["provider_key"]
          },
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          ai_instructions: string | null
          ai_model: string | null
          archived_at: string | null
          color_code: string | null
          compliance_rule: string | null
          created_at: string
          description: string | null
          file_quota_mb: number | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          is_suspended: boolean | null
          last_activity_at: string | null
          name: string
          owner_id: string
          selected_persona_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          suspended_at: string | null
          suspended_by: string | null
          updated_at: string
        }
        Insert: {
          ai_instructions?: string | null
          ai_model?: string | null
          archived_at?: string | null
          color_code?: string | null
          compliance_rule?: string | null
          created_at?: string
          description?: string | null
          file_quota_mb?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_suspended?: boolean | null
          last_activity_at?: string | null
          name: string
          owner_id: string
          selected_persona_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
        }
        Update: {
          ai_instructions?: string | null
          ai_model?: string | null
          archived_at?: string | null
          color_code?: string | null
          compliance_rule?: string | null
          created_at?: string
          description?: string | null
          file_quota_mb?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_suspended?: boolean | null
          last_activity_at?: string | null
          name?: string
          owner_id?: string
          selected_persona_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_selected_persona_id_fkey"
            columns: ["selected_persona_id"]
            isOneToOne: false
            referencedRelation: "space_personas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          account_status:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_oauth_states: { Args: never; Returns: number }
      get_db_functions: {
        Args: never
        Returns: {
          data_type: string
          routine_definition: string
          routine_language: string
          routine_name: string
        }[]
      }
      get_enum_types: {
        Args: never
        Returns: {
          enum_label: string
          type_name: string
        }[]
      }
      get_foreign_keys: {
        Args: never
        Returns: {
          column_name: string
          foreign_column_name: string
          foreign_table_name: string
          table_name: string
        }[]
      }
      get_rls_policies: {
        Args: never
        Returns: {
          cmd: string
          permissive: string
          policy_definition: string
          policyname: string
          qual: string
          roles: string[]
          tablename: string
          with_check: string
        }[]
      }
      get_rls_status: {
        Args: never
        Returns: {
          rls_enabled: boolean
          table_name: string
        }[]
      }
      get_schema_columns: {
        Args: never
        Returns: {
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          table_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { user_uuid: string; workspace_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status_enum: "active" | "cancelled" | "suspended"
      app_role: "admin" | "user"
      content_type: "image" | "video" | "document"
      cosmo_queue_priority: "low" | "normal" | "high" | "critical"
      cosmo_queue_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "expired"
      event_type_enum:
        | "text_generation"
        | "image_generation"
        | "video_generation"
        | "document_parsing"
      model_category:
        | "conversation"
        | "coding"
        | "research"
        | "writing"
        | "image_generation"
        | "image_understanding"
        | "video_understanding"
        | "general"
        | "deep_think"
        | "analysis"
        | "video_generation"
      payment_processor_enum: "stripe" | "paypal"
      spork_project_type: "tool" | "sandbox" | "general"
      spork_tool_status: "draft" | "review" | "published" | "deprecated"
      subscription_status_enum: "active" | "suspended" | "cancelled" | "expired"
      subscription_tier: "free" | "solo" | "team"
      system_role: "super_admin" | "admin" | "editor" | "viewer"
      tier_type_enum: "trial" | "paid"
      workspace_role: "owner" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status_enum: ["active", "cancelled", "suspended"],
      app_role: ["admin", "user"],
      content_type: ["image", "video", "document"],
      cosmo_queue_priority: ["low", "normal", "high", "critical"],
      cosmo_queue_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "expired",
      ],
      event_type_enum: [
        "text_generation",
        "image_generation",
        "video_generation",
        "document_parsing",
      ],
      model_category: [
        "conversation",
        "coding",
        "research",
        "writing",
        "image_generation",
        "image_understanding",
        "video_understanding",
        "general",
        "deep_think",
        "analysis",
        "video_generation",
      ],
      payment_processor_enum: ["stripe", "paypal"],
      spork_project_type: ["tool", "sandbox", "general"],
      spork_tool_status: ["draft", "review", "published", "deprecated"],
      subscription_status_enum: ["active", "suspended", "cancelled", "expired"],
      subscription_tier: ["free", "solo", "team"],
      system_role: ["super_admin", "admin", "editor", "viewer"],
      tier_type_enum: ["trial", "paid"],
      workspace_role: ["owner", "member"],
    },
  },
} as const
