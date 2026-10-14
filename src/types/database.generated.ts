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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          display_name: string
          id: string
          onboarded_at: string | null
          role: string | null
          version: number
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          onboarded_at?: string | null
          role?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          onboarded_at?: string | null
          role?: string | null
          version?: number
        }
        Relationships: []
      }
      applications: {
        Row: {
          brief_id: string
          brief_revision: number
          created_at: string
          creator_id: string
          currency: string
          delivery_days: number
          id: string
          note: string
          pipeline: Json
          quote_minor: number
          rights_offer: Json
          state: string
          updated_at: string
          version: number
        }
        Insert: {
          brief_id: string
          brief_revision: number
          created_at?: string
          creator_id: string
          currency: string
          delivery_days: number
          id?: string
          note: string
          pipeline: Json
          quote_minor: number
          rights_offer: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Update: {
          brief_id?: string
          brief_revision?: number
          created_at?: string
          creator_id?: string
          currency?: string
          delivery_days?: number
          id?: string
          note?: string
          pipeline?: Json
          quote_minor?: number
          rights_offer?: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "applications_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          actual_bytes: number | null
          brief_id: string | null
          bucket: string
          checked_at: string | null
          checked_duration_sec: number | null
          checks: Json | null
          created_at: string
          declared_duration_sec: number | null
          engagement_id: string | null
          format: string
          height_px: number | null
          id: string
          kind: string
          max_bytes: number
          mime: string | null
          object_deleted_at: string | null
          owner_id: string
          path: string
          portfolio_item_id: string | null
          purpose: string
          reserved_bytes: number
          sha256: string | null
          state: string
          upload_blocked_until: string | null
          width_px: number | null
        }
        Insert: {
          actual_bytes?: number | null
          brief_id?: string | null
          bucket: string
          checked_at?: string | null
          checked_duration_sec?: number | null
          checks?: Json | null
          created_at?: string
          declared_duration_sec?: number | null
          engagement_id?: string | null
          format: string
          height_px?: number | null
          id?: string
          kind: string
          max_bytes: number
          mime?: string | null
          object_deleted_at?: string | null
          owner_id: string
          path: string
          portfolio_item_id?: string | null
          purpose: string
          reserved_bytes: number
          sha256?: string | null
          state?: string
          upload_blocked_until?: string | null
          width_px?: number | null
        }
        Update: {
          actual_bytes?: number | null
          brief_id?: string | null
          bucket?: string
          checked_at?: string | null
          checked_duration_sec?: number | null
          checks?: Json | null
          created_at?: string
          declared_duration_sec?: number | null
          engagement_id?: string | null
          format?: string
          height_px?: number | null
          id?: string
          kind?: string
          max_bytes?: number
          mime?: string | null
          object_deleted_at?: string | null
          owner_id?: string
          path?: string
          portfolio_item_id?: string | null
          purpose?: string
          reserved_bytes?: number
          sha256?: string | null
          state?: string
          upload_blocked_until?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_brief_fk"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_engagement_fk"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          audience: string
          company_name: string
          country: string
          industry: string
          tone: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          audience?: string
          company_name?: string
          country?: string
          industry?: string
          tone?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          audience?: string
          company_name?: string
          country?: string
          industry?: string
          tone?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          payload: Json
          published_revision: number | null
          requirements: Json
          revision: number
          safe_payload: Json
          state: string
          updated_at: string
          version: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          payload?: Json
          published_revision?: number | null
          requirements?: Json
          revision?: number
          safe_payload?: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          payload?: Json
          published_revision?: number | null
          requirements?: Json
          revision?: number
          safe_payload?: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "briefs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_terms: {
        Row: {
          active: boolean
          aliases: string[]
          kind: string
          label: string
          metadata: Json
          slug: string
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          kind: string
          label: string
          metadata?: Json
          slug: string
        }
        Update: {
          active?: boolean
          aliases?: string[]
          kind?: string
          label?: string
          metadata?: Json
          slug?: string
        }
        Relationships: []
      }
      claim_signals: {
        Row: {
          assertion: string
          asset_id: string | null
          checked_at: string | null
          checker_id: string | null
          claim_code: string
          created_at: string
          creator_id: string
          evidence_asset_ids: string[]
          id: string
          item_id: string | null
          limitations: string[]
          method: string | null
          reference_urls: string[]
          simulated: boolean
          stale: boolean
          status: string
        }
        Insert: {
          assertion: string
          asset_id?: string | null
          checked_at?: string | null
          checker_id?: string | null
          claim_code: string
          created_at?: string
          creator_id: string
          evidence_asset_ids?: string[]
          id?: string
          item_id?: string | null
          limitations?: string[]
          method?: string | null
          reference_urls?: string[]
          simulated?: boolean
          stale?: boolean
          status: string
        }
        Update: {
          assertion?: string
          asset_id?: string | null
          checked_at?: string | null
          checker_id?: string | null
          claim_code?: string
          created_at?: string
          creator_id?: string
          evidence_asset_ids?: string[]
          id?: string
          item_id?: string | null
          limitations?: string[]
          method?: string | null
          reference_urls?: string[]
          simulated?: boolean
          stale?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_signals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_signals_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          aspect_ratios: string[]
          available: boolean
          bio: string
          capabilities: Json
          country: string
          currency: string
          delivery_days: number
          display_name: string
          formats: string[]
          headline: string
          is_demo: boolean
          languages: string[]
          media_kinds: string[]
          minimum_price_minor: number | null
          model_slugs: string[]
          outcomes: string[]
          published: boolean
          rights_offer: Json | null
          search_doc: unknown
          search_text: string
          skills: string[]
          slug: string
          specialties: string[]
          styles: string[]
          timezone: string
          tool_slugs: string[]
          updated_at: string
          user_id: string
          version: number
          workflow_stages: string[]
        }
        Insert: {
          aspect_ratios?: string[]
          available?: boolean
          bio?: string
          capabilities?: Json
          country?: string
          currency?: string
          delivery_days?: number
          display_name: string
          formats?: string[]
          headline?: string
          is_demo?: boolean
          languages?: string[]
          media_kinds?: string[]
          minimum_price_minor?: number | null
          model_slugs?: string[]
          outcomes?: string[]
          published?: boolean
          rights_offer?: Json | null
          search_doc?: unknown
          search_text?: string
          skills?: string[]
          slug: string
          specialties?: string[]
          styles?: string[]
          timezone?: string
          tool_slugs?: string[]
          updated_at?: string
          user_id: string
          version?: number
          workflow_stages?: string[]
        }
        Update: {
          aspect_ratios?: string[]
          available?: boolean
          bio?: string
          capabilities?: Json
          country?: string
          currency?: string
          delivery_days?: number
          display_name?: string
          formats?: string[]
          headline?: string
          is_demo?: boolean
          languages?: string[]
          media_kinds?: string[]
          minimum_price_minor?: number | null
          model_slugs?: string[]
          outcomes?: string[]
          published?: boolean
          rights_offer?: Json | null
          search_doc?: unknown
          search_text?: string
          skills?: string[]
          slug?: string
          specialties?: string[]
          styles?: string[]
          timezone?: string
          tool_slugs?: string[]
          updated_at?: string
          user_id?: string
          version?: number
          workflow_stages?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          accepted_at: string | null
          application_id: string
          brand_id: string
          brief_id: string
          brief_snapshot: Json
          creator_id: string
          id: string
          offer_snapshot: Json
          pipeline_snapshot: Json
          requirements_snapshot: Json
          review_ack: string | null
          revision_count: number
          selected_at: string
          selection_receipt: Json
          state: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          brand_id: string
          brief_id: string
          brief_snapshot: Json
          creator_id: string
          id?: string
          offer_snapshot: Json
          pipeline_snapshot: Json
          requirements_snapshot: Json
          review_ack?: string | null
          revision_count?: number
          selected_at?: string
          selection_receipt: Json
          state?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          brand_id?: string
          brief_id?: string
          brief_snapshot?: Json
          creator_id?: string
          id?: string
          offer_snapshot?: Json
          pipeline_snapshot?: Json
          requirements_snapshot?: Json
          review_ack?: string | null
          revision_count?: number
          selected_at?: string
          selection_receipt?: Json
          state?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "engagements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: true
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          actor_id: string
          created_at: string
          key: string
          operation: string
          request_hash: string
          result_ref: Json
        }
        Insert: {
          actor_id: string
          created_at?: string
          key: string
          operation: string
          request_hash: string
          result_ref: Json
        }
        Update: {
          actor_id?: string
          created_at?: string
          key?: string
          operation?: string
          request_hash?: string
          result_ref?: Json
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          artifact_origin: string
          created_at: string
          creator_id: string
          description: string
          duration_sec: number | null
          generation_disclosure: string
          height_px: number | null
          human_contribution: string
          id: string
          media_kind: string
          model_disclosure_note: string
          model_refs: Json
          objective: string
          outcomes: string[]
          output_formats: string[]
          preview_asset_id: string | null
          published: boolean
          rights_offer: Json | null
          styles: string[]
          title: string
          updated_at: string
          version: number
          width_px: number | null
          workflow: Json
        }
        Insert: {
          artifact_origin?: string
          created_at?: string
          creator_id: string
          description?: string
          duration_sec?: number | null
          generation_disclosure?: string
          height_px?: number | null
          human_contribution?: string
          id?: string
          media_kind?: string
          model_disclosure_note?: string
          model_refs?: Json
          objective?: string
          outcomes?: string[]
          output_formats?: string[]
          preview_asset_id?: string | null
          published?: boolean
          rights_offer?: Json | null
          styles?: string[]
          title?: string
          updated_at?: string
          version?: number
          width_px?: number | null
          workflow?: Json
        }
        Update: {
          artifact_origin?: string
          created_at?: string
          creator_id?: string
          description?: string
          duration_sec?: number | null
          generation_disclosure?: string
          height_px?: number | null
          human_contribution?: string
          id?: string
          media_kind?: string
          model_disclosure_note?: string
          model_refs?: Json
          objective?: string
          outcomes?: string[]
          output_formats?: string[]
          preview_asset_id?: string | null
          published?: boolean
          rights_offer?: Json | null
          styles?: string[]
          title?: string
          updated_at?: string
          version?: number
          width_px?: number | null
          workflow?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_preview_fk"
            columns: ["preview_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          brand_id: string
          brief_id: string
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          brand_id: string
          brief_id: string
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          brand_id?: string
          brief_id?: string
          created_at?: string
          creator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      submissions: {
        Row: {
          asset_ids: string[]
          automatic_checks: Json
          brand_review: Json | null
          creator_checklist: Json
          creator_id: string
          engagement_id: string
          feedback: Json | null
          final_rights: Json
          id: string
          output_mapping: Json
          rights_receipt: Json
          sequence: number
          submitted_at: string
        }
        Insert: {
          asset_ids: string[]
          automatic_checks: Json
          brand_review?: Json | null
          creator_checklist: Json
          creator_id: string
          engagement_id: string
          feedback?: Json | null
          final_rights: Json
          id?: string
          output_mapping: Json
          rights_receipt: Json
          sequence: number
          submitted_at?: string
        }
        Update: {
          asset_ids?: string[]
          automatic_checks?: Json
          brand_review?: Json | null
          creator_checklist?: Json
          creator_id?: string
          engagement_id?: string
          feedback?: Json | null
          final_rights?: Json
          id?: string
          output_mapping?: Json
          rights_receipt?: Json
          sequence?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_events: {
        Row: {
          actor_id: string
          brief_id: string | null
          created_at: string
          details: Json
          engagement_id: string | null
          entity_version: number
          event_type: string
          id: string
          new_state: string | null
          old_state: string | null
        }
        Insert: {
          actor_id: string
          brief_id?: string | null
          created_at?: string
          details?: Json
          engagement_id?: string | null
          entity_version: number
          event_type: string
          id?: string
          new_state?: string | null
          old_state?: string | null
        }
        Update: {
          actor_id?: string
          brief_id?: string | null
          created_at?: string
          details?: Json
          engagement_id?: string | null
          entity_version?: number
          event_type?: string
          id?: string
          new_state?: string | null
          old_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_engagement: {
        Args: { p_id: string; p_input: Json; p_key: string }
        Returns: Json
      }
      create_application: {
        Args: { p_brief: string; p_input: Json; p_key: string }
        Returns: Json
      }
      create_brief: { Args: { p_input: Json; p_key: string }; Returns: Json }
      create_claim: {
        Args: {
          p_assertion: string
          p_evidence: string[]
          p_item: string
          p_key: string
        }
        Returns: Json
      }
      create_portfolio_item: {
        Args: { p_input: Json; p_key: string }
        Returns: Json
      }
      evaluate_rights: {
        Args: {
          p_final?: Json
          p_offer: Json
          p_pipeline?: Json
          p_request: Json
        }
        Returns: Json
      }
      onboard_account: {
        Args: { p_display_name: string; p_key: string; p_role: string }
        Returns: Json
      }
      owned_briefs: { Args: { p_id?: string }; Returns: Json }
      publish_brief: {
        Args: { p_expected_version: number; p_id: string; p_key: string }
        Returns: Json
      }
      publish_creator: {
        Args: {
          p_expected_version: number
          p_key: string
          p_published?: boolean
        }
        Returns: Json
      }
      publish_portfolio_item: {
        Args: {
          p_expected_version: number
          p_id: string
          p_key: string
          p_published?: boolean
        }
        Returns: Json
      }
      record_asset_check: {
        Args: { p_id: string; p_result: Json }
        Returns: Json
      }
      record_asset_upload_blocker: {
        Args: { p_id: string; p_reason: string; p_until: string }
        Returns: Json
      }
      reject_asset_after_delete: {
        Args: { p_deleted: boolean; p_id: string; p_reason: string }
        Returns: Json
      }
      request_revision: {
        Args: { p_id: string; p_input: Json; p_key: string }
        Returns: Json
      }
      reserve_asset: {
        Args: {
          p_declared_bytes: number
          p_duration: number
          p_format: string
          p_key: string
          p_kind: string
          p_parent: string
          p_purpose: string
        }
        Returns: Json
      }
      save_brand: {
        Args: { p_expected_version: number; p_input: Json }
        Returns: Json
      }
      save_brief: {
        Args: {
          p_expected_version: number
          p_id: string
          p_input: Json
          p_start_revision?: boolean
        }
        Returns: Json
      }
      save_creator: {
        Args: { p_expected_version: number; p_input: Json }
        Returns: Json
      }
      save_portfolio_item: {
        Args: { p_expected_version: number; p_id: string; p_input: Json }
        Returns: Json
      }
      search_creators: {
        Args: {
          p_brief?: string
          p_filters?: Json
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      select_application: {
        Args: {
          p_expected_application_version: number
          p_expected_brief_revision: number
          p_id: string
          p_key: string
          p_review_ack: string
        }
        Returns: Json
      }
      shortlist_mutation: {
        Args: {
          p_brief: string
          p_creator: string
          p_key: string
          p_remove: boolean
        }
        Returns: Json
      }
      submit_delivery: {
        Args: { p_id: string; p_input: Json; p_key: string }
        Returns: Json
      }
      withdraw_application: {
        Args: { p_expected_version: number; p_id: string; p_key: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

