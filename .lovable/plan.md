# Migração: Projeto Original → Este Remix

## Origem
- Projeto: `jjlcfddjjbjaztuegxfa` (API pública aberta em `/functions/v1/public-api`)
- 3 usuários (CSVs anexados, todos `admin`):
  - Julio Cezar — juliocezarvieira21@gmail.com
  - Jefferson Rosa — jefferson.nossomundodiversidade@gmail.com
  - Administração Nosso Mundo — adm.nossomundotalentos@gmail.com

## Passo 1 — Importar dados de negócio (17 tabelas)

Script Node que paginará a API pública (`?table=X&limit=1000&offset=...`) e inserirá em lote no banco deste projeto via Service Role Key, **preservando IDs originais**, na ordem:

```
clients, interpreters, tax_settings, contract_hours,
event_quotes, budget_items, events, event_sessions,
event_assignments, event_services, event_receivables,
event_payables, event_expenses, schedules, execution_logs,
incidents, period_closings
```

Ao final: contagem origem × destino para validação.

## Passo 2 — Recriar os 3 usuários

Edge Function temporária (ou uso direto de `supabase.auth.admin.createUser`) que, para cada usuário do CSV:
1. Cria em `auth.users` com **o mesmo `id`** (UUID original) e uma senha temporária
2. O trigger `handle_new_user` cria automaticamente o `profiles` (com nome/email do CSV via `raw_user_meta_data`) e um `user_roles` com role `operacional`
3. Atualizo `user_roles` para `admin` conforme o CSV

Como os IDs são preservados, todas as colunas `created_by` das tabelas migradas continuam apontando para os usuários corretos.

**Senha temporária para todos:** `NossoMundo@2026` — cada usuário troca depois via "Esqueci minha senha" ou no perfil. (Me diga se prefere outra.)

## Passo 3 — Validação

- Login com cada um dos 3 e-mails
- Conferir contagem de clientes, eventos, financeiro vs. projeto original
- Verificar que `created_by` exibe o nome correto

## Riscos

- Se algum registro do projeto original tiver `created_by` apontando para um usuário **fora** desses 3, ficará órfão (sem nome). Não quebra nada.
- Senhas reais não são migráveis (Supabase só guarda hashes válidos no projeto de origem).

Posso prosseguir?
