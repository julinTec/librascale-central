# Diagnóstico de fluidez do sistema

Fiz uma varredura no `App.tsx`, `AppLayout`, `page-cache`, e nos pesos das páginas/dependências. O sistema **funciona bem** — a sensação de "peso" vem de 4 pontos concretos abaixo.

## O que está pesando hoje

1. **Bundle inicial gigante** — `App.tsx` faz `import` estático de **TODAS** as 16 páginas (Quotes 847 linhas, Events 564, DashboardGerencial 474, Finance 403, Reports 394 + `recharts` + `jspdf` + `framer-motion`). Tudo isso é baixado e parseado já no primeiro load, mesmo que o usuário só vá ao `/inicio`. Isto é o maior causador da lentidão inicial.

2. **Animação de transição custosa** — `AppLayout` usa `AnimatePresence mode="popLayout"` com `framer-motion` envolvendo cada rota. O `popLayout` força reflow do `<main>` inteiro a cada navegação e adiciona um frame extra antes de pintar.

3. **Páginas refazem N queries em paralelo sem suspensão** — ex.: Quotes faz 19 chamadas `supabase.from`, Events 15, Sessions 13. Cada visita refaz tudo do zero. Já existe `useCachedState` no Dashboard, mas as outras páginas não usam — então sair/voltar recarrega tudo.

4. **Cache nunca expira** — `page-cache.ts` é um `Map` em memória sem TTL nem invalidação por mutação. Hoje não causa bug porque cada página recarrega via `useEffect`, mas convém deixar mais previsível (TTL curto + helper de invalidação por prefixo).

## O que vou alterar (sem quebrar nada e sem fluxo novo)

### 1. Code-splitting por rota (impacto maior)
- Em `src/App.tsx`, converter os `import` das páginas autenticadas para `React.lazy(...)` e envolver `<Routes>` em `<Suspense fallback={...}>` usando um spinner discreto (mesmo "Carregando..." já usado).
- `Login`, `Home` e `PublicQuoteIntake` ficam estáticos (são a primeira tela mais comum).
- Resultado esperado: primeiro carregamento e troca de página muito mais rápidos; cada módulo só baixa quando acessado. `recharts` e `jspdf` saem do bundle inicial automaticamente.

### 2. Transição mais leve no AppLayout
- Trocar `AnimatePresence mode="popLayout"` por `mode="wait"` removido + uma única `motion.div` com `key={pathname}` e transição `opacity` de 100ms. Mantém o fade que você gostou, mas sem reflow duplo.
- `framer-motion` continua sendo usado (não removo dependência).

### 3. Cache leve com TTL
- Em `src/lib/page-cache.ts`: adicionar `ttlMs` opcional (default 60s) em `setCached`, e helper `invalidateByPrefix(prefix)` para o futuro. API existente (`useCachedState`) permanece 100% compatível — nenhuma página atual precisa mudar.

### 4. Pequenos ajustes de render
- `AppSidebar` e `AppLayout`: garantir que os ícones e o `DropdownMenu` não re-renderizam em toda navegação (memoizar o conteúdo do header que não depende de `location`).
- Sem mudanças de estilo nem de menu.

## O que **não** vou mexer

- Nenhuma lógica de negócio, query, RLS, edge function, schema.
- Nenhuma página individual será reescrita (sem refator de useEffect→useQuery).
- Sem mudança em rotas, menu, design, cores, fluxo de auth, PWA.
- Sem remoção/troca de dependências.

## Arquivos a editar

- `src/App.tsx` — lazy + Suspense.
- `src/components/AppLayout.tsx` — transição mais leve + memo no header.
- `src/lib/page-cache.ts` — TTL opcional + invalidate helper (compatível).

## Como vou validar

- Build automático do harness deve passar.
- Abrir o preview, navegar `/inicio → /eventos → /financeiro → /orcamentos → /inicio` e conferir console/network: sem erros, chunks separados sendo baixados sob demanda, transição sem "piscar branco".

Posso seguir com a implementação?
