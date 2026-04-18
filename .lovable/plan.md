

## Análise

Verifiquei `Reports.tsx` + schema. Encontrei 3 problemas reais nos cálculos e 1 melhoria pedida (export).

### Problemas nos cálculos

**1. "Receita Líquida" vazia em Lucro por Evento** — A query de receivables não filtra por período e usa `competence_date` implícito, mas o filtro do relatório é por `events.start_date`. Resultado: se a receita foi criada mas o `status` ainda não é `'recebido'`, ou se o `net_amount` não foi gravado (registros antigos), o valor aparece R$ 0.

Após o sync Evento→Receita que fizemos, vários receivables têm `amount` correto mas `net_amount=0` porque só recalculamos quando o usuário edita. Precisamos:
- Mostrar **Receita Prevista (Líquida)** = `net_amount` se >0, senão `amount * (1 - tax%/100)` como fallback, independente do status.
- Adicionar coluna separada **Recebido** para o que efetivamente entrou (`status='recebido'`).
- Assim o usuário enxerga previsto vs realizado.

**2. "Custos Pagos" só conta `status='pago'`** — Igual problema: custos pendentes/agendados ficam invisíveis e a coluna fica zerada para eventos novos. Vou exibir **Custos Previstos** (todos) e **Pagos** (status=pago) — duas colunas — e calcular **Lucro Previsto** = ReceitaLíquidaPrevista − CustosPrevistos.

**3. "Lucro por Mês" usa só competence_date + status final** — Eventos sem competência ou sem baixa somem do mês. Vou:
- Fallback: se `competence_date` for null, usar `due_date`, depois `start_date` do evento.
- Criar duas séries: **Previsto** (todos) e **Realizado** (recebido/pago). Tabela mostra ambos + diferença.

**4. "Pagamentos por Profissional" ignora período** — A query de `event_assignments` não tem filtro temporal. Vou juntar via `session_id → event_sessions.session_date` e filtrar pelo período selecionado.

**5. "Receitas por Tipo" usa `amount` bruto** — Inconsistente com "Líquida" das outras tabelas. Vou usar `net_amount` (com fallback) para alinhar.

### Export PDF + Excel

Adicionar dois botões no topo da página (ao lado dos filtros):
- **Exportar PDF**: usar `jspdf` + `jspdf-autotable` (já usado em `Closing.tsx`). Gera multi-página com cabeçalho do período e uma tabela por seção.
- **Exportar Excel**: usar `xlsx` (SheetJS). Cria 1 arquivo com 5 abas (Lucro por Evento, Lucro por Mês, Custos por Tipo, Receitas por Tipo, Pagamentos por Profissional) + aba "Resumo" com período/total.

Nome do arquivo: `relatorios_<periodo>.pdf` / `.xlsx` (ex: `relatorios_2026.xlsx` ou `relatorios_2026-04.xlsx`).

## Implementação

### `src/pages/Reports.tsx`
- Reescrever `loadReports` com:
  - `netExpected = net_amount > 0 ? net_amount : amount * (1 - tax_percentage/100)`
  - Tabela "Lucro por Evento": colunas → Evento | Cliente | Contratado | **Receita Líquida (Prev.)** | **Recebido** | **Custos Prev.** | **Custos Pagos** | **Lucro Prev.**
  - Tabela "Lucro por Mês": Mês | Receita Prev. | Recebido | Custos Prev. | Pagos | Lucro Prev. | Lucro Real
  - Bucket de mês: `competence_date ?? due_date ?? evento.start_date`
  - "Receitas por Tipo": somar `netExpected`
  - "Pagamentos por Profissional": fazer join com `event_sessions` e filtrar `session_date` dentro do período
- Header: 2 botões `Exportar PDF` (ícone FileDown) e `Exportar Excel` (ícone FileSpreadsheet)
- Funções `exportPDF()` e `exportExcel()` que consomem os mesmos arrays já calculados no estado

### Dependências
- `jspdf` + `jspdf-autotable` — já no projeto (usado em Closing.tsx)
- `xlsx` (SheetJS) — adicionar via `<lov-add-dependency>xlsx@latest</lov-add-dependency>`

### Sem mudanças no banco
Tudo é cálculo no front. Os dados já estão lá após o sync anterior.

