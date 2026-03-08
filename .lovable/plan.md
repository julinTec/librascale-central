

## Auto-cálculo de Horas Trabalhadas e Faturáveis

Sim, faz total sentido. Ao preencher "Hora Real Início" e "Hora Real Fim", os campos "Horas Trabalhadas" e "Horas Faturáveis" devem ser calculados automaticamente.

### Mudanças em `src/pages/Execution.tsx`

1. Criar uma função `calcHours(start, end)` que retorna a diferença em horas decimais (ex: 2h30 = 2.5).
2. Nos `onChange` dos inputs de hora (actual_start e actual_end), recalcular automaticamente `worked_hours` e `billable_hours` com base nos dois valores.
3. Os campos de horas continuam editáveis para ajuste manual, mas são preenchidos automaticamente quando ambos os horários estão definidos.
4. Também aplicar o cálculo ao abrir o modal (`openExec`) quando não há execução prévia e os horários planejados existem.

