
-- Drop and recreate FKs with ON DELETE SET NULL (or CASCADE where appropriate)
ALTER TABLE public.execution_logs DROP CONSTRAINT execution_logs_created_by_fkey;
ALTER TABLE public.execution_logs ADD CONSTRAINT execution_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.incidents DROP CONSTRAINT incidents_reported_by_fkey;
ALTER TABLE public.incidents ADD CONSTRAINT incidents_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.period_closings DROP CONSTRAINT period_closings_created_by_fkey;
ALTER TABLE public.period_closings ADD CONSTRAINT period_closings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.clients DROP CONSTRAINT clients_created_by_fkey;
ALTER TABLE public.clients ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.interpreters DROP CONSTRAINT interpreters_created_by_fkey;
ALTER TABLE public.interpreters ADD CONSTRAINT interpreters_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.interpreters DROP CONSTRAINT interpreters_user_id_fkey;
ALTER TABLE public.interpreters ADD CONSTRAINT interpreters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.schedules DROP CONSTRAINT schedules_created_by_fkey;
ALTER TABLE public.schedules ADD CONSTRAINT schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.schedules DROP CONSTRAINT schedules_updated_by_fkey;
ALTER TABLE public.schedules ADD CONSTRAINT schedules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
