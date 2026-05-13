# Central de Notificações (Sino) — Plano de Implementação

## Escopo final dos alertas

### 🗓️ Eventos
- Iniciando **hoje** (`start_date = hoje`, status ≠ cancelado/realizado)
- Iniciando nos **próximos 7 dias**
- **Sem nenhuma agenda criada** (events sem `event_sessions` vinculados)

### 📅 Agenda
- Sessões nos **próximos 3 dias sem profissional alocado**
- Sessões **hoje** ainda com status `agendada` (pendente confirmação)
- Sessões **passadas** sem registro de execução (`session_date < hoje` e status `agendada`/`confirmada`)
- **Conflitos** de profissional (mesmo `interpreter_id` em sessões sobrepostas)

### 📨 Pré-cadastros
- `quote_intakes` com status `recebido` (devolvidos pelo cliente)
- `quote_intakes` `aguardando` com `expires_at` em ≤ 2 dias (link prestes a expirar)

### 💰 Financeiro
- Recebíveis **vencidos** (`due_date < hoje`, status `pendente`/`vencido`)
- Pagamentos **vencidos** (`event_payables` com `due_date < hoje`, status `pendente`/`vencido`)

---

## UX

Sino no header (`AppLayout.tsx`), à direita do `SidebarTrigger`, com badge vermelho do total não-visualizado. Clique abre **Popover** com 4 grupos colapsados. Cada item é clicável e navega para a página/filtro correspondente:

- Evento → `/eventos`
- Agenda → `/agenda`
- Pré-cadastro → `/orcamentos` (aba Pré-cadastros)
- Financeiro → `/financeiro`

Botão **"Marcar todas como vistas"** no rodapé. Estado de "visto" em `localStorage` por usuário (sem nova tabela). Alertas reaparecem se a condição persistir após nova ocorrência.

```text
🔔(9)
 ▼
┌──────────────────────────┐
│ Notificações       (9)   │
├──────────────────────────┤
│ 🗓️  Eventos (3)          │
│ 📅 Agenda (4)            │
│ 📨 Pré-cadastros (1)     │
│ 💰 Financeiro (1)        │
├──────────────────────────┤
│  Marcar todas como vistas│
└──────────────────────────┘
```

Atualização **realtime** via Supabase channels nas tabelas `events`, `event_sessions`, `event_assignments`, `quote_intakes`, `event_receivables`, `event_payables` + recarga ao montar.

---

## Decisões assumidas (avise se quiser mudar)
- **Sidebar badge de pré-cadastros**: mantido em paralelo ao sino (não remove)
- **Permissões**: visível para `admin` e `operacional` (mesmas regras das tabelas envolvidas)
- **Janelas**: 7 dias (eventos), 3 dias (agenda sem profissional), 2 dias (intakes a expirar)

---

## Arquivos

**Novos:**
- `src/hooks/useNotifications.ts` — busca consolidada via `Promise.all`, calcula conflitos em memória, retorna `{ groups, total, markAllSeen }`, com subscriptions realtime
- `src/components/NotificationBell.tsx` — ícone `Bell` (lucide), Badge, Popover com lista agrupada e itens clicáveis (`useNavigate`)

**Editados:**
- `src/components/AppLayout.tsx` — inserir `<NotificationBell />` no header, à direita

**Sem migrações** — todos os alertas são derivados de queries em tabelas existentes.

---

## Detalhes técnicos

- Queries paralelas filtradas por data (`gte`/`lte`) para evitar trazer dados desnecessários
- Conflitos: agrupar `event_assignments` por (`interpreter_id`, `session_date`) e detectar sobreposição de horários client-side
- "Sem agenda criada": `LEFT JOIN`-style via duas queries (`events` próximos + `event_sessions.event_id` distintos) e diff em memória
- `localStorage` key: `notif_seen_${user_id}` armazenando array de IDs de alerta vistos (formato `${categoria}:${entidade_id}:${tipo}`)
- Auto-refetch a cada 60s + invalidação imediata via realtime
