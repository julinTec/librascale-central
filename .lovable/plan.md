

## Adicionar Exclusão e Exportação PDF na página Orçamentos

### Alterações em `src/pages/Quotes.tsx`

1. **Botão de Excluir Orçamento** — Adicionar um botão com ícone `Trash2` na coluna de ações de cada linha da tabela, com diálogo de confirmação (`AlertDialog`) antes de deletar. A exclusão remove o orçamento e seus `budget_items` associados via `supabase.from('event_quotes').delete().eq('id', id)`.

2. **Botão de Exportar PDF** — Adicionar um botão com ícone `FileDown` na coluna de ações. Por enquanto, a função gerará um PDF básico com os dados do orçamento e seus itens usando `jsPDF` + `jspdf-autotable` (já usados no projeto). Quando você passar o molde definitivo, ajustaremos o layout do PDF.

### Detalhes técnicos
- Importar `AlertDialog` components para confirmação de exclusão
- Importar `FileDown` do lucide-react
- Função `deleteQuote(id)`: deleta `budget_items` do orçamento primeiro, depois o `event_quotes`
- Função `exportPDF(quote)`: carrega os `budget_items` do orçamento, gera PDF com cabeçalho (dados do evento/cliente) e tabela de itens
- A coluna de ações ficará com 3-4 botões: Editar, Exportar PDF, Converter em Evento, Excluir

