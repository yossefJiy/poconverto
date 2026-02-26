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
          {
            foreignKeyName: "fk_client_contacts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          {
            foreignKeyName: "fk_client_users_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_type: string | null
          avg_profit_margin: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          facebook_ads_manager_url: string | null
          facebook_url: string | null
          google_ads_manager_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_agency_brand: boolean | null
          is_favorite: boolean | null
          is_master_account: boolean
          jiy_commission_percent: number | null
          linkedin_url: string | null
          logo_url: string | null
          modules_enabled: Json | null
          modules_order: Json | null
          name: string
          revenue_model: string
          shopify_email: string | null
          tiktok_url: string | null
          timezone: string
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avg_profit_margin?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_agency_brand?: boolean | null
          is_favorite?: boolean | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          modules_order?: Json | null
          name: string
          revenue_model?: string
          shopify_email?: string | null
          tiktok_url?: string | null
          timezone?: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avg_profit_margin?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_agency_brand?: boolean | null
          is_favorite?: boolean | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          modules_order?: Json | null
          name?: string
          revenue_model?: string
          shopify_email?: string | null
          tiktok_url?: string | null
          timezone?: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      daily_cash_received: {
        Row: {
          amount_reporting: number
          client_id: string
          date: string
          id: string
          integration_id: string
          source: string
          synced_at: string
        }
        Insert: {
          amount_reporting?: number
          client_id: string
          date: string
          id?: string
          integration_id: string
          source?: string
          synced_at?: string
        }
        Update: {
          amount_reporting?: number
          client_id?: string
          date?: string
          id?: string
          integration_id?: string
          source?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_cash_received_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_cash_received_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_cash_received_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_google_shopping_metrics: {
        Row: {
          clicks: number | null
          client_id: string
          conversion_value_reporting: number | null
          conversions: number | null
          cost_reporting: number | null
          date: string
          fetched_at: string
          id: string
          impressions: number | null
          integration_id: string
        }
        Insert: {
          clicks?: number | null
          client_id: string
          conversion_value_reporting?: number | null
          conversions?: number | null
          cost_reporting?: number | null
          date: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id: string
        }
        Update: {
          clicks?: number | null
          client_id?: string
          conversion_value_reporting?: number | null
          conversions?: number | null
          cost_reporting?: number | null
          date?: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_google_shopping_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_google_shopping_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_google_shopping_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_marketing_metrics: {
        Row: {
          account_id: string | null
          breakdown_key: string | null
          campaign_id: string
          campaign_name: string
          clicks: number | null
          client_id: string
          conversion_value_original: number | null
          conversion_value_reporting: number | null
          conversions: number | null
          currency_original: string
          date: string
          fetched_at: string
          id: string
          impressions: number | null
          integration_id: string
          platform: string
          spend_original: number
          spend_reporting: number
        }
        Insert: {
          account_id?: string | null
          breakdown_key?: string | null
          campaign_id: string
          campaign_name: string
          clicks?: number | null
          client_id: string
          conversion_value_original?: number | null
          conversion_value_reporting?: number | null
          conversions?: number | null
          currency_original?: string
          date: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id: string
          platform: string
          spend_original?: number
          spend_reporting?: number
        }
        Update: {
          account_id?: string | null
          breakdown_key?: string | null
          campaign_id?: string
          campaign_name?: string
          clicks?: number | null
          client_id?: string
          conversion_value_original?: number | null
          conversion_value_reporting?: number | null
          conversions?: number | null
          currency_original?: string
          date?: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id?: string
          platform?: string
          spend_original?: number
          spend_reporting?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_marketing_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_marketing_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_marketing_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_offline_revenue: {
        Row: {
          amount_original: number
          amount_reporting: number
          client_id: string
          created_at: string
          currency_original: string | null
          date: string
          id: string
          notes: string | null
          source: string
        }
        Insert: {
          amount_original?: number
          amount_reporting?: number
          client_id: string
          created_at?: string
          currency_original?: string | null
          date: string
          id?: string
          notes?: string | null
          source: string
        }
        Update: {
          amount_original?: number
          amount_reporting?: number
          client_id?: string
          created_at?: string
          currency_original?: string | null
          date?: string
          id?: string
          notes?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_offline_revenue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_search_console_metrics: {
        Row: {
          clicks: number | null
          client_id: string
          ctr: number | null
          date: string
          fetched_at: string
          id: string
          impressions: number | null
          integration_id: string
          position: number | null
        }
        Insert: {
          clicks?: number | null
          client_id: string
          ctr?: number | null
          date: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id: string
          position?: number | null
        }
        Update: {
          clicks?: number | null
          client_id?: string
          ctr?: number | null
          date?: string
          fetched_at?: string
          id?: string
          impressions?: number | null
          integration_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_search_console_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_search_console_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_search_console_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_site_metrics: {
        Row: {
          client_id: string
          currency_original: string | null
          date: string
          discounts: number | null
          fetched_at: string
          gross_sales: number | null
          id: string
          integration_id: string
          net_sales: number | null
          net_sales_reporting: number | null
          orders: number | null
          refunds: number | null
          store_platform: string
        }
        Insert: {
          client_id: string
          currency_original?: string | null
          date: string
          discounts?: number | null
          fetched_at?: string
          gross_sales?: number | null
          id?: string
          integration_id: string
          net_sales?: number | null
          net_sales_reporting?: number | null
          orders?: number | null
          refunds?: number | null
          store_platform: string
        }
        Update: {
          client_id?: string
          currency_original?: string | null
          date?: string
          discounts?: number | null
          fetched_at?: string
          gross_sales?: number | null
          id?: string
          integration_id?: string
          net_sales?: number | null
          net_sales_reporting?: number | null
          orders?: number | null
          refunds?: number | null
          store_platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_site_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_site_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_web_analytics_metrics: {
        Row: {
          client_id: string
          date: string
          ecommerce_events: number | null
          engaged_sessions: number | null
          fetched_at: string
          id: string
          integration_id: string
          sessions: number | null
          users: number | null
        }
        Insert: {
          client_id: string
          date: string
          ecommerce_events?: number | null
          engaged_sessions?: number | null
          fetched_at?: string
          id?: string
          integration_id: string
          sessions?: number | null
          users?: number | null
        }
        Update: {
          client_id?: string
          date?: string
          ecommerce_events?: number | null
          engaged_sessions?: number | null
          fetched_at?: string
          id?: string
          integration_id?: string
          sessions?: number | null
          users?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_web_analytics_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_web_analytics_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_web_analytics_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
          is_connected?: boolean
          last_sync_at?: string | null
          platform?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_integrations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount_original: number
          amount_reporting: number
          client_id: string
          currency_original: string
          id: string
          integration_id: string
          invoice_id: string
          method: string | null
          payment_date: string
          reference: string | null
          synced_at: string
        }
        Insert: {
          amount_original?: number
          amount_reporting?: number
          client_id: string
          currency_original?: string
          id?: string
          integration_id: string
          invoice_id: string
          method?: string | null
          payment_date: string
          reference?: string | null
          synced_at?: string
        }
        Update: {
          amount_original?: number
          amount_reporting?: number
          client_id?: string
          currency_original?: string
          id?: string
          integration_id?: string
          invoice_id?: string
          method?: string | null
          payment_date?: string
          reference?: string | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency_original: string
          customer_name: string | null
          due_date: string | null
          id: string
          integration_id: string | null
          invoice_date: string | null
          invoice_number: string
          issue_date: string
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          subtotal: number
          synced_at: string | null
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total_amount: number
          total_reporting: number | null
          type: string
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_original?: string
          customer_name?: string | null
          due_date?: string | null
          id?: string
          integration_id?: string | null
          invoice_date?: string | null
          invoice_number: string
          issue_date?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          synced_at?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          total_reporting?: number | null
          type?: string
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_original?: string
          customer_name?: string | null
          due_date?: string | null
          id?: string
          integration_id?: string | null
          invoice_date?: string | null
          invoice_number?: string
          issue_date?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          synced_at?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          total_reporting?: number | null
          type?: string
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
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
      sync_runs: {
        Row: {
          client_id: string | null
          date_from: string | null
          date_to: string | null
          error_summary: string | null
          finished_at: string | null
          id: string
          platforms: Json | null
          rows_upserted: number | null
          started_at: string
          status: string
        }
        Insert: {
          client_id?: string | null
          date_from?: string | null
          date_to?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          platforms?: Json | null
          rows_upserted?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          client_id?: string | null
          date_from?: string | null
          date_to?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          platforms?: Json | null
          rows_upserted?: number | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
            foreignKeyName: "fk_integrations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      ai_capability_category:
        | "system"
        | "integrations"
        | "content"
        | "analytics"
        | "tasks"
        | "campaigns"
        | "ecommerce"
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
      ai_capability_category: [
        "system",
        "integrations",
        "content",
        "analytics",
        "tasks",
        "campaigns",
        "ecommerce",
      ],
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
