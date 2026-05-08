CREATE OR REPLACE FUNCTION public.delete_event_cascade(_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operacional'::app_role)) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  DELETE FROM event_assignments WHERE session_id IN (SELECT id FROM event_sessions WHERE event_id = _event_id);
  DELETE FROM event_sessions WHERE event_id = _event_id;
  DELETE FROM event_expenses WHERE event_id = _event_id;
  DELETE FROM event_payables WHERE event_id = _event_id;
  DELETE FROM event_receivables WHERE event_id = _event_id;
  DELETE FROM event_services WHERE event_id = _event_id;
  DELETE FROM events WHERE id = _event_id;
END;
$$;