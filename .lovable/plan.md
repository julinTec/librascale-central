

## Itens Pendentes do Plano v2

### 1. Dashboard — Evolução (src/pages/Dashboard.tsx)
- Adicionar KPI "Lucro Real" (receitas líquidas recebidas - custos pagos)
- Adicionar gráfico "Lucro por Evento" (bar chart: receita líquida - custos por evento)
- Adicionar gráfico "Custos por Tipo" (pie chart: agrupado por `cost_type`)
- Adicionar bloco de alertas operacionais: agendas sem profissional alocado, agendas pendentes de confirmação
- Melhorar "Próximos Eventos" para incluir próximas agendas com horário

### 2. Relatórios — Novos relatórios (src/pages/Reports.tsx)
- Adicionar tabela "Lucro por Mês" (receitas líquidas - custos agrupados por competence_date/mês)
- Adicionar tabela "Custos por Tipo" (agrupado por `cost_type` do `event_payables`)
- Adicionar tabela "Receitas por Tipo de Serviço" (agrupado por `revenue_type` do `event_receivables`)

### 3. Dados de Exemplo (migration SQL)
Inserir via migration:
- 4 clientes: Teatro Porto, Teatro FAAP, Teatro Sérgio Cardoso, Cliente Avulso
- 5 profissionais de tipos variados (intérprete, audiodescritor, consultor, locutor)
- 5 eventos com serviços vinculados (Rita Lee, SUSI, Poemas, Feliz Ano Velho, Palestras Acessíveis)
- Agendas, alocações, receitas e custos de exemplo

### Ordem de execução
1. Dados de exemplo (migration)
2. Dashboard atualizado
3. Relatórios atualizados

