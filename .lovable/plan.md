

## Diagnóstico

**Backend OK:** O usuário `jefferson.nossomundodiversidade@gmail.com` foi criado com sucesso (23:48 UTC), tem profile e role 'admin'. Existem 4 usuários no total.

**Causa do bug:** A query na linha 49 do `SettingsPage.tsx`:
```ts
supabase.from('profiles').select('*, user_roles(role)')
```

A tabela `profiles` **não tem foreign key** declarada para `user_roles` (confirmado nas tabelas do schema — `<foreign-keys>No foreign keys</foreign-keys>`). Sem FK, o PostgREST não consegue fazer o embed `user_roles(role)` e provavelmente retorna erro ou array vazio silenciosamente — por isso a lista não carrega o novo usuário (e talvez nenhum).

Além disso, há políticas RLS adequadas (admin vê todos os profiles e roles), então não é problema de permissão.

## Correção

Substituir a query embedada por **duas queries separadas** combinadas no client (padrão já usado no `AuthContext.tsx`):

```ts
const loadUsers = async () => {
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  const merged = (profiles || []).map(p => ({
    ...p,
    user_roles: roles?.filter(r => r.user_id === p.id) || [],
  }));
  setUsers(merged);
};
```

Isso mantém o formato `user.user_roles[0].role` que a UI já consome, sem depender de FK no PostgREST.

### Arquivo alterado
- `src/pages/SettingsPage.tsx` — função `loadUsers` (linhas 48-51)

