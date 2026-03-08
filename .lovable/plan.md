

## Editar Ocorrências

### Mudanças em `src/pages/Incidents.tsx`

1. **Estado de edição**: Adicionar `editingId` (string | null) para rastrear se estamos criando ou editando.

2. **Função `openEdit(incident)`**: Preenche o formulário com os dados da ocorrência existente, seta `editingId` com o ID, e abre o dialog. Incluir também o campo `status` no formulário de edição (que hoje só aparece como "aberta" na criação).

3. **Atualizar `handleSave`**: Se `editingId` existe, fazer `supabase.from('incidents').update(payload).eq('id', editingId)` em vez de `insert`.

4. **Resetar formulário**: Ao abrir para criar (`setOpen(true)`), limpar `editingId` e resetar o form para os valores padrão.

5. **Botão de edição na tabela**: Adicionar uma coluna "Ações" com um ícone `Pencil` em cada linha que chama `openEdit(i)`.

6. **Título dinâmico do dialog**: Mostrar "Editar Ocorrência" ou "Nova Ocorrência" conforme `editingId`.

7. **Campo Status visível na edição**: Adicionar um `Select` de status no formulário (usando `INCIDENT_STATUS_LABELS`) para que o usuário possa alterar o status ao editar.

