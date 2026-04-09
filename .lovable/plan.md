

## Plano: Dashboard Gerencial + API Pública de Dados

### Visão Geral

Criar uma nova página "Dashboard Gerencial" para embutir relatórios Power BI, e uma Edge Function pública que expõe os dados do sistema como API REST para conexão direta com o Power BI.

---

### 1. Edge Function: `public-api`

Criar `supabase/functions/public-api/index.ts` — uma API pública (sem autenticação) que aceita um parâmetro `table` via query string e retorna os dados JSON.

**Tabelas expostas:**
- `clients`, `interpreters`, `events`, `event_sessions`, `event_assignments`, `event_services`, `event_quotes`, `budget_items`, `event_receivables`, `event_payables`, `event_expenses`, `schedules`, `execution_logs`, `incidents`, `contract_hours`, `period_closings`, `tax_settings`

**Endpoints:**
- `GET /public-api?table=events` → retorna todos os registros da tabela `events`
- `GET /public-api?table=clients` → retorna todos os registros de `clients`
- `GET /public-api` → retorna lista de tabelas disponíveis

A função usará o `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS (já que é pública e somente leitura). Apenas SELECT será permitido.

**Config:** Adicionar bloco em `supabase/config.toml` com `verify_jwt = false`.

### 2. Página: Dashboard Gerencial

Criar `src/pages/DashboardGerencial.tsx` com:
- Um campo de input para o usuário colar a URL de embed do Power BI
- Um `<iframe>` que renderiza o relatório Power BI
- Documentação inline mostrando a URL da API para configurar no Power BI como Web data source

### 3. Rota e navegação

- Adicionar rota `/dashboard-gerencial` em `src/App.tsx`
- Adicionar item "Dashboard Gerencial" no menu lateral em `src/components/AppSidebar.tsx` (ícone `BarChart3` ou similar)

---

### Detalhes Técnicos

**Edge Function (`public-api/index.ts`):**
- Whitelist de tabelas para evitar acesso a `profiles`, `user_roles` (dados sensíveis)
- Usa `createClient` com `SUPABASE_SERVICE_ROLE_KEY`
- Retorna JSON com CORS headers
- Limite de 10.000 registros por consulta
- Suporte a paginação via `?offset=0&limit=1000`

**Tabelas excluídas da API (segurança):**
- `profiles` (dados pessoais de usuários)
- `user_roles` (roles de acesso)
- `schedule_audit_logs` (logs internos)

