

## Reestruturação do Sistema — Nosso Mundo Gestão v2

Readaptação completa da lógica de negócio mantendo identidade visual, autenticação, layout e integração existentes.

---

### Resumo das mudanças

O sistema atual modela eventos de forma simples (evento → sessões → assignments). A nova versão precisa suportar:
- Eventos sem cliente obrigatório
- Múltiplos serviços por evento
- Agenda operacional (substituindo "Sessões")
- Alocação de profissionais com modalidades de pagamento variáveis
- Receitas com cálculo automático de imposto (percentual)
- Faturamento mensal dentro do mesmo evento
- Lucro por evento e por mês
- Tipo profissional expandido (não só intérpretes)

---

### Fase 1 — Banco de dados (migration)

**Alterações em tabelas existentes:**

1. **`interpreters`** — adicionar coluna `professional_type` (enum: `interprete_libras`, `audiodescritor`, `consultor`, `locutor`, `assistente`, `outro`)

2. **`events`** — adicionar colunas:
   - `event_type` (enum: `evento_pontual`, `temporada`, `palestra`, `gravacao`, `servico_administrativo`, `video_remoto`, `outro`)
   - `modality` (enum: `presencial`, `remoto`, `hibrido`)
   - `billing_type` (enum: `unico`, `por_sessao`, `mensal`, `fechado_periodo`, `misto`)
   - Tornar `client_id` nullable (já é nullable? verificar — atualmente `NOT NULL`)

3. **`event_quotes`** — tornar `client_id` nullable

**Novas tabelas:**

4. **`event_services`** — Serviços do evento
   - `id`, `event_id` (FK events), `service_type` (enum), `description`, `quantity`, `billing_mode` (enum: `por_sessao`, `por_diaria`, `valor_fechado`, `valor_mensal`, `item_unico`), `expected_value`, `notes`, `created_at`

5. **`budget_items`** — Itens do orçamento
   - `id`, `quote_id` (FK event_quotes), `service_type`, `description`, `quantity`, `unit`, `unit_value`, `total_value`, `is_recurring` (boolean), `notes`, `created_at`

6. **`tax_settings`** — Configurações de imposto
   - `id`, `name`, `percentage`, `is_default` (boolean), `created_at`

**Alterações em tabelas existentes:**

7. **`event_receivables`** — adicionar colunas:
   - `tax_percentage` (numeric, default 0)
   - `tax_amount` (numeric, default 0)
   - `net_amount` (numeric, default 0)
   - `revenue_type` (enum: `faturamento_sessao`, `faturamento_mensal`, `faturamento_unico`, `valor_adicional`, `outro`)
   - `competence_date` (date) — mês de competência
   - `description` (text)
   - `client_id` (uuid, nullable)

8. **`event_payables`** — adicionar colunas:
   - `cost_type` (enum: `mao_de_obra`, `aluguel_equipamento`, `imposto`, `deslocamento`, `alimentacao`, `hospedagem`, `outro`)
   - `competence_date` (date)
   - `description` (text)
   - `schedule_id` (uuid, nullable) — referência à agenda

9. **`event_sessions`** → renomear conceitualmente para "Agenda" (manter tabela mas adicionar):
   - `title` (text)
   - `modality` (text)
   - Novos status: `agendada`, `confirmada`, `realizada`, `cancelada`, `reagendada`

10. **`event_assignments`** — adicionar:
    - `payment_mode` (enum: `por_sessao`, `por_diaria`, `valor_fechado`)
    - `quantity` (numeric, default 1)
    - `unit_value` (numeric)
    - `total_value` (numeric)
    - `service_role` (text) — função/tipo de prestação

**RLS**: Mesmo padrão existente (admin ALL, authenticated SELECT, operacional INSERT/UPDATE).

**Dados de exemplo**: Inserir clientes fictícios (Teatro Porto, Teatro FAAP, etc.), profissionais, eventos e serviços para demonstração.

---

### Fase 2 — Constants e navegação

**`src/lib/constants.ts`**:
- Adicionar labels para novos enums (professional_type, event_type, modality, billing_type, service_type, billing_mode, revenue_type, cost_type, payment_mode, schedule_status atualizado)

**`src/components/AppSidebar.tsx`**:
- Trocar "Sessões" por "Agenda" (`/agenda`)
- Manter demais itens

**`src/App.tsx`**:
- Trocar rota `/sessoes` por `/agenda`
- Importar página Agenda (renomear Sessions)

---

### Fase 3 — Páginas atualizadas

**1. Intérpretes/Profissionais** (`src/pages/Interpreters.tsx`):
- Adicionar campo `professional_type` no form e na tabela
- Adicionar coluna "Tipo" na listagem

**2. Orçamentos** (`src/pages/Quotes.tsx`):
- Tornar cliente opcional (permitir valor vazio)
- Adicionar seção de itens do orçamento (budget_items) com CRUD inline
- Mostrar total calculado dos itens

**3. Eventos** (`src/pages/Events.tsx`):
- Cliente opcional
- Adicionar campos: event_type, modality, billing_type
- Adicionar aba/seção de "Serviços do Evento" (event_services) com CRUD inline
- Mostrar resumo de serviços vinculados

**4. Agenda** (renomear `src/pages/Sessions.tsx` → atualizar):
- Renomear título para "Agenda"
- Adicionar campo `title` e `modality`
- Usar novos status (agendada, confirmada, realizada, cancelada, reagendada)
- Alertas visuais: agenda sem profissional, conflito de horário (verificação client-side)

**5. Financeiro** (`src/pages/Finance.tsx`):
- **Receitas**: adicionar campos tax_percentage, calcular tax_amount e net_amount automaticamente, campo revenue_type, competence_date, description, client_id opcional
- **Custos**: adicionar campos cost_type, competence_date, description
- KPIs atualizados com valores líquidos
- Exibir lucro do período filtrado

**6. Dashboard** (`src/pages/Dashboard.tsx`):
- Adicionar KPI "Lucro Real" (receitas líquidas - custos pagos)
- Gráfico de lucro por evento
- Gráfico de custos por tipo
- Bloco de alertas operacionais (agendas sem profissional, conflitos)
- Próximas agendas

**7. Relatórios** (`src/pages/Reports.tsx`):
- Lucro por evento
- Lucro por mês
- Custos por tipo
- Receitas por tipo de serviço

**8. Configurações** (`src/pages/SettingsPage.tsx`):
- Adicionar seção "Imposto Padrão" (CRUD em tax_settings) para definir percentual padrão do Simples Nacional

---

### Fase 4 — Dados de exemplo

Inserir via migration ou insert tool:
- 4 clientes fictícios
- 5 profissionais de tipos variados
- 5 eventos com serviços vinculados
- Agendas, alocações, receitas e custos de exemplo

---

### Ordem de implementação

Dada a complexidade, será feito em etapas incrementais:

1. **Migration** — Novas tabelas, colunas e enums
2. **Constants + Navegação** — Labels, sidebar, rotas
3. **Profissionais** — Campo tipo profissional
4. **Orçamentos** — Cliente opcional + itens
5. **Eventos** — Novos campos + serviços do evento
6. **Agenda** — Renomear + novos campos + alertas
7. **Financeiro** — Imposto automático + tipos + lucro
8. **Configurações** — Tax settings
9. **Dashboard** — Lucro real + novos gráficos + alertas
10. **Relatórios** — Lucro por evento/mês
11. **Dados de exemplo**

