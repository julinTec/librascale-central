# Editar usuários (nome, email, senha)

## O que será adicionado
Um botão de editar (ícone lápis) ao lado de cada usuário na tabela de "Usuários e Perfis", abrindo um diálogo para alterar:
- Nome completo
- Email
- Senha (opcional — se em branco, mantém atual)

## Mudanças

### 1. `supabase/functions/manage-users/index.ts`
Adicionar nova ação `update`:
- Recebe `user_id`, e opcionalmente `full_name`, `email`, `password`
- Usa `auth.admin.updateUserById` para alterar email/senha/metadata em `auth.users`
- Atualiza `profiles` (full_name, email) para refletir na UI
- Mantém validação de admin existente

### 2. `src/pages/SettingsPage.tsx`
- Novo state `editingUser` e `editForm`
- Botão `Pencil` na coluna Ações (ao lado da lixeira), também desabilitado para o próprio usuário logado se desejado — ou habilitado para todos incluindo si mesmo (recomendado para permitir trocar a própria senha)
- Diálogo de edição com campos: Nome, Email, Nova senha (placeholder "Deixe em branco para manter")
- Handler `handleUpdateUser` chama `manage-users` com action `update`, recarrega lista e mostra toast

## Observação
Senha mínima 6 caracteres (validação em backend e frontend). Email novo ficará automaticamente confirmado.
