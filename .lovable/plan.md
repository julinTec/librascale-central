

## Evolução do Sistema: Gestão Operacional-Financeira de Eventos

Transformação do sistema atual de agenda operacional para gestão de eventos de acessibilidade com fluxo completo: Orçamento → Evento → Sessões → Intérpretes → Financeiro → Relatórios.

### O que será preservado
- Autenticação, perfis, roles (`AuthContext`, `Login`, `SettingsPage`)
- Layout (`AppLayout`, `SidebarProvider`, sidebar structure)
- Cadastro de Clientes e Intérpretes (páginas e tabelas)
- Integração com banco de dados, padrão visual, componentes UI
- Tabelas: `clients`, `interpreters`, `profiles`, `user_roles`

### O que será substituído
- Menu lateral e rotas (novo menu com 9 itens)
- Páginas: Agenda, Execução, Ocorrências, Fechamento, Auditoria → removidas da navegação
- Dashboard → reescrito com KPIs financeiros de eventos

---

### Fase 1 — Banco de dados (7 novas tabelas via migrations)

**Tabela `event_quotes`** — Orçamentos
- `id`, `client_id` (FK clients), `event_name`, `event_type`, `venue`, `start_date`, `end_date`, `sessions_count`, `quoted_value`, `status` (enum: recebido, em_orcamento, enviado, aprovado, recusado, cancelado), `source_channel`, `notes`, `created_by`, `created_at`, `updated_at`

**Tabela `events`** — Eventos
- `id`, `client_id` (FK clients), `quote_id` (FK event_quotes, nullable), `event_name`, `description`, `venue`, `contract_value`, `status` (enum: planejado, confirmado, em_execucao, concluido, faturado, encerrado, cancelado), `start_date`, `end_date`, `notes`, `created_by`, `created_at`, `updated_at`

**Tabela `event_sessions`** — Sessões
- `id`, `event_id` (FK events), `session_date`, `start_time`, `end_time`, `duration_minutes`, `location`, `notes`, `status` (enum: planejada, confirmada, realizada, cancelada), `created_at`, `updated_at`

**Tabela `event_assignments`** — Escala de intérpretes
- `id`, `session_id` (FK event_sessions), `interpreter_id` (FK interpreters), `role`, `fee_expected`, `fee_final`, `transport_expected`, `transport_final`, `notes`, `payment_status` (enum: pendente, parcialmente_pago, pago), `created_at`, `updated_at`

**Tabela `event_expenses`** — Despesas
- `id`, `event_id` (FK events), `session_id` (FK event_sessions, nullable), `interpreter_id` (FK interpreters, nullable), `expense_type` (enum: cache, transporte, alimentacao, hospedagem, taxa, outro), `description`, `amount`, `expense_date`, `notes`, `created_at`

**Tabela `event_receivables`** — Contas a receber
- `id`, `event_id` (FK events), `amount`, `due_date`, `received_date`, `invoice_number`, `status` (enum: pendente, recebido_parcial, recebido, vencido), `notes`, `created_at`, `updated_at`

**Tabela `event_payables`** — Contas a pagar
- `id`, `event_id` (FK events), `interpreter_id` (FK interpreters, nullable), `assignment_id` (FK event_assignments, nullable), `amount`, `due_date`, `paid_date`, `status` (enum: pendente, pago_parcial, pago, vencido), `notes`, `created_at`, `updated_at`

**RLS**: Todas as tabelas seguirão o mesmo padrão existente — admin ALL, authenticated SELECT, operacional INSERT/UPDATE.

---

### Fase 2 — Navegação e rotas

**`src/components/AppSidebar.tsx`** — Novo menu:
- Dashboard (`/dashboard`), Clientes (`/clientes`), Intérpretes (`/interpretes`), Orçamentos (`/orcamentos`), Eventos (`/eventos`), Sessões (`/sessoes`), Financeiro (`/financeiro`), Relatórios (`/relatorios`), Configurações (`/configuracoes`)

**`src/App.tsx`** — Novas rotas substituindo as antigas:
- Remover rotas: `/agenda`, `/execucao`, `/ocorrencias`, `/fechamento`, `/auditoria`
- Adicionar: `/orcamentos`, `/eventos`, `/sessoes`, `/financeiro`, `/relatorios`

**`src/lib/constants.ts`** — Adicionar labels para os novos enums (status de orçamento, evento, sessão, pagamento, despesas, receivables, payables).

---

### Fase 3 — Novas páginas (CRUD completo)

Cada página seguirá o padrão existente (Clients/Interpreters): listagem com filtros, dialog para criar/editar, tabela com ações.

1. **`src/pages/Quotes.tsx`** — Orçamentos
   - Lista com filtros (cliente, status), busca por nome do evento
   - Dialog de criação/edição com todos os campos
   - Botão "Converter em Evento" para orçamentos aprovados (cria registro em `events` com `quote_id`)

2. **`src/pages/Events.tsx`** — Eventos
   - Lista com filtros (cliente, status), cards de resumo (total eventos, valor contratado)
   - Dialog de criação/edição
   - Link para ver sessões do evento e financeiro

3. **`src/pages/Sessions.tsx`** — Sessões
   - Lista com filtro por evento e data
   - Dialog de criação/edição
   - Seção expandível para ver/gerenciar intérpretes escalados (assignments)
   - Dentro de cada sessão: vincular intérpretes com cachê e transporte

4. **`src/pages/Finance.tsx`** — Financeiro
   - Tabs: "A Receber" e "A Pagar"
   - Cada tab com listagem, filtros (status, evento, cliente), dialog para registrar/editar
   - KPIs no topo: total pendente a receber, total pendente a pagar, saldo

5. **`src/pages/Reports.tsx`** — Relatórios
   - Cards/tabelas com: custo por evento, valor recebido por evento, margem por evento, pagamentos por intérprete, despesas por período
   - Filtros de período

---

### Fase 4 — Dashboard atualizado

**`src/pages/Dashboard.tsx`** — Reescrever KPIs e gráficos:
- KPIs: Eventos no mês, Valor total fechado, Total a receber, Total a pagar, Margem prevista, Pagamentos pendentes
- Gráficos: Eventos por status (pie), Volume financeiro por cliente (bar)
- Manter filtros de Data/Mês/Ano já implementados

---

### Ordem de implementação

Dada a complexidade, a implementação será feita em etapas incrementais:

1. **Migração do banco** — Criar todas as 7 tabelas com enums e RLS
2. **Constants e tipos** — Adicionar labels para novos enums
3. **Navegação** — Atualizar sidebar, rotas no App.tsx
4. **Página de Orçamentos** — CRUD completo + conversão em evento
5. **Página de Eventos** — CRUD completo
6. **Página de Sessões** — CRUD + gestão de assignments (intérpretes)
7. **Página Financeiro** — Tabs a receber/pagar
8. **Página Relatórios** — Visão consolidada
9. **Dashboard** — Novos KPIs financeiros

Cada etapa será entregue de forma funcional e navegável antes de avançar para a próxima.

