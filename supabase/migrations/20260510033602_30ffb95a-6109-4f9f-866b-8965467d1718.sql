ALTER TABLE public.events ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT '{}';

UPDATE public.events
SET service_types = ARRAY[event_type::text]
WHERE (service_types IS NULL OR array_length(service_types, 1) IS NULL) AND event_type IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_events_event_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.service_types IS NOT NULL AND array_length(NEW.service_types, 1) > 0 THEN
    BEGIN
      NEW.event_type := NEW.service_types[1]::event_type_enum;
    EXCEPTION WHEN others THEN
      -- ignora se valor não cabe no enum
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_events_event_type ON public.events;
CREATE TRIGGER trg_sync_events_event_type
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_events_event_type();