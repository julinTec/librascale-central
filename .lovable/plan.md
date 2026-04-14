## Popular banco de dados com dados fictícios para Power BI

### Situação atual

As tabelas principais (clients, events, interpreters, sessions, receivables, payables) já têm dados. Porém 4 tabelas estão vazias e 3 têm pouquíssimos registros.

### O que será inserido

**Tabelas vazias — criar dados fictícios:**

- **budget_items** (~8 itens): Itens de orçamento vinculados ao quote existente ("Teste 01") e novos quotes
- **contract_hours** (~6 registros): Contratos de horas para os 7 clientes existentes com períodos variados
- **period_closings** (~6 registros): Fechamentos mensais para clientes com pacote de horas
- **event_expenses** (~10 registros): Despesas variadas (transporte, alimentação, material) vinculadas aos 5 eventos existentes

**Tabelas com poucos dados — complementar:**

- **event_quotes** (+5 orçamentos): Novos orçamentos em diferentes status (recebido, em_orcamento, aprovado, reprovado)
- **incidents** (+4 ocorrências): Diferentes tipos (atraso, ausencia, problema_tecnico) vinculados a schedules existentes
- **execution_logs** (+4 registros): Logs de execução para schedules que ainda não têm

### Detalhes técnicos

- Usar a ferramenta de insert do Supabase para cada tabela
- Todos os registros usarão IDs de clientes, eventos, intérpretes e schedules já existentes no banco
- Datas distribuídas entre Jan-Abr/2026 para dar volume nos gráficos do BI
- Valores monetários realistas (R$ 500~15.000) para receitas/custos fazerem sentido nos relatórios

### Importante

- Nenhuma alteração de schema — apenas inserção de dados
- Quando quiser limpar, basta rodar DELETEs nas tabelas populadas
- Alem disso, analise se todas as tabelas e informações "conversão" entre si, se os "ids" de cada tabela se conectam, pois quero fazer relacionamentos entre as tabelas.  

  &nbsp;