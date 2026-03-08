

## Filtro por Data e Contadores — Agenda e Execução

### Mudanças

**`src/pages/Schedules.tsx` (Agenda)**
- Adicionar filtros De/Até (inputs `type="date"`) na barra de filtros
- Filtrar por `activity_date` dentro do intervalo
- Contador: **"Qtde de Agendas: X"** (total filtrado)

**`src/pages/Execution.tsx` (Execução)**
- Adicionar filtros De/Até na barra de filtros
- Filtrar por `activity_date` dentro do intervalo
- Contador: **"Agendas Executadas: X"** (filtradas que possuem `execution_logs`)

