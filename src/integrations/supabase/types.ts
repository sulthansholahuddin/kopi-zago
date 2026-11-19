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
      admin_invites: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          menu_id: number
          qty: number
          size: Database["public"]["Enums"]["drink_size"]
          user_id: string
        }
        Insert: {
          created_at?: string
          menu_id: number
          qty?: number
          size?: Database["public"]["Enums"]["drink_size"]
          user_id: string
        }
        Update: {
          created_at?: string
          menu_id?: number
          qty?: number
          size?: Database["public"]["Enums"]["drink_size"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_redemptions: {
        Row: {
          claimed_at: string | null
          energy_cost: number
          expires_at: string | null
          id: number
          legacy_user_id: number | null
          notes: string | null
          redeemed_at: string
          reward_id: number
          status: string
          user_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          energy_cost: number
          expires_at?: string | null
          id?: number
          legacy_user_id?: number | null
          notes?: string | null
          redeemed_at?: string
          reward_id: number
          status?: string
          user_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          energy_cost?: number
          expires_at?: string | null
          id?: number
          legacy_user_id?: number | null
          notes?: string | null
          redeemed_at?: string
          reward_id?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "energy_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_rewards: {
        Row: {
          created_at: string
          description: string | null
          energy_cost: number
          id: number
          is_active: boolean
          menu_id: number | null
          name: string
          reward_type: string
          reward_value: number | null
          stock: number | null
          terms: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          energy_cost: number
          id?: number
          is_active?: boolean
          menu_id?: number | null
          name: string
          reward_type: string
          reward_value?: number | null
          stock?: number | null
          terms?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          energy_cost?: number
          id?: number
          is_active?: boolean
          menu_id?: number | null
          name?: string
          reward_type?: string
          reward_value?: number | null
          stock?: number | null
          terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_rewards_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: number
          legacy_user_id: number | null
          source_id: number | null
          source_type: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: number
          legacy_user_id?: number | null
          source_id?: number | null
          source_type: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: number
          legacy_user_id?: number | null
          source_id?: number | null
          source_type?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      legacy_users: {
        Row: {
          birth_date: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          email: string
          is_active: boolean
          legacy_id: number
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          birth_date?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          email: string
          is_active?: boolean
          legacy_id: number
          name?: string
          phone?: string | null
          role?: string
        }
        Update: {
          birth_date?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          email?: string
          is_active?: boolean
          legacy_id?: number
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: number
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name: string
          price: number
          stock: number
        }
        Insert: {
          category_id: number
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name: string
          price: number
          stock?: number
        }
        Update: {
          category_id?: number
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_sizes: {
        Row: {
          id: number
          menu_id: number
          price: number
          size: Database["public"]["Enums"]["drink_size"]
        }
        Insert: {
          id?: number
          menu_id: number
          price: number
          size: Database["public"]["Enums"]["drink_size"]
        }
        Update: {
          id?: number
          menu_id?: number
          price?: number
          size?: Database["public"]["Enums"]["drink_size"]
        }
        Relationships: [
          {
            foreignKeyName: "menu_sizes_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          legacy_user_id: number | null
          message: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          legacy_user_id?: number | null
          message: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          legacy_user_id?: number | null
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: number
          menu_id: number | null
          name: string
          order_id: number
          price: number
          qty: number
          size: Database["public"]["Enums"]["drink_size"]
        }
        Insert: {
          id?: number
          menu_id?: number | null
          name: string
          order_id: number
          price: number
          qty: number
          size?: Database["public"]["Enums"]["drink_size"]
        }
        Update: {
          id?: number
          menu_id?: number | null
          name?: string
          order_id?: number
          price?: number
          qty?: number
          size?: Database["public"]["Enums"]["drink_size"]
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: number
          fulfillment_type: string
          id: number
          legacy_user_id: number | null
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          fulfillment_type?: string
          id?: number
          legacy_user_id?: number | null
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          fulfillment_type?: string
          id?: number
          legacy_user_id?: number | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          legacy_user_id: number | null
          name: string
          phone: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          legacy_user_id?: number | null
          name?: string
          phone?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legacy_user_id?: number | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          energy_awarded: number
          id: number
          qr_token_id: number
          scanned_at: string
          user_id: string
        }
        Insert: {
          energy_awarded: number
          id?: number
          qr_token_id: number
          scanned_at?: string
          user_id: string
        }
        Update: {
          energy_awarded?: number
          id?: number
          qr_token_id?: number
          scanned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_qr_token_id_fkey"
            columns: ["qr_token_id"]
            isOneToOne: false
            referencedRelation: "qr_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          energy_amount: number
          expires_at: string
          id: number
          scan_count: number
          scan_limit: number
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          energy_amount?: number
          expires_at: string
          id?: number
          scan_count?: number
          scan_limit?: number
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          energy_amount?: number
          expires_at?: string
          id?: number
          scan_count?: number
          scan_limit?: number
          token_hash?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: number
          legacy_user_id: number | null
          menu_id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          legacy_user_id?: number | null
          menu_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          legacy_user_id?: number | null
          menu_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_qr_token: {
        Args: {
          p_energy: number
          p_hours: number
          p_scan_limit: number
          p_token: string
        }
        Returns: number
      }
      admin_set_order_status: {
        Args: {
          p_order_id: number
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      admin_set_payment_status: {
        Args: {
          p_order_id: number
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      cancel_expired_qris_orders: { Args: never; Returns: number }
      cancel_order: { Args: { p_order_id: number }; Returns: undefined }
      claim_account: { Args: never; Returns: Json }
      confirm_qris_payment: { Args: { p_order_id: number }; Returns: Json }
      energy_balance: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_user: {
        Args: { _message: string; _title: string; _user_id: string }
        Returns: undefined
      }
      place_order: { Args: { p_payment_method: string }; Returns: Json }
      redeem_reward: { Args: { p_reward_id: number }; Returns: Json }
      scan_qr: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "customer"
      drink_size: "small" | "medium" | "large"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "ready"
        | "on_delivery"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
    Enums: {
      app_role: ["admin", "customer"],
      drink_size: ["small", "medium", "large"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "ready",
        "on_delivery",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
