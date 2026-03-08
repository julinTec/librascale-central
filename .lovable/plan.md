

## Adicionar filtros de Data, Mês e Ano no Dashboard

Atualmente o Dashboard filtra automaticamente pelo mês corrente, sem opção de alteração. Vamos adicionar uma barra de filtros com 3 modos: **Data específica**, **Mês** e **Ano**.

### Mudanças em `src/pages/Dashboard.tsx`

1. **Estado de filtro**: Adicionar estado `filterMode` (`'date' | 'month' | 'year'`), `selectedDate`, `selectedMonth` (1-12), `selectedYear`.

2. **Barra de filtros** (entre o título e os KPIs):
   - 3 botões tipo toggle para selecionar o modo (Data / Mês / Ano)
   - Modo **Data**: Input date picker para escolher uma data específica
   - Modo **Mês**: Select de mês + Select de ano
   - Modo **Ano**: Select de ano

3. **Lógica de período**: Calcular `periodStart` e `periodEnd` com base no modo selecionado:
   - Data: `start = end = selectedDate`
   - Mês: `start = primeiro dia do mês`, `end = último dia do mês`
   - Ano: `start = 01/01`, `end = 31/12`

4. **Queries**: Substituir o filtro fixo `monthStart` por `.gte('activity_date', periodStart).lte('activity_date', periodEnd)` em todas as queries (schedules, execution_logs, incidents). A query de "Agenda do Dia" continua filtrando por hoje independente do filtro.

5. **Recarregar**: `useEffect` observa mudanças nos filtros e recarrega os dados.

6. **Default**: Iniciar no modo "Mês" com mês e ano atuais (comportamento atual).

### Componentes utilizados
- `Select` / `SelectItem` para mês e ano
- `Input` type="date" ou Popover+Calendar para data
- `Button` com variantes para toggle de modo

