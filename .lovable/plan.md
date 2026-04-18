

## Análise

Hoje há duplicação de trabalho: o usuário cadastra o evento em **Eventos** (com `contract_value` e serviços) e depois precisa cadastrar manualmente uma **Receita** em **Financeiro → A Receber** apontando para o mesmo evento. Isso gera:
- Retrabalho (digita o mesmo valor 2x)
- Risco de divergência (valor do evento ≠ valor do receivable)
- Eventos "esquecidos" sem receita lançada

A proposta do usuário faz total sentido: **cada evento já é uma receita em potencial**. O único dado financeiro que não existe no evento é o **imposto (%)**, que afeta o líquido.

## Proposta

### 1. Geração automática de receita ao criar evento
Quando um evento é criado/atualizado com `contract_value > 0` e `client_id`, criar/atualizar automaticamente um registro em `event_receivables`:
- `amount` = `contract_value` do evento
- `tax_percentage` = % padrão de `tax_settings` (is_default = true, hoje 6%)
- `tax_amount` e `net_amount` calculados
- `status` = 'pendente'
- `competence_date` = `start_date` do evento
- `description` = nome do evento

Se o evento já tem receivable vinculado, atualiza valor/competência (preservando status, datas pagas, imposto editado, número da NF).

### 2. Página Financeiro → aba "A Receber"
- **Remover** o botão "Nova Receita" (ou deixar apenas para casos avulsos sem evento)
- A lista passa a refletir as receitas geradas a partir dos eventos
- Edição da receita foca nos campos financeiros: **% imposto** (recalcula líquido em tempo real), `due_date`, `received_date`, `status`, `invoice_number`, `notes`
- Campos `amount`, `client_id`, `event_id` ficam **read-only** (origem é o evento)

### 3. Página Eventos
- No formulário do evento, exibir um pequeno painel "Receita vinculada" mostrando: valor bruto, % imposto, líquido, status — com link "Editar imposto/recebimento" que abre o diálogo do Financeiro
- Ao alterar `contract_value` do evento, avisar que a receita será atualizada

### 4. Migração de dados existentes
Script único: para cada evento com `contract_value > 0` que **não** possui receivable, gerar um receivable com imposto padrão.

### Arquivos afetados
- `src/pages/Events.tsx` — após save do evento, upsert do receivable; painel de receita vinculada no diálogo
- `src/pages/Finance.tsx` — aba "A Receber": remover/ocultar criação manual, travar campos de origem na edição, destacar % imposto editável com cálculo do líquido em tempo real
- **Migração SQL** — backfill de receivables para eventos existentes sem receita

### Fluxo final
```text
Evento (Eventos) ─► auto cria/atualiza ─► Receita (Financeiro)
   contract_value          amount, competence
                           tax_% (editável) ─► net_amount
                           status, datas, NF (editável)
```

