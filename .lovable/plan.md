## Diagnóstico

O erro `new row violates row-level security policy for table "event_assignments"` aconteceu porque a usuária que tentou cadastrar o evento (**karina.nossomundodiversidade@gmail.com**) **não tem nenhuma role atribuída** em `user_roles`.

As políticas RLS de `event_assignments` (e da maioria das tabelas) só permitem INSERT para `admin` ou `operacional`. Sem role, qualquer escrita é bloqueada — mesmo a usuária estando autenticada.

### Causa raiz

A função `handle_new_user()` existe no banco e foi desenhada para criar automaticamente o profile e atribuir a role `operacional` a cada novo usuário. Porém **o trigger `on_auth_user_created` em `auth.users` não está instalado** (confirmado: não aparece em `pg_trigger`). Por isso a Karina foi criada sem role, e qualquer novo usuário criado depois também ficará sem role.

## Correção proposta

Migração única que resolve tudo:

1. **Criar o trigger ausente** em `auth.users` para executar `handle_new_user()` AFTER INSERT — garante que todo novo usuário ganhe profile + role `operacional` automaticamente.

2. **Backfill de profiles**: inserir em `public.profiles` qualquer `auth.users` que ainda não tenha profile (cobre Karina e qualquer outro caso histórico).

3. **Backfill de roles**: atribuir role `operacional` a qualquer `auth.users` que ainda não tenha entrada em `user_roles` (resolve o problema imediato da Karina).

### SQL resumido

```sql
-- 1. Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill profiles
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name',''), u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. Backfill roles (default operacional)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'operacional'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
```

## Resultado esperado

- Karina passa a ter role `operacional` e consegue salvar alocações em eventos imediatamente.
- Novos cadastros de usuário (via signup) recebem role automaticamente — não voltará a acontecer.
- Nenhuma alteração de UI necessária.

## Fora de escopo

- Promoção da Karina para `admin` ou `gestor`: se desejado, é feito manualmente em Configurações → Usuários depois.
- Revisão geral das políticas RLS das demais tabelas (estão consistentes com o modelo admin/operacional atual).
