
CREATE POLICY "Operacional can delete event_quotes"
ON public.event_quotes
FOR DELETE
TO public
USING (has_role(auth.uid(), 'operacional'::app_role));

CREATE POLICY "Operacional can delete budget_items"
ON public.budget_items
FOR DELETE
TO public
USING (has_role(auth.uid(), 'operacional'::app_role));
