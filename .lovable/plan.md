

## Bug: Execução Real não salva

### Causa raiz

A query retorna `execution_logs` como **objeto** (relação 1:1 por causa da constraint unique em `schedule_id`), mas o código trata como **array** usando `s.execution_logs?.[0]`. Isso retorna `undefined`, então o código tenta fazer INSERT em vez de UPDATE, causando erro 409 (duplicate key).

Evidência no network response:
```json
"execution_logs": {"id": "040f404f-...", ...}  // objeto, não array
```

### Correção em `src/pages/Execution.tsx`

1. **Trocar todas as referências de `s.execution_logs?.[0]` por `s.execution_logs`** — já que é um objeto direto, não um array.

   Locais afetados:
   - `openExec`: `const exec = s.execution_logs?.[0]` → `const exec = s.execution_logs`
   - `handleSave`: `selected.execution_logs?.[0]` → `selected.execution_logs`
   - Render na tabela: `const exec = s.execution_logs?.[0]` → `const exec = s.execution_logs`

Isso fará com que o código detecte corretamente que já existe um registro e faça UPDATE em vez de INSERT.

