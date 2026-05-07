## Implementação

Em `src/pages/Events.tsx`, na seção **Receita Vinculada (Financeiro)** dentro do dialog de edição:

### UI
- Adicionar dois botões no canto superior direito do painel cinza:
  - **Editar** (ícone Pencil) — abre sub-dialog
  - **Excluir** (ícone Trash2, destructive) — abre AlertDialog de confirmação

### Sub-dialog "Editar Receita"
Campos editáveis:
- Valor Bruto (`amount`)
- Imposto % (`tax_percentage`) — recalcula `tax_amount` e `net_amount` em tempo real
- Data de Competência (`competence_date`)
- Data de Vencimento (`due_date`)
- Status (pendente/recebido/atrasado/cancelado)
- Nº NF (`invoice_number`)
- Descrição (`description`)

Aviso: "Editar aqui não altera o Valor Contratado do evento. Salvar o evento novamente sobrescreve o bruto."

Salva via `supabase.from('event_receivables').update({...}).eq('id', linkedReceivable.id)`.

### Excluir
AlertDialog: "Tem certeza? A receita será removida do Financeiro."
- Confirmar: `delete().eq('id', linkedReceivable.id)`
- Aviso: "Para não recriar ao salvar o evento, zere o Valor Contratado."
- Toast + `loadLinkedReceivable()` para resetar painel

### Permissões
RLS atual: `event_receivables` só permite delete por **admin** (operacional não tem policy DELETE). Operacional verá erro ao tentar excluir. Aceitável — coerente com regra do projeto (delete restrito).

### Sem mudanças
Sem migração de banco, sem novas dependências.