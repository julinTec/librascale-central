

## Remover limite de linhas da API pública

### Alteração em `supabase/functions/public-api/index.ts`

Remover o limite máximo de 10.000 e o default de 1.000 registros. Quando nenhum `limit` for informado, a função buscará todos os registros da tabela de uma vez, sem paginação forçada.

**Mudanças:**
- Se `limit` não for passado, buscar com `.select("*", { count: "exact" })` sem `.range()` — retorna tudo
- Se `limit` for passado, aplicar `.range()` normalmente para quem quiser paginar
- Remover o `Math.min(..., 10000)` que truncava o limite

