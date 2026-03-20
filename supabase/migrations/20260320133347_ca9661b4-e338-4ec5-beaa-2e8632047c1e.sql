
-- Enums for the new event-centric system
CREATE TYPE public.quote_status AS ENUM ('recebido', 'em_orcamento', 'enviado', 'aprovado', 'recusado', 'cancelado');
CREATE TYPE public.event_status AS ENUM ('planejado', 'confirmado', 'em_execucao', 'concluido', 'faturado', 'encerrado', 'cancelado');
CREATE TYPE public.session_status AS ENUM ('planejada', 'confirmada', 'realizada', 'cancelada');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'parcialmente_pago', 'pago');
CREATE TYPE public.expense_type AS ENUM ('cache', 'transporte', 'alimentacao', 'hospedagem', 'taxa', 'outro');
CREATE TYPE public.receivable_status AS ENUM ('pendente', 'recebido_parcial', 'recebido', 'vencido');
CREATE TYPE public.payable_status AS ENUM ('pendente', 'pago_parcial', 'pago', 'vencido');

-- 1. event_quotes
CREATE TABLE public.event_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_type text,
  venue text,
  start_date date,
  end_date date,
  sessions_count integer DEFAULT 1,
  quoted_value numeric DEFAULT 0,
  status quote_status NOT NULL DEFAULT 'recebido',
  source_channel text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_quotes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_event_quotes_updated_at BEFORE UPDATE ON public.event_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage event_quotes" ON public.event_quotes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_quotes" ON public.event_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_quotes" ON public.event_quotes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_quotes" ON public.event_quotes FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 2. events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.event_quotes(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  description text,
  venue text,
  contract_value numeric DEFAULT 0,
  status event_status NOT NULL DEFAULT 'planejado',
  start_date date,
  end_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert events" ON public.events FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update events" ON public.events FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 3. event_sessions
CREATE TABLE public.event_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer,
  location text,
  notes text,
  status session_status NOT NULL DEFAULT 'planejada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_event_sessions_updated_at BEFORE UPDATE ON public.event_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage event_sessions" ON public.event_sessions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_sessions" ON public.event_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_sessions" ON public.event_sessions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_sessions" ON public.event_sessions FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 4. event_assignments
CREATE TABLE public.event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  interpreter_id uuid NOT NULL REFERENCES public.interpreters(id) ON DELETE CASCADE,
  role text,
  fee_expected numeric DEFAULT 0,
  fee_final numeric,
  transport_expected numeric DEFAULT 0,
  transport_final numeric,
  notes text,
  payment_status payment_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_event_assignments_updated_at BEFORE UPDATE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage event_assignments" ON public.event_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_assignments" ON public.event_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_assignments" ON public.event_assignments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_assignments" ON public.event_assignments FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 5. event_expenses
CREATE TABLE public.event_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.event_sessions(id) ON DELETE SET NULL,
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE SET NULL,
  expense_type expense_type NOT NULL DEFAULT 'outro',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage event_expenses" ON public.event_expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_expenses" ON public.event_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_expenses" ON public.event_expenses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_expenses" ON public.event_expenses FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 6. event_receivables
CREATE TABLE public.event_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  received_date date,
  invoice_number text,
  status receivable_status NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_receivables ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_event_receivables_updated_at BEFORE UPDATE ON public.event_receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage event_receivables" ON public.event_receivables FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_receivables" ON public.event_receivables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_receivables" ON public.event_receivables FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_receivables" ON public.event_receivables FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- 7. event_payables
CREATE TABLE public.event_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.event_assignments(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  paid_date date,
  status payable_status NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_payables ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_event_payables_updated_at BEFORE UPDATE ON public.event_payables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin can manage event_payables" ON public.event_payables FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view event_payables" ON public.event_payables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional can insert event_payables" ON public.event_payables FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update event_payables" ON public.event_payables FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));
