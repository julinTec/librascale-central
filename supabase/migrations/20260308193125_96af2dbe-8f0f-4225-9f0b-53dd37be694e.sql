
-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'operacional', 'gestor', 'interprete');
CREATE TYPE public.schedule_status AS ENUM ('planejada', 'confirmada', 'em_execucao', 'concluida', 'cancelada', 'reprogramada');
CREATE TYPE public.execution_status AS ENUM ('realizada_normalmente', 'atraso_cliente', 'atraso_interno', 'cancelada_cliente', 'cancelada_internamente', 'parcialmente_realizada', 'regravada', 'nao_realizada');
CREATE TYPE public.incident_type AS ENUM ('atraso_cliente', 'atraso_interno', 'cancelamento_cliente', 'cancelamento_interno', 'mudanca_horario', 'mudanca_conteudo', 'reducao_duracao', 'ampliacao_duracao', 'ausencia_interprete', 'problema_tecnico', 'divergencia_fechamento', 'outro');
CREATE TYPE public.incident_status AS ENUM ('aberta', 'em_analise', 'resolvida', 'encerrada');
CREATE TYPE public.activity_modality AS ENUM ('estudio', 'remoto', 'ao_vivo', 'hibrido');
CREATE TYPE public.activity_type AS ENUM ('gravacao_estudio', 'gravacao_remota', 'ao_vivo_estudio', 'formacao', 'regravacao', 'outro');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'operacional',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'gestor' THEN 2 
      WHEN 'operacional' THEN 3 
      WHEN 'interprete' THEN 4 
    END
  LIMIT 1
$$;

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  main_contact TEXT,
  email TEXT,
  phone TEXT,
  contract_type TEXT,
  monthly_hours_package NUMERIC(10,2) DEFAULT 0,
  additional_hour_rate NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Interpreters table
CREATE TABLE public.interpreters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  employment_type TEXT,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  specialty TEXT,
  default_availability TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interpreters ENABLE ROW LEVEL SECURITY;

-- Schedules table (core)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  activity_date DATE NOT NULL,
  planned_start TIME NOT NULL,
  planned_end TIME NOT NULL,
  planned_duration_minutes INTEGER,
  interpreter_id UUID NOT NULL REFERENCES public.interpreters(id),
  activity_type activity_type NOT NULL DEFAULT 'gravacao_estudio',
  modality activity_modality NOT NULL DEFAULT 'estudio',
  location TEXT,
  title TEXT,
  internal_code TEXT,
  notes TEXT,
  status schedule_status NOT NULL DEFAULT 'planejada',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Schedule audit logs
CREATE TABLE public.schedule_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT
);
ALTER TABLE public.schedule_audit_logs ENABLE ROW LEVEL SECURITY;

-- Execution logs
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL UNIQUE REFERENCES public.schedules(id),
  actual_start TIME,
  actual_end TIME,
  actual_duration_minutes INTEGER,
  worked_hours NUMERIC(10,2) DEFAULT 0,
  billable_hours NUMERIC(10,2) DEFAULT 0,
  execution_status execution_status NOT NULL DEFAULT 'realizada_normalmente',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id),
  client_id UUID REFERENCES public.clients(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  incident_type incident_type NOT NULL,
  reported_by UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  impact_minutes INTEGER DEFAULT 0,
  estimated_financial_impact NUMERIC(10,2) DEFAULT 0,
  status incident_status NOT NULL DEFAULT 'aberta',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Contract hours
CREATE TABLE public.contract_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  contracted_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  hour_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  additional_hour_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_hours ENABLE ROW LEVEL SECURITY;

-- Period closings
CREATE TABLE public.period_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  planned_hours NUMERIC(10,2) DEFAULT 0,
  realized_hours NUMERIC(10,2) DEFAULT 0,
  billable_hours NUMERIC(10,2) DEFAULT 0,
  unused_hours NUMERIC(10,2) DEFAULT 0,
  package_balance NUMERIC(10,2) DEFAULT 0,
  additional_hours NUMERIC(10,2) DEFAULT 0,
  total_value NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.period_closings ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interpreters_updated_at BEFORE UPDATE ON public.interpreters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_execution_logs_updated_at BEFORE UPDATE ON public.execution_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contract_hours_updated_at BEFORE UPDATE ON public.contract_hours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_period_closings_updated_at BEFORE UPDATE ON public.period_closings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  -- Default role: operacional
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operacional');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate planned_duration_minutes
CREATE OR REPLACE FUNCTION public.calc_schedule_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.planned_duration_minutes := EXTRACT(EPOCH FROM (NEW.planned_end - NEW.planned_start)) / 60;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calc_schedule_duration_trigger
  BEFORE INSERT OR UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.calc_schedule_duration();

-- RLS Policies

-- Profiles: users see own, admins/gestores see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestores can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles: admins manage, users read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Clients: authenticated can read, admin/operacional can write
CREATE POLICY "Authenticated can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can manage clients" ON public.clients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update clients" ON public.clients FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- Interpreters: authenticated can read, admin/operacional can write
CREATE POLICY "Authenticated can view interpreters" ON public.interpreters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage interpreters" ON public.interpreters FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can manage interpreters" ON public.interpreters FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update interpreters" ON public.interpreters FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- Schedules: authenticated can read, admin/operacional can write, interpretes see own
CREATE POLICY "Authenticated can view schedules" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage schedules" ON public.schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can insert schedules" ON public.schedules FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update schedules" ON public.schedules FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- Audit logs: read by authenticated, insert by admin/operacional
CREATE POLICY "Authenticated can view audit logs" ON public.schedule_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert audit logs" ON public.schedule_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = changed_by);

-- Execution logs
CREATE POLICY "Authenticated can view execution logs" ON public.execution_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage execution logs" ON public.execution_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can insert execution logs" ON public.execution_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update execution logs" ON public.execution_logs FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- Incidents
CREATE POLICY "Authenticated can view incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage incidents" ON public.incidents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can insert incidents" ON public.incidents FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "Operacional can update incidents" ON public.incidents FOR UPDATE USING (public.has_role(auth.uid(), 'operacional'));

-- Contract hours
CREATE POLICY "Authenticated can view contract hours" ON public.contract_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage contract hours" ON public.contract_hours FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Period closings
CREATE POLICY "Authenticated can view closings" ON public.period_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage closings" ON public.period_closings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operacional can insert closings" ON public.period_closings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'operacional'));

-- Indexes
CREATE INDEX idx_schedules_client ON public.schedules(client_id);
CREATE INDEX idx_schedules_interpreter ON public.schedules(interpreter_id);
CREATE INDEX idx_schedules_date ON public.schedules(activity_date);
CREATE INDEX idx_schedules_status ON public.schedules(status);
CREATE INDEX idx_audit_schedule ON public.schedule_audit_logs(schedule_id);
CREATE INDEX idx_audit_changed_at ON public.schedule_audit_logs(changed_at);
CREATE INDEX idx_execution_schedule ON public.execution_logs(schedule_id);
CREATE INDEX idx_incidents_schedule ON public.incidents(schedule_id);
CREATE INDEX idx_incidents_client ON public.incidents(client_id);
CREATE INDEX idx_closings_client ON public.period_closings(client_id);
