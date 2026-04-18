

## Análise

Após o sync automático Evento→Receita, há receitas "antigas" cadastradas manualmente que duplicam dados de eventos. Preciso:

1. **Limpar duplicatas no banco**: para cada evento, manter apenas 1 receita (a mais recente/completa) e remover as demais. Receitas órfãs (sem `event_id` válido) ficam intocadas.
2. **Adicionar botão "Excluir"** na lista de receitas em Finance.tsx, com confirmação via AlertDialog.

Vou verificar a duplicação real e o componente Finance antes de finalizar.

