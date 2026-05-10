-- Status enum
DO $$ BEGIN
  CREATE TYPE public.quote_intake_status AS ENUM ('aguardando','recebido','convertido','descartado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.quote_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status public.quote_intake_status NOT NULL DEFAULT 'aguardando',
  created_by uuid,
  assigned_client_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  submitted_at timestamptz,
  converted_quote_id uuid,
  -- Campos preenchidos pelo cliente
  requester_name text,
  requester_email text,
  requester_phone text,
  company_name text,
  event_name text,
  service_types text[] NOT NULL DEFAULT '{}',
  modality text,
  venue text,
  start_date date,
  end_date date,
  sessions_count integer DEFAULT 1,
  description text,
  observations text,
  referral_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_intakes_token ON public.quote_intakes(token);
CREATE INDEX IF NOT EXISTS idx_quote_intakes_status ON public.quote_intakes(status);
CREATE INDEX IF NOT EXISTS idx_quote_intakes_created_at ON public.quote_intakes(created_at DESC);

ALTER TABLE public.quote_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage quote_intakes" ON public.quote_intakes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operacional can view quote_intakes" ON public.quote_intakes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'operacional'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operacional can insert quote_intakes" ON public.quote_intakes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'operacional'::app_role));

CREATE POLICY "Operacional can update quote_intakes" ON public.quote_intakes
  FOR UPDATE USING (has_role(auth.uid(), 'operacional'::app_role));

CREATE POLICY "Operacional can delete quote_intakes" ON public.quote_intakes
  FOR DELETE USING (has_role(auth.uid(), 'operacional'::app_role));

CREATE TRIGGER trg_quote_intakes_updated_at
  BEFORE UPDATE ON public.quote_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_intakes;