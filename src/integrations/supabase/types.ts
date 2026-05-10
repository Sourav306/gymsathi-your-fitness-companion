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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adaptive_insights: {
        Row: {
          created_at: string
          id: string
          insight_date: string
          metadata: Json | null
          priority: number
          reason: string
          status: string
          suggested_action: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight_date?: string
          metadata?: Json | null
          priority?: number
          reason: string
          status?: string
          suggested_action: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight_date?: string
          metadata?: Json | null
          priority?: number
          reason?: string
          status?: string
          suggested_action?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_meal_plans: {
        Row: {
          created_at: string
          id: string
          name: string | null
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          plan: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_workout_plans: {
        Row: {
          created_at: string
          id: string
          name: string | null
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          plan: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      coach_chat_messages: {
        Row: {
          action_json: Json | null
          content: string
          created_at: string
          id: string
          intent: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_json?: Json | null
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_json?: Json | null
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_evaluations: {
        Row: {
          ai_feedback_message: string | null
          calorie_status: string | null
          compared_to_7_day_average: string | null
          compared_to_yesterday: string | null
          completion_score: number
          created_at: string
          evaluation_date: string
          id: string
          improvement_suggestions: Json | null
          protein_status: string | null
          sleep_status: string | null
          steps_status: string | null
          tasks_completed: number
          tasks_missed: Json | null
          tasks_total: number
          updated_at: string
          user_id: string
          water_status: string | null
          workout_status: string | null
        }
        Insert: {
          ai_feedback_message?: string | null
          calorie_status?: string | null
          compared_to_7_day_average?: string | null
          compared_to_yesterday?: string | null
          completion_score?: number
          created_at?: string
          evaluation_date: string
          id?: string
          improvement_suggestions?: Json | null
          protein_status?: string | null
          sleep_status?: string | null
          steps_status?: string | null
          tasks_completed?: number
          tasks_missed?: Json | null
          tasks_total?: number
          updated_at?: string
          user_id: string
          water_status?: string | null
          workout_status?: string | null
        }
        Update: {
          ai_feedback_message?: string | null
          calorie_status?: string | null
          compared_to_7_day_average?: string | null
          compared_to_yesterday?: string | null
          completion_score?: number
          created_at?: string
          evaluation_date?: string
          id?: string
          improvement_suggestions?: Json | null
          protein_status?: string | null
          sleep_status?: string | null
          steps_status?: string | null
          tasks_completed?: number
          tasks_missed?: Json | null
          tasks_total?: number
          updated_at?: string
          user_id?: string
          water_status?: string | null
          workout_status?: string | null
        }
        Relationships: []
      }
      daily_recommendations: {
        Row: {
          created_at: string
          for_date: string
          id: string
          recommendation: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          for_date: string
          id?: string
          recommendation: Json
          user_id: string
        }
        Update: {
          created_at?: string
          for_date?: string
          id?: string
          recommendation?: Json
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          category: string
          completed_value: number | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          points: number
          priority: number
          target_value: number | null
          task_date: string
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          points?: number
          priority?: number
          target_value?: number | null
          task_date: string
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          points?: number
          priority?: number
          target_value?: number | null
          task_date?: string
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["favorite_kind"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          calories_consumed: number | null
          created_at: string
          id: string
          log_date: string
          meal_plan_completed: boolean
          notes: string | null
          protein_consumed: number | null
          updated_at: string
          user_id: string
          water_liters: number | null
          weight_kg: number | null
          workout_completed: boolean
        }
        Insert: {
          calories_consumed?: number | null
          created_at?: string
          id?: string
          log_date: string
          meal_plan_completed?: boolean
          notes?: string | null
          protein_consumed?: number | null
          updated_at?: string
          user_id: string
          water_liters?: number | null
          weight_kg?: number | null
          workout_completed?: boolean
        }
        Update: {
          calories_consumed?: number | null
          created_at?: string
          id?: string
          log_date?: string
          meal_plan_completed?: boolean
          notes?: string | null
          protein_consumed?: number | null
          updated_at?: string
          user_id?: string
          water_liters?: number | null
          weight_kg?: number | null
          workout_completed?: boolean
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string | null
          budget_level: string | null
          cooking_time_min: number | null
          created_at: string
          cuisine_preference: string | null
          diet_preference: string | null
          disliked_foods: string | null
          experience: string | null
          gender: string | null
          goal: string | null
          gym_access: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          liked_foods: string | null
          meal_prep_days: number | null
          meal_prep_style: string | null
          meals_per_day: number | null
          name: string | null
          onboarding_completed: boolean
          sleep_goal_hours: number | null
          step_goal: number | null
          target_protein: number | null
          updated_at: string
          user_id: string
          water_goal_liters: number | null
          weekly_budget: number | null
          weight_kg: number | null
          workout_days_per_week: number | null
          workout_time_min: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          budget_level?: string | null
          cooking_time_min?: number | null
          created_at?: string
          cuisine_preference?: string | null
          diet_preference?: string | null
          disliked_foods?: string | null
          experience?: string | null
          gender?: string | null
          goal?: string | null
          gym_access?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          liked_foods?: string | null
          meal_prep_days?: number | null
          meal_prep_style?: string | null
          meals_per_day?: number | null
          name?: string | null
          onboarding_completed?: boolean
          sleep_goal_hours?: number | null
          step_goal?: number | null
          target_protein?: number | null
          updated_at?: string
          user_id: string
          water_goal_liters?: number | null
          weekly_budget?: number | null
          weight_kg?: number | null
          workout_days_per_week?: number | null
          workout_time_min?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          budget_level?: string | null
          cooking_time_min?: number | null
          created_at?: string
          cuisine_preference?: string | null
          diet_preference?: string | null
          disliked_foods?: string | null
          experience?: string | null
          gender?: string | null
          goal?: string | null
          gym_access?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          liked_foods?: string | null
          meal_prep_days?: number | null
          meal_prep_style?: string | null
          meals_per_day?: number | null
          name?: string | null
          onboarding_completed?: boolean
          sleep_goal_hours?: number | null
          step_goal?: number | null
          target_protein?: number | null
          updated_at?: string
          user_id?: string
          water_goal_liters?: number | null
          weekly_budget?: number | null
          weight_kg?: number | null
          workout_days_per_week?: number | null
          workout_time_min?: number | null
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          created_at: string
          id: string
          meal_plan_id: string | null
          plan_data: Json
          updated_at: string
          user_id: string
          week_start: string
          workout_plan_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meal_plan_id?: string | null
          plan_data: Json
          updated_at?: string
          user_id: string
          week_start: string
          workout_plan_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meal_plan_id?: string | null
          plan_data?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
          workout_plan_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      favorite_kind: "exercise" | "recipe" | "plan"
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
      favorite_kind: ["exercise", "recipe", "plan"],
    },
  },
} as const
