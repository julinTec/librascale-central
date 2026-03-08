

## Adicionar "Valor Total a Pagar" no Fechamento

O cálculo será: **Horas Faturáveis × Valor/Hora** (campo `hour_rate` da tabela `contract_hours`).

### Mudanças em `src/pages/Closing.tsx`

1. **Query**: Buscar também `contract_hours` para cada cliente no período, pegando o `hour_rate` aplicável.
   - Ao agrupar por cliente, buscar o `hour_rate` do `contract_hours` cujo período coincide com o filtro selecionado.
   - Fallback: se não houver contrato no período, usar `additional_hour_rate` do cliente.

2. **Cálculo por cliente**: Adicionar campo `total_value = billable × hour_rate`.

3. **KPI Cards**: Adicionar card "Valor Total" com soma de `total_value` de todos os clientes.

4. **Tabela**: Adicionar coluna "Valor Total (R$)" mostrando `total_value` por cliente.

### Detalhes técnicos

- Fazer query separada em `contract_hours` filtrando por `period_start <= periodEnd` e `period_end >= periodStart` para pegar contratos do período.
- Montar um map `client_id → hour_rate` para lookup rápido.
- Grid de KPIs passa de 6 para 7 itens (ajustar grid para `lg:grid-cols-7`).
- Coluna da tabela passa de 8 para 9 (ajustar colspan do empty state).

