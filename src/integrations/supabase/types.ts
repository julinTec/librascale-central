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
      budget_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          quantity: number
          quote_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          total_value: number
          unit: string | null
          unit_value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          quantity?: number
          quote_id: string
          service_type?: Database["public"]["Enums"]["service_type"]
          total_value?: number
          unit?: string | null
          unit_value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          quantity?: number
          quote_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          total_value?: number
          unit?: string | null
          unit_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "event_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      event_assignments: {
        Row: {
          created_at: string
          fee_expected: number | null
          fee_final: number | null
          id: string
          interpreter_id: string
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          role: string | null
          service_role: string | null
          session_id: string
          total_value: number
          transport_expected: number | null
          transport_final: number | null
          unit_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_expected?: number | null
          fee_final?: number | null
          id?: string
          interpreter_id: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          role?: string | null
          service_role?: string | null
          session_id: string
          total_value?: number
          transport_expected?: number | null
          transport_final?: number | null
          unit_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_expected?: number | null
          fee_final?: number | null
          id?: string
          interpreter_id?: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          role?: string | null
          service_role?: string | null
          session_id?: string
          total_value?: number
          transport_expected?: number | null
          transport_final?: number | null
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          event_id: string
          expense_date: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          interpreter_id: string | null
          notes: string | null
          session_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          event_id: string
          expense_date?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          interpreter_id?: string | null
          notes?: string | null
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          event_id?: string
          expense_date?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          interpreter_id?: string | null
          notes?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payables: {
        Row: {
          amount: number
          assignment_id: string | null
          competence_date: string | null
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string
          id: string
          interpreter_id: string | null
          notes: string | null
          paid_date: string | null
          schedule_id: string | null
          status: Database["public"]["Enums"]["payable_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          assignment_id?: string | null
          competence_date?: string | null
          cost_type?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          interpreter_id?: string | null
          notes?: string | null
          paid_date?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["payable_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          assignment_id?: string | null
          competence_date?: string | null
          cost_type?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          interpreter_id?: string | null
          notes?: string | null
          paid_date?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["payable_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_payables_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "event_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payables_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
        ]
      }
      event_quotes: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          event_name: string
          event_type: string | null
          id: string
          notes: string | null
          quoted_value: number | null
          sessions_count: number | null
          source_channel: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_name: string
          event_type?: string | null
          id?: string
          notes?: string | null
          quoted_value?: number | null
          sessions_count?: number | null
          source_channel?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_name?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          quoted_value?: number | null
          sessions_count?: number | null
          source_channel?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      event_receivables: {
        Row: {
          amount: number
          client_id: string | null
          competence_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string
          id: string
          invoice_number: string | null
          net_amount: number
          notes: string | null
          received_date: string | null
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          status: Database["public"]["Enums"]["receivable_status"]
          tax_amount: number
          tax_percentage: number
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          competence_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          invoice_number?: string | null
          net_amount?: number
          notes?: string | null
          received_date?: string | null
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          status?: Database["public"]["Enums"]["receivable_status"]
          tax_amount?: number
          tax_percentage?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          competence_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          invoice_number?: string | null
          net_amount?: number
          notes?: string | null
          received_date?: string | null
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          status?: Database["public"]["Enums"]["receivable_status"]
          tax_amount?: number
          tax_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_receivables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_services: {
        Row: {
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          created_at: string
          description: string | null
          event_id: string
          expected_value: number
          id: string
          notes: string | null
          quantity: number
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          created_at?: string
          description?: string | null
          event_id: string
          expected_value?: number
          id?: string
          notes?: string | null
          quantity?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          created_at?: string
          description?: string | null
          event_id?: string
          expected_value?: number
          id?: string
          notes?: string | null
          quantity?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_services_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string
          event_id: string
          id: string
          location: string | null
          modality: Database["public"]["Enums"]["event_modality"]
          notes: string | null
          session_date: string
          start_time: string
          status: Database["public"]["Enums"]["schedule_status_v2"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time: string
          event_id: string
          id?: string
          location?: string | null
          modality?: Database["public"]["Enums"]["event_modality"]
          notes?: string | null
          session_date: string
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status_v2"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string
          event_id?: string
          id?: string
          location?: string | null
          modality?: Database["public"]["Enums"]["event_modality"]
          notes?: string | null
          session_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status_v2"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          client_id: string | null
          contract_value: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id: string
          modality: Database["public"]["Enums"]["event_modality"]
          notes: string | null
          quote_id: string | null
          service_types: string[]
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          client_id?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_name: string
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          modality?: Database["public"]["Enums"]["event_modality"]
          notes?: string | null
          quote_id?: string | null
          service_types?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          client_id?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_name?: string
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          modality?: Database["public"]["Enums"]["event_modality"]
          notes?: string | null
          quote_id?: string | null
          service_types?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "event_quotes"
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
          professional_type: Database["public"]["Enums"]["professional_type"]
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
          professional_type?: Database["public"]["Enums"]["professional_type"]
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
          professional_type?: Database["public"]["Enums"]["professional_type"]
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
          interpreter_id: string | null
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
          interpreter_id?: string | null
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
          interpreter_id?: string | null
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
      tax_settings: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          percentage?: number
          updated_at?: string
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
      delete_client_cascade: {
        Args: { _client_id: string }
        Returns: undefined
      }
      delete_event_cascade: { Args: { _event_id: string }; Returns: undefined }
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
      billing_mode:
        | "por_sessao"
        | "por_diaria"
        | "valor_fechado"
        | "valor_mensal"
        | "item_unico"
      billing_type:
        | "unico"
        | "por_sessao"
        | "mensal"
        | "fechado_periodo"
        | "misto"
      cost_type:
        | "mao_de_obra"
        | "aluguel_equipamento"
        | "imposto"
        | "deslocamento"
        | "alimentacao"
        | "hospedagem"
        | "outro"
      event_modality: "presencial" | "remoto" | "hibrido"
      event_status:
        | "planejado"
        | "confirmado"
        | "em_execucao"
        | "concluido"
        | "faturado"
        | "encerrado"
        | "cancelado"
      event_type_enum:
        | "evento_pontual"
        | "temporada"
        | "palestra"
        | "gravacao"
        | "servico_administrativo"
        | "video_remoto"
        | "outro"
      execution_status:
        | "realizada_normalmente"
        | "atraso_cliente"
        | "atraso_interno"
        | "cancelada_cliente"
        | "cancelada_internamente"
        | "parcialmente_realizada"
        | "regravada"
        | "nao_realizada"
      expense_type:
        | "cache"
        | "transporte"
        | "alimentacao"
        | "hospedagem"
        | "taxa"
        | "outro"
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
      payable_status: "pendente" | "pago_parcial" | "pago" | "vencido"
      payment_mode: "por_sessao" | "por_diaria" | "valor_fechado"
      payment_status: "pendente" | "parcialmente_pago" | "pago"
      professional_type:
        | "interprete_libras"
        | "audiodescritor"
        | "consultor"
        | "locutor"
        | "assistente"
        | "outro"
      quote_status:
        | "recebido"
        | "em_orcamento"
        | "enviado"
        | "aprovado"
        | "recusado"
        | "cancelado"
      receivable_status:
        | "pendente"
        | "recebido_parcial"
        | "recebido"
        | "vencido"
      revenue_type:
        | "faturamento_sessao"
        | "faturamento_mensal"
        | "faturamento_unico"
        | "valor_adicional"
        | "outro"
      schedule_status:
        | "planejada"
        | "confirmada"
        | "em_execucao"
        | "concluida"
        | "cancelada"
        | "reprogramada"
      schedule_status_v2:
        | "agendada"
        | "confirmada"
        | "realizada"
        | "cancelada"
        | "reagendada"
      service_type:
        | "interprete_libras"
        | "audiodescricao"
        | "consultoria"
        | "locucao"
        | "aluguel_equipamento"
        | "assistencia"
        | "outro"
      session_status: "planejada" | "confirmada" | "realizada" | "cancelada"
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
      billing_mode: [
        "por_sessao",
        "por_diaria",
        "valor_fechado",
        "valor_mensal",
        "item_unico",
      ],
      billing_type: [
        "unico",
        "por_sessao",
        "mensal",
        "fechado_periodo",
        "misto",
      ],
      cost_type: [
        "mao_de_obra",
        "aluguel_equipamento",
        "imposto",
        "deslocamento",
        "alimentacao",
        "hospedagem",
        "outro",
      ],
      event_modality: ["presencial", "remoto", "hibrido"],
      event_status: [
        "planejado",
        "confirmado",
        "em_execucao",
        "concluido",
        "faturado",
        "encerrado",
        "cancelado",
      ],
      event_type_enum: [
        "evento_pontual",
        "temporada",
        "palestra",
        "gravacao",
        "servico_administrativo",
        "video_remoto",
        "outro",
      ],
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
      expense_type: [
        "cache",
        "transporte",
        "alimentacao",
        "hospedagem",
        "taxa",
        "outro",
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
      payable_status: ["pendente", "pago_parcial", "pago", "vencido"],
      payment_mode: ["por_sessao", "por_diaria", "valor_fechado"],
      payment_status: ["pendente", "parcialmente_pago", "pago"],
      professional_type: [
        "interprete_libras",
        "audiodescritor",
        "consultor",
        "locutor",
        "assistente",
        "outro",
      ],
      quote_status: [
        "recebido",
        "em_orcamento",
        "enviado",
        "aprovado",
        "recusado",
        "cancelado",
      ],
      receivable_status: [
        "pendente",
        "recebido_parcial",
        "recebido",
        "vencido",
      ],
      revenue_type: [
        "faturamento_sessao",
        "faturamento_mensal",
        "faturamento_unico",
        "valor_adicional",
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
      schedule_status_v2: [
        "agendada",
        "confirmada",
        "realizada",
        "cancelada",
        "reagendada",
      ],
      service_type: [
        "interprete_libras",
        "audiodescricao",
        "consultoria",
        "locucao",
        "aluguel_equipamento",
        "assistencia",
        "outro",
      ],
      session_status: ["planejada", "confirmada", "realizada", "cancelada"],
    },
  },
} as const
