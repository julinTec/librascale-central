-- 1. Trigger ausente em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill profiles
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name',''), u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. Backfill roles default operacional
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'operacional'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;