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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_memory: {
        Row: {
          agent_id: string | null
          client_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          importance: number | null
          memory_type: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          agent_id: string | null
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          result: Json | null
          status: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_type: string
          capabilities: string[] | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          agent_type?: string
          capabilities?: string[] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          agent_type?: string
          capabilities?: string[] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_query_history: {
        Row: {
          action: string
          citations: Json | null
          client_id: string | null
          created_at: string
          created_by: string | null
          estimated_cost: number | null
          executed_actions: Json | null
          id: string
          input_tokens: number | null
          issue_id: string | null
          issue_title: string | null
          model: string
          output_tokens: number | null
          prompt_summary: string | null
          provider: string | null
          response: string | null
        }
        Insert: {
          action: string
          citations?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          executed_actions?: Json | null
          id?: string
          input_tokens?: number | null
          issue_id?: string | null
          issue_title?: string | null
          model: string
          output_tokens?: number | null
          prompt_summary?: string | null
          provider?: string | null
          response?: string | null
        }
        Update: {
          action?: string
          citations?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          executed_actions?: Json | null
          id?: string
          input_tokens?: number | null
          issue_id?: string | null
          issue_title?: string | null
          model?: string
          output_tokens?: number | null
          prompt_summary?: string | null
          provider?: string | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_query_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_query_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "code_health_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          created_at: string
          current_usage: number | null
          id: string
          is_read: boolean | null
          limit_value: number | null
          period_type: string
          sent_via: string | null
          threshold_percent: number | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          client_id?: string | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_read?: boolean | null
          limit_value?: number | null
          period_type: string
          sent_via?: string | null
          threshold_percent?: number | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          client_id?: string | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_read?: boolean | null
          limit_value?: number | null
          period_type?: string
          sent_via?: string | null
          threshold_percent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_limits: {
        Row: {
          allowed_models: string[] | null
          created_at: string
          daily_cost_limit: number | null
          daily_requests_limit: number | null
          default_model: string | null
          id: string
          limit_type: string
          max_input_tokens: number | null
          max_output_tokens: number | null
          monthly_cost_limit: number | null
          monthly_requests_limit: number | null
          premium_models_enabled: boolean | null
          target_id: string | null
          updated_at: string
        }
        Insert: {
          allowed_models?: string[] | null
          created_at?: string
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          default_model?: string | null
          id?: string
          limit_type: string
          max_input_tokens?: number | null
          max_output_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          premium_models_enabled?: boolean | null
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed_models?: string[] | null
          created_at?: string
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          default_model?: string | null
          id?: string
          limit_type?: string
          max_input_tokens?: number | null
          max_output_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          premium_models_enabled?: boolean | null
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          client_id: string
          created_at: string
          data: Json
          id: string
          integration_id: string | null
          metrics: Json
          platform: string
          snapshot_date: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json
          id?: string
          integration_id?: string | null
          metrics?: Json
          platform: string
          snapshot_date?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json
          id?: string
          integration_id?: string | null
          metrics?: Json
          platform?: string
          snapshot_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          notification_preference: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          notification_preference?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          notification_preference?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number | null
          clicks: number | null
          client_id: string
          conversions: number | null
          created_at: string
          description: string | null
          end_date: string | null
          external_id: string | null
          id: string
          impressions: number | null
          name: string
          platform: string
          spent: number | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          clicks?: number | null
          client_id: string
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          name: string
          platform: string
          spent?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          clicks?: number | null
          client_id?: string
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          name?: string
          platform?: string
          spent?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          agent_type: string
          client_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string | null
          has_portal_access: boolean | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          receive_task_updates: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          hours_equivalent: number
          id: string
          is_default: boolean | null
          name: string
          price_per_hour: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          hours_equivalent: number
          id?: string
          is_default?: boolean | null
          name: string
          price_per_hour?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          hours_equivalent?: number
          id?: string
          is_default?: boolean | null
          name?: string
          price_per_hour?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      client_credits: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notify_at_percentage: number | null
          package_id: string | null
          period_end: string
          period_start: string
          show_credits_to_client: boolean | null
          total_credits: number
          updated_at: string | null
          used_credits: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_at_percentage?: number | null
          package_id?: string | null
          period_end?: string
          period_start?: string
          show_credits_to_client?: boolean | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_at_percentage?: number | null
          package_id?: string | null
          period_end?: string
          period_start?: string
          show_credits_to_client?: boolean | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_insights: {
        Row: {
          client_id: string
          created_at: string
          id: string
          insight_type: string
          insights: Json | null
          metrics: Json | null
          period_end: string
          period_start: string
          recommendations: string[] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          insight_type: string
          insights?: Json | null
          metrics?: Json | null
          period_end: string
          period_start: string
          recommendations?: string[] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          insight_type?: string
          insights?: Json | null
          metrics?: Json | null
          period_end?: string
          period_start?: string
          recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_performance_history: {
        Row: {
          client_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          source: string | null
        }
        Insert: {
          client_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          source?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_performance_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_team: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_lead: boolean | null
          role: string | null
          team_member_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          role?: string | null
          team_member_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          role?: string | null
          team_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_team_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_team_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          access_level: string
          client_id: string
          created_at: string
          department: string | null
          id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          client_id: string
          created_at?: string
          department?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_level?: string
          client_id?: string
          created_at?: string
          department?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avg_profit_margin: number | null
          created_at: string
          description: string | null
          facebook_ads_manager_url: string | null
          facebook_url: string | null
          google_ads_manager_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          is_master_account: boolean
          jiy_commission_percent: number | null
          linkedin_url: string | null
          logo_url: string | null
          modules_enabled: Json | null
          name: string
          shopify_email: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avg_profit_margin?: number | null
          created_at?: string
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          name: string
          shopify_email?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avg_profit_margin?: number | null
          created_at?: string
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          name?: string
          shopify_email?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      code_health_issues: {
        Row: {
          category: string
          created_at: string
          description: string | null
          details: Json | null
          detected_at: string
          id: string
          ignore_reason: string | null
          ignored_at: string | null
          ignored_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          ignored_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          ignored_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      code_health_reports: {
        Row: {
          created_at: string
          critical_count: number
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          info_count: number
          issues_data: Json | null
          report_date: string
          total_issues: number
          warning_count: number
        }
        Insert: {
          created_at?: string
          critical_count?: number
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          info_count?: number
          issues_data?: Json | null
          report_date?: string
          total_issues?: number
          warning_count?: number
        }
        Update: {
          created_at?: string
          critical_count?: number
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          info_count?: number
          issues_data?: Json | null
          report_date?: string
          total_issues?: number
          warning_count?: number
        }
        Relationships: []
      }
      credit_alerts: {
        Row: {
          alert_type: string
          client_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
        }
        Insert: {
          alert_type: string
          client_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
        }
        Update: {
          alert_type?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          client_credit_id: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          credits_amount: number
          description: string | null
          id: string
          task_id: string | null
          transaction_type: string
        }
        Insert: {
          client_credit_id?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          credits_amount: number
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type: string
        }
        Update: {
          client_credit_id?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          credits_amount?: number
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_credit_id_fkey"
            columns: ["client_credit_id"]
            isOneToOne: false
            referencedRelation: "client_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          archived_at: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          converted_task_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          converted_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          converted_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          client_id: string
          created_at: string
          encrypted_credentials: string | null
          external_account_id: string | null
          id: string
          is_connected: boolean
          last_sync_at: string | null
          platform: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          encrypted_credentials?: string | null
          external_account_id?: string | null
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          encrypted_credentials?: string | null
          external_account_id?: string | null
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_data: {
        Row: {
          client_id: string
          created_at: string
          data: Json
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_preferences: {
        Row: {
          created_at: string
          id: string
          notify_on_down: boolean
          notify_on_recovery: boolean
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_down?: boolean
          notify_on_recovery?: boolean
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_down?: boolean
          notify_on_recovery?: boolean
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          task_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          task_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string | null
          created_at: string
          details: Json | null
          event_category: string
          event_type: string
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: Json | null
          event_category: string
          event_type: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: Json | null
          event_category?: string
          event_type?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_health_history: {
        Row: {
          alert_sent: boolean | null
          checked_at: string
          created_at: string
          id: string
          latency_ms: number | null
          message: string | null
          service_name: string
          status: string
        }
        Insert: {
          alert_sent?: boolean | null
          checked_at?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          service_name: string
          status: string
        }
        Update: {
          alert_sent?: boolean | null
          checked_at?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      sync_schedules: {
        Row: {
          client_id: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          next_sync_at: string | null
          platform: string | null
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          next_sync_at?: string | null
          platform?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          next_sync_at?: string | null
          platform?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          created_by: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          task_id: string
          url: string
        }
        Insert: {
          attachment_type: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          task_id: string
          url: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          task_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_id: string
          converted_task_id: string | null
          created_at: string | null
          description: string | null
          estimated_credits: number | null
          id: string
          rejection_reason: string | null
          requested_by: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          converted_task_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_credits?: number | null
          id?: string
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          converted_task_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_credits?: number | null
          id?: string
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_shares: {
        Row: {
          client_id: string
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          share_type: string
          shared_at: string
          shared_by: string | null
          task_id: string
        }
        Insert: {
          client_id: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
          task_id: string
        }
        Update: {
          client_id?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_shares_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_shares_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          campaign_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          credits_cost: number | null
          department: string | null
          description: string | null
          due_date: string | null
          duration_minutes: number
          id: string
          notification_email: boolean | null
          notification_email_address: string | null
          notification_phone: string | null
          notification_sms: boolean | null
          priority: string
          recurrence_end_date: string | null
          recurrence_type: string | null
          reminder_at: string | null
          reminder_sent: boolean | null
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          campaign_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          credits_cost?: number | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          notification_email?: boolean | null
          notification_email_address?: string | null
          notification_phone?: string | null
          notification_sms?: boolean | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          campaign_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          credits_cost?: number | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          notification_email?: boolean | null
          notification_email_address?: string | null
          notification_phone?: string | null
          notification_sms?: boolean | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string
          departments: string[]
          email: string | null
          emails: string[] | null
          id: string
          is_active: boolean | null
          name: string
          phones: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          email: string
          id: string
          last_used_at: string
          trusted_until: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          email: string
          id?: string
          last_used_at?: string
          trusted_until: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          email?: string
          id?: string
          last_used_at?: string
          trusted_until?: string
        }
        Relationships: []
      }
      two_factor_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      integrations_safe: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string | null
          is_connected: boolean | null
          last_sync_at: string | null
          platform: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          platform?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          platform?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_expired_trusted_devices: { Args: never; Returns: undefined }
      decrypt_integration_credentials: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      encrypt_integration_credentials: {
        Args: { credentials: Json }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_level: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_event_category: string
          p_event_type: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "agency_manager"
        | "team_manager"
        | "employee"
        | "premium_client"
        | "basic_client"
        | "manager"
        | "department_head"
        | "team_lead"
        | "team_member"
        | "client"
        | "demo"
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
      app_role: [
        "super_admin",
        "admin",
        "agency_manager",
        "team_manager",
        "employee",
        "premium_client",
        "basic_client",
        "manager",
        "department_head",
        "team_lead",
        "team_member",
        "client",
        "demo",
      ],
    },
  },
} as const
