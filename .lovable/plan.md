

## Correções na Execução e Fechamento

### Problemas identificados

1. **Execução: filtro muito restritivo** — A página só mostra agendamentos com status `confirmada`, `em_execucao`, `concluida`. Agendamentos com status `planejada` não aparecem, impedindo o registro de execução para eles.

2. **Fechamento: bug de array** — Em `Closing.tsx` linha 47, o código usa `s.execution_logs?.[0]` (tratando como array), mas a relação 1:1 retorna um objeto. Isso faz com que os dados de execução nunca sejam lidos, zerando as horas realizadas e faturáveis no fechamento.

### Mudanças

**`src/pages/Execution.tsx`**
- Incluir `planejada` no filtro de status para que todos os agendamentos apareçam e possam ter execução registrada
- Manter o botão "Registrar" existente (que já funciona) com texto dinâmico: "Registrar" para pendentes e "Editar" para já registrados

**`src/pages/Closing.tsx`**
- Corrigir linha 47: trocar `s.execution_logs?.[0]` por `s.execution_logs` (mesmo bug que foi corrigido na Execução)

