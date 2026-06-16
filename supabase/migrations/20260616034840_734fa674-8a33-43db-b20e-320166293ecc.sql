
CREATE TABLE public.suporte_chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monitor_id text,
  titulo text NOT NULL,
  descricao text NOT NULL,
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'aberto',
  thread jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suporte_chamados TO authenticated;
GRANT ALL ON public.suporte_chamados TO service_role;

ALTER TABLE public.suporte_chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios chamados"
  ON public.suporte_chamados FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários criam seus próprios chamados"
  ON public.suporte_chamados FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins atualizam chamados"
  ON public.suporte_chamados FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins removem chamados"
  ON public.suporte_chamados FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX suporte_chamados_user_idx ON public.suporte_chamados(user_id, created_at DESC);
CREATE INDEX suporte_chamados_monitor_idx ON public.suporte_chamados(monitor_id);

CREATE TRIGGER update_suporte_chamados_updated_at
  BEFORE UPDATE ON public.suporte_chamados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
