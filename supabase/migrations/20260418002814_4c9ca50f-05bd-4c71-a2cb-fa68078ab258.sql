CREATE OR REPLACE FUNCTION public.delete_client_cascade(_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operacional'::app_role)) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  -- Apaga dependentes que referenciam o cliente direta ou indiretamente
  DELETE FROM event_assignments WHERE session_id IN (
    SELECT s.id FROM event_sessions s JOIN events e ON e.id = s.event_id WHERE e.client_id = _client_id
  );
  DELETE FROM event_sessions WHERE event_id IN (SELECT id FROM events WHERE client_id = _client_id);
  DELETE FROM event_expenses WHERE event_id IN (SELECT id FROM events WHERE client_id = _client_id);
  DELETE FROM event_payables WHERE event_id IN (SELECT id FROM events WHERE client_id = _client_id);
  DELETE FROM event_receivables WHERE event_id IN (SELECT id FROM events WHERE client_id = _client_id) OR client_id = _client_id;
  DELETE FROM event_services WHERE event_id IN (SELECT id FROM events WHERE client_id = _client_id);
  DELETE FROM events WHERE client_id = _client_id;

  DELETE FROM budget_items WHERE quote_id IN (SELECT id FROM event_quotes WHERE client_id = _client_id);
  DELETE FROM event_quotes WHERE client_id = _client_id;

  DELETE FROM execution_logs WHERE schedule_id IN (SELECT id FROM schedules WHERE client_id = _client_id);
  DELETE FROM schedule_audit_logs WHERE schedule_id IN (SELECT id FROM schedules WHERE client_id = _client_id);
  DELETE FROM incidents WHERE schedule_id IN (SELECT id FROM schedules WHERE client_id = _client_id) OR client_id = _client_id;
  DELETE FROM schedules WHERE client_id = _client_id;

  DELETE FROM contract_hours WHERE client_id = _client_id;
  DELETE FROM period_closings WHERE client_id = _client_id;

  DELETE FROM clients WHERE id = _client_id;
END;
$$;