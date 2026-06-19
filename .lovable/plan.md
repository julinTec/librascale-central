# Filtro de Profissional na Agenda

Adicionar um novo filtro "Profissional" na página **Agenda** (`src/pages/Schedules.tsx`), no mesmo padrão visual dos filtros já existentes (Status, Cliente, datas).

## Alterações em `src/pages/Schedules.tsx`

1. **Novo estado**: `filterInterpreter` (default `'all'`).
2. **Novo Select** na barra de filtros, posicionado logo após o filtro de Cliente:
   - Largura `w-52`, placeholder "Profissional".
   - Opção "Todos os profissionais".
   - Lista populada a partir do array `interpreters` já carregado em `loadRefs()` (ordenado por nome, ativos).
3. **Lógica de filtragem** em `filtered`: descartar agendas em que `s.interpreter_id !== filterInterpreter` quando o filtro estiver ativo.
4. Nenhuma mudança em schema, queries ou formulários — apenas UI/filtragem no client.

Resultado: o usuário poderá refinar a lista/calendário da Agenda por profissional, combinando com os demais filtros existentes.
