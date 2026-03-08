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
      clients: {
        Row: {
          additional_hour_rate: number | null
          cnpj: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          main_contact: string | null
          monthly_hours_package: number | null
          name: string
          notes: string | null
          phone: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          additional_hour_rate?: number | null
          cnpj?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          main_contact?: string | null
          monthly_hours_package?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          additional_hour_rate?: number | null
          cnpj?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          main_contact?: string | null
          monthly_hours_package?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_hours: {
        Row: {
          additional_hour_rate: number
          client_id: string
          contracted_hours: number
          created_at: string
          hour_rate: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          additional_hour_rate?: number
          client_id: string
          contracted_hours?: number
          created_at?: string
          hour_rate?: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          additional_hour_rate?: number
          client_id?: string
          contracted_hours?: number
          created_at?: string
          hour_rate?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_hours_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_logs: {
        Row: {
          actual_duration_minutes: number | null
          actual_end: string | null
          actual_start: string | null
          billable_hours: number | null
          created_at: string
          created_by: string | null
          execution_status: Database["public"]["Enums"]["execution_status"]
          id: string
          notes: string | null
          schedule_id: string
          updated_at: string
          worked_hours: number | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          billable_hours?: number | null
          created_at?: string
          created_by?: string | null
          execution_status?: Database["public"]["Enums"]["execution_status"]
          id?: string
          notes?: string | null
          schedule_id: string
          updated_at?: string
          worked_hours?: number | null
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          billable_hours?: number | null
          created_at?: string
          created_by?: string | null
          execution_status?: Database["public"]["Enums"]["execution_status"]
          id?: string
          notes?: string | null
          schedule_id?: string
          updated_at?: string
          worked_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: true
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          client_id: string | null
          created_at: string
          description: string
          estimated_financial_impact: number | null
          id: string
          impact_minutes: number | null
          incident_type: Database["public"]["Enums"]["incident_type"]
          notes: string | null
          occurred_at: string
          reported_by: string | null
          schedule_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description: string
          estimated_financial_impact?: number | null
          id?: string
          impact_minutes?: number | null
          incident_type: Database["public"]["Enums"]["incident_type"]
          notes?: string | null
          occurred_at?: string
          reported_by?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string
          estimated_financial_impact?: number | null
          id?: string
          impact_minutes?: number | null
          incident_type?: Database["public"]["Enums"]["incident_type"]
          notes?: string | null
          occurred_at?: string
          reported_by?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreters: {
        Row: {
          cpf: string | null
          created_at: string
          created_by: string | null
          default_availability: string | null
          email: string | null
          employment_type: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          default_availability?: string | null
          email?: string | null
          employment_type?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          default_availability?: string | null
          email?: string | null
          employment_type?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      period_closings: {
        Row: {
          additional_hours: number | null
          billable_hours: number | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          package_balance: number | null
          period_end: string
          period_start: string
          planned_hours: number | null
          realized_hours: number | null
          total_value: number | null
          unused_hours: number | null
          updated_at: string
        }
        Insert: {
          additional_hours?: number | null
          billable_hours?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          package_balance?: number | null
          period_end: string
          period_start: string
          planned_hours?: number | null
          realized_hours?: number | null
          total_value?: number | null
          unused_hours?: number | null
          updated_at?: string
        }
        Update: {
          additional_hours?: number | null
          billable_hours?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          package_balance?: number | null
          period_end?: string
          period_start?: string
          planned_hours?: number | null
          realized_hours?: number | null
          total_value?: number | null
          unused_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_closings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_audit_logs: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          schedule_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          schedule_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_audit_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          internal_code: string | null
          interpreter_id: string
          location: string | null
          modality: Database["public"]["Enums"]["activity_modality"]
          notes: string | null
          planned_duration_minutes: number | null
          planned_end: string
          planned_start: string
          status: Database["public"]["Enums"]["schedule_status"]
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_date: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_code?: string | null
          interpreter_id: string
          location?: string | null
          modality?: Database["public"]["Enums"]["activity_modality"]
          notes?: string | null
          planned_duration_minutes?: number | null
          planned_end: string
          planned_start: string
          status?: Database["public"]["Enums"]["schedule_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_code?: string | null
          interpreter_id?: string
          location?: string | null
          modality?: Database["public"]["Enums"]["activity_modality"]
          notes?: string | null
          planned_duration_minutes?: number | null
          planned_end?: string
          planned_start?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_modality: "estudio" | "remoto" | "ao_vivo" | "hibrido"
      activity_type:
        | "gravacao_estudio"
        | "gravacao_remota"
        | "ao_vivo_estudio"
        | "formacao"
        | "regravacao"
        | "outro"
      app_role: "admin" | "operacional" | "gestor" | "interprete"
      execution_status:
        | "realizada_normalmente"
        | "atraso_cliente"
        | "atraso_interno"
        | "cancelada_cliente"
        | "cancelada_internamente"
        | "parcialmente_realizada"
        | "regravada"
        | "nao_realizada"
      incident_status: "aberta" | "em_analise" | "resolvida" | "encerrada"
      incident_type:
        | "atraso_cliente"
        | "atraso_interno"
        | "cancelamento_cliente"
        | "cancelamento_interno"
        | "mudanca_horario"
        | "mudanca_conteudo"
        | "reducao_duracao"
        | "ampliacao_duracao"
        | "ausencia_interprete"
        | "problema_tecnico"
        | "divergencia_fechamento"
        | "outro"
      schedule_status:
        | "planejada"
        | "confirmada"
        | "em_execucao"
        | "concluida"
        | "cancelada"
        | "reprogramada"
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
      activity_modality: ["estudio", "remoto", "ao_vivo", "hibrido"],
      activity_type: [
        "gravacao_estudio",
        "gravacao_remota",
        "ao_vivo_estudio",
        "formacao",
        "regravacao",
        "outro",
      ],
      app_role: ["admin", "operacional", "gestor", "interprete"],
      execution_status: [
        "realizada_normalmente",
        "atraso_cliente",
        "atraso_interno",
        "cancelada_cliente",
        "cancelada_internamente",
        "parcialmente_realizada",
        "regravada",
        "nao_realizada",
      ],
      incident_status: ["aberta", "em_analise", "resolvida", "encerrada"],
      incident_type: [
        "atraso_cliente",
        "atraso_interno",
        "cancelamento_cliente",
        "cancelamento_interno",
        "mudanca_horario",
        "mudanca_conteudo",
        "reducao_duracao",
        "ampliacao_duracao",
        "ausencia_interprete",
        "problema_tecnico",
        "divergencia_fechamento",
        "outro",
      ],
      schedule_status: [
        "planejada",
        "confirmada",
        "em_execucao",
        "concluida",
        "cancelada",
        "reprogramada",
      ],
    },
  },
} as const
