

## Análise

Olhando a imagem e o código, identifico dois pontos:

### 1. Custos duplicados
A aba "Custos" lista `event_payables` que vieram tanto de cadastro manual quanto possivelmente de duplicações ao longo do uso. Cada custo deve representar **um pagamento real** vinculado a um evento (e idealmente a uma alocação/profissional). Preciso checar no banco quais são duplicatas reais antes de remover.

Critério de duplicata proposto: mesmo `event_id` + mesma `description` + mesmo `amount` + mesmo `interpreter_id` → manter o mais recente (ou o que tem `paid_date`/`status='pago'`), remover os demais.

### 2. Toggle "Receitas / Custos" pouco destacado
Na imagem o toggle aparece pequeno e discreto, sendo que é a chave de navegação entre as duas informações financeiras mais importantes da página. Precisa virar um seletor visual forte.

## Proposta

### A. Limpeza de duplicatas (`event_payables`)
Migração SQL que:
- Identifica grupos com mesmo `event_id + description + amount + COALESCE(interpreter_id, '00000000...')`
- Mantém o registro com maior prioridade: `status='pago'` > `paid_date IS NOT NULL` > mais recente (`created_at`)
- Remove os demais

Antes de executar, vou rodar uma query SELECT para confirmar o volume de duplicatas e mostrar ao usuário o que será removido.

### B. Destacar o toggle Receitas/Custos
Substituir os pequenos `TabsTrigger` atuais por um **segmented control grande** com:
- Cards lado a lado (ou pills grandes) com ícone + título + KPI mini
- Aba ativa em verde (cor primária) com sombra; inativa em cinza claro
- Texto maior (text-base/lg, font-semibold)
- Largura confortável (~200-260px cada), centralizados ou alinhados à esquerda do conteúdo
- Mostrar inline o total da aba ativa para reforçar contexto (ex: "Receitas — R$ 66.000,00" / "Custos — R$ 3.050,00")

Layout sugerido:
```text
┌─────────────────────────┐  ┌─────────────────────────┐
│ ↗ Receitas              │  │ ↘ Custos                │
│   R$ 66.000,00          │  │   R$ 3.050,00           │
└─────────────────────────┘  └─────────────────────────┘
        (ativo)                    (inativo)
```

### Arquivos afetados
- **Migração SQL** — dedup de `event_payables`
- `src/pages/Finance.tsx` — redesenho do toggle Receitas/Custos (substituir `TabsList`/`TabsTrigger` por botões grandes estilizados, mantendo o estado controlado)

### Etapa de validação
Antes da migração de exclusão, vou rodar `supabase--read_query` para listar as duplicatas detectadas e confirmar com você o que será removido.

