# Exclusão de registros + correção de conflitos de horário

## 1. Exclusão em Profissionais (`src/pages/Interpreters.tsx`)
- Adicionar botão lixeira na coluna de ações.
- Antes de excluir, verificar se o profissional possui `event_assignments`. Se sim, bloquear com toast: "Profissional possui alocações vinculadas. Inative em vez de excluir."
- Se não houver vínculos, abrir `AlertDialog` de confirmação e executar `delete().eq('id', ...)`.
- Recarregar a lista após sucesso.

## 2. Exclusão em Eventos (`src/pages/Events.tsx`)
- Adicionar botão lixeira na coluna Ações.
- Criar uma função SQL `delete_event_cascade(_event_id uuid)` (SECURITY DEFINER, restrita a admin/operacional) que apaga em ordem:
  - `event_assignments` (via sessions do evento)
  - `event_sessions`
  - `event_expenses`
  - `event_payables`
  - `event_receivables`
  - `event_services`
  - `events`
- No frontend, abrir `AlertDialog` de confirmação avisando que receitas, agendas, alocações e despesas vinculadas também serão removidas. Chamar via `supabase.rpc('delete_event_cascade', { _event_id })`.

## 3. Exclusão em Agenda (`src/pages/Sessions.tsx`)
- Adicionar botão lixeira na linha da agenda e também na linha de cada alocação (dentro do expand).
- Para agenda: verificar `event_assignments` da sessão; se houver, mostrar confirmação avisando "X profissionais alocados serão removidos". Excluir `event_assignments` (where session_id) e depois `event_sessions`.
- Para alocação: confirmação simples e `delete` em `event_assignments`.
- Recarregar lista/expand após.

## 4. Correção de conflitos de horário (`src/pages/Sessions.tsx`)
Hoje a função `hasConflict` marca conflito sempre que duas sessões se sobrepõem no tempo, mesmo que sejam de eventos diferentes ou tenham profissionais distintos — o que não é um conflito real.

Nova lógica:
- Conflito real = mesmo **profissional alocado** em duas sessões com sobreposição de horário.
- Carregar todas as alocações (uma vez, ao montar a lista) num mapa `sessionId -> interpreter_ids[]`.
- `hasConflict(s)` retorna true se existir outra sessão `s'` (status ≠ cancelada) onde:
  - `s.session_date === s'.session_date`
  - há sobreposição de `start_time/end_time`
  - existe pelo menos um `interpreter_id` em comum entre as alocações de `s` e `s'`
- Tooltip do ícone passa a indicar qual profissional está em conflito (ex.: "Conflito: João Silva também alocado em outra agenda neste horário").
- Se a sessão não tiver alocações, nunca marcar conflito.

## Observações técnicas
- RLS atual já permite `DELETE` para admin via "Admin can manage" (ALL). Como todos os 3 usuários são admin, a exclusão funcionará.
- `delete_event_cascade` será criado via migração para garantir atomicidade e evitar múltiplas chamadas do client.
