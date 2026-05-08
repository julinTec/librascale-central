# Criar 3 usuários admin (migração de usuários)

## Contexto
Os dados de negócio (17 tabelas) já foram migrados com sucesso. Os 3 usuários do projeto original ainda não existem neste banco.

## Tarefas
1. Criar os 3 usuários em `auth.users` via `supabase.auth.admin.createUser` preservando os UUIDs originais:
   - Julio Cezar — juliocezarvieira21@gmail.com
   - Jefferson Rosa — jefferson.nossomundodiversidade@gmail.com
   - Administração Nosso Mundo — adm.nossomundotalentos@gmail.com
2. O trigger `handle_new_user` cria automaticamente `profiles` e `user_roles` com role `operacional`.
3. Atualizar `user_roles` para `admin` nos 3 registros.
4. Validar: verificar que `profiles` e `user_roles` têm os 3 registros corretos.

## Detalhes técnicos
- Script Node.js usando `@supabase/supabase-js` com Service Role Key.
- Senha temporária: `NossoMundo@2026` para todos (usuários trocam depois via "Esqueci minha senha").
- UUIDs originais preservados para manter integridade das colunas `created_by`.
