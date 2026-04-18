-- Backfill: create a receivable for every event with contract_value > 0 that doesn't have one yet
INSERT INTO public.event_receivables (
  event_id, client_id, amount, tax_percentage, tax_amount, net_amount,
  status, revenue_type, competence_date, description
)
SELECT
  e.id,
  e.client_id,
  e.contract_value,
  COALESCE((SELECT percentage FROM public.tax_settings WHERE is_default = true LIMIT 1), 6),
  e.contract_value * COALESCE((SELECT percentage FROM public.tax_settings WHERE is_default = true LIMIT 1), 6) / 100,
  e.contract_value - (e.contract_value * COALESCE((SELECT percentage FROM public.tax_settings WHERE is_default = true LIMIT 1), 6) / 100),
  'pendente'::receivable_status,
  'faturamento_unico'::revenue_type,
  e.start_date,
  e.event_name
FROM public.events e
WHERE COALESCE(e.contract_value, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM public.event_receivables r WHERE r.event_id = e.id);