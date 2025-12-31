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
          facebook_url: string | null
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
          facebook_url?: string | null
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
          facebook_url?: string | null
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
          avatar_url: string | null
          created_at: string
          departments: string[]
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
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
        | "admin"
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
        "admin",
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
