
-- =============================================
-- PHASE 1: NEW ENUMS
-- =============================================

CREATE TYPE public.professional_type AS ENUM (
  'interprete_libras', 'audiodescritor', 'consultor', 'locutor', 'assistente', 'outro'
);

CREATE TYPE public.event_type_enum AS ENUM (
  'evento_pontual', 'temporada', 'palestra', 'gravacao', 'servico_administrativo', 'video_remoto', 'outro'
);

CREATE TYPE public.event_modality AS ENUM (
  'presencial', 'remoto', 'hibrido'
);

CREATE TYPE public.billing_type AS ENUM (
  'unico', 'por_sessao', 'mensal', 'fechado_periodo', 'misto'
);

CREATE TYPE public.service_type AS ENUM (
  'interprete_libras', 'audiodescricao', 'consultoria', 'locucao', 'aluguel_equipamento', 'assistencia', 'outro'
);

CREATE TYPE public.billing_mode AS ENUM (
  'por_sessao', 'por_diaria', 'valor_fechado', 'valor_mensal', 'item_unico'
);

CREATE TYPE public.revenue_type AS ENUM (
  'faturamento_sessao', 'faturamento_mensal', 'faturamento_unico', 'valor_adicional', 'outro'
);

CREATE TYPE public.cost_type AS ENUM (
  'mao_de_obra', 'aluguel_equipamento', 'imposto', 'deslocamento', 'alimentacao', 'hospedagem', 'outro'
);

CREATE TYPE public.payment_mode AS ENUM (
  'por_sessao', 'por_diaria', 'valor_fechado'
);

CREATE TYPE public.schedule_status_v2 AS ENUM (
  'agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada'
);

-- =============================================
-- PHASE 2: ALTER EXISTING TABLES
-- =============================================

-- interpreters: add professional_type
ALTER TABLE public.interpreters
  ADD COLUMN professional_type public.professional_type NOT NULL DEFAULT 'interprete_libras';

-- events: add new columns, make client_id nullable
ALTER TABLE public.events
  ADD COLUMN event_type public.event_type_enum NOT NULL DEFAULT 'evento_pontual',
  ADD COLUMN modality public.event_modality NOT NULL DEFAULT 'presencial',
  ADD COLUMN billing_type public.billing_type NOT NULL DEFAULT 'unico';

ALTER TABLE public.events
  ALTER COLUMN client_id DROP NOT NULL;

-- event_quotes: make client_id nullable
ALTER TABLE public.event_quotes
  ALTER COLUMN client_id DROP NOT NULL;

-- event_receivables: add financial columns
ALTER TABLE public.event_receivables
  ADD COLUMN tax_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN tax_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN net_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN revenue_type public.revenue_type NOT NULL DEFAULT 'faturamento_unico',
  ADD COLUMN competence_date date,
  ADD COLUMN description text,
  ADD COLUMN client_id uuid;

-- event_payables: add cost columns
ALTER TABLE public.event_payables
  ADD COLUMN cost_type public.cost_type NOT NULL DEFAULT 'mao_de_obra',
  ADD COLUMN competence_date date,
  ADD COLUMN description text,
  ADD COLUMN schedule_id uuid;

-- event_sessions: add title and modality, change status type
ALTER TABLE public.event_sessions
  ADD COLUMN title text,
  ADD COLUMN modality public.event_modality NOT NULL DEFAULT 'presencial';

-- Drop the old session_status default, alter column type
ALTER TABLE public.event_sessions
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.event_sessions
  ALTER COLUMN status TYPE public.schedule_status_v2
  USING CASE status::text
    WHEN 'planejada' THEN 'agendada'::public.schedule_status_v2
    WHEN 'confirmada' THEN 'confirmada'::public.schedule_status_v2
    WHEN 'realizada' THEN 'realizada'::public.schedule_status_v2
    WHEN 'cancelada' THEN 'cancelada'::public.schedule_status_v2
    ELSE 'agendada'::public.schedule_status_v2
  END;

ALTER TABLE public.event_sessions
  ALTER COLUMN status SET DEFAULT 'agendada'::public.schedule_status_v2;

-- event_assignments: add payment fields
ALTER TABLE public.event_assignments
  ADD COLUMN payment_mode public.payment_mode NOT NULL DEFAULT 'por_sessao',
  ADD COLUMN quantity numeric NOT NULL DEFAULT 1,
  ADD COLUMN unit_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN total_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN service_role text;

-- =============================================
-- PHASE 3: NEW TABLES
-- =============================================

-- event_services
CREATE TABLE public.event_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_type public.service_type NOT NULL DEFAULT 'outro',
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  billing_mode public.billing_mode NOT NULL DEFAULT 'valor_fechado',
  expected_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage event_services" ON public.event_services FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_services" ON public.event_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_services" ON public.event_services FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_services" ON public.event_services FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

CREATE TRIGGER update_event_services_updated_at BEFORE UPDATE ON public.event_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- budget_items
CREATE TABLE public.budget_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.event_quotes(id) ON DELETE CASCADE,
  service_type public.service_type NOT NULL DEFAULT 'outro',
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text,
  unit_value numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage budget_items" ON public.budget_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view budget_items" ON public.budget_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert budget_items" ON public.budget_items FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update budget_items" ON public.budget_items FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- tax_settings
CREATE TABLE public.tax_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Simples Nacional',
  percentage numeric NOT NULL DEFAULT 6,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage tax_settings" ON public.tax_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view tax_settings" ON public.tax_settings FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_tax_settings_updated_at BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tax setting
INSERT INTO public.tax_settings (name, percentage, is_default) VALUES ('Simples Nacional', 6, true);
