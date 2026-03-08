
## Contadores como Cards

Trocar os `Badge` por `Card` nos contadores das duas páginas:

**`src/pages/Schedules.tsx`** (linha ~176-178): Substituir o Badge por um Card compacto com `CardHeader`/`CardTitle` mostrando "Qtde de Agendas" e o valor `filtered.length`.

**`src/pages/Execution.tsx`** (linha ~133-135): Mesmo padrão, Card com "Agendas Executadas" e valor `executedCount`.

Estilo: Cards compactos com padding reduzido, título pequeno em muted e número em destaque.
