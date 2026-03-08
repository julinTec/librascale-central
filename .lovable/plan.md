

## Ajustes: Agenda e Execução

### 1. Página Agenda — Intérprete opcional

O campo `interpreter_id` na tabela `schedules` é `NOT NULL`. Precisamos:

**Migração SQL**: Alterar a coluna para permitir null:
```sql
ALTER TABLE public.schedules ALTER COLUMN interpreter_id DROP NOT NULL;
```

**`src/pages/Schedules.tsx`**: Adicionar opção "Nenhum" no Select de intérprete e enviar `null` quando não selecionado (em vez de string vazia que causaria erro de FK).

### 2. Página Execução — Já está correto

Analisando a tabela atual da Execução, ela já traz as colunas da Agenda:
- **Data** (activity_date da agenda)
- **Título** (title da agenda)  
- **Cliente** (clients.name da agenda)
- **Previsto** (planned_start - planned_end da agenda, que corresponde ao "Horário" da Agenda)

E mantém as colunas de controle da execução: **Real**, **Status Execução**, e botão **Registrar/Editar**.

A página já está funcionando conforme descrito — os dados vêm da agenda e a gestão é sobre a execução real. Nenhuma mudança necessária na Execução.

### Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| Migração SQL | `ALTER COLUMN interpreter_id DROP NOT NULL` |
| `src/pages/Schedules.tsx` | Opção "Nenhum" no select de intérprete, enviar `null` quando vazio |

