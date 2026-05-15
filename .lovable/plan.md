## Diagnóstico

Revisei o sistema (App.tsx, AuthContext, AppLayout, NavLink, páginas). **O sistema está funcionando corretamente** — não há reload real, autenticação não se perde, e a navegação usa React Router (SPA), não recarregamento completo.

O "piscar / zerar tudo / depois carregar" que você está vendo é um efeito visual causado por como cada página foi construída:

1. Ao clicar no menu, o React Router troca a rota instantaneamente.
2. A nova página (Dashboard, Eventos, Financeiro, etc.) **monta do zero** com estado vazio (`useState([])`, `stats = 0`).
3. Em seguida, ela dispara as consultas ao banco via `useEffect` → durante ~200-800ms a tela mostra área branca / cards vazios / "0".
4. Quando os dados chegam, tudo aparece de uma vez → parece que "carregou de novo".

Ou seja: **não há bug**, mas a experiência fica ruim porque nenhuma página tem skeleton/loading state e nenhum dado é cacheado entre visitas.

## O que vou propor (sem mexer em lógica de negócio)

### 1. Cache de dados entre navegações (ganho maior)
Hoje o `QueryClient` do React Query existe mas **nenhuma página usa `useQuery`** — todas usam `useState + useEffect + supabase` direto. Isso significa que sair e voltar para a mesma página recarrega tudo do zero.

Em vez de refatorar todas as páginas (trabalho enorme), vou:
- Configurar o `QueryClient` com `staleTime` razoável e `keepPreviousData`.
- Adicionar um wrapper leve `usePageData` ou simplesmente um cache em memória (Map) por chave de rota, para que ao voltar a uma página os últimos dados apareçam imediatamente enquanto a atualização ocorre em background.

### 2. Skeleton/placeholder enquanto carrega
Adicionar um estado `loading` visível em cada página principal (Dashboard, Eventos, Financeiro, Orçamentos, Agenda) com componentes `Skeleton` do shadcn no lugar dos cards/tabelas. Em vez de "tudo zerado → tudo cheio", você verá "tudo cinza animado → tudo cheio", o que parece muito mais profissional e elimina a sensação de "piscar".

### 3. Transição suave entre rotas
Adicionar uma classe de transição (`fade-in`) no `<main>` do `AppLayout` para o conteúdo aparecer com fade de 150ms em vez de pop instantâneo.

### 4. Verificação rápida de saúde
Vou rodar uma checagem ao vivo (browser tool) navegando entre 3-4 páginas para confirmar que:
- A sessão não se perde.
- Não há requests duplicados.
- Não há erro no console.
- O tempo médio de carregamento de cada página está OK.

## Arquivos a alterar

- `src/App.tsx` — configurar `QueryClient` (staleTime, gcTime).
- `src/components/AppLayout.tsx` — adicionar fade-in no `<main>` e `key={location.pathname}`.
- `src/lib/page-cache.ts` (novo) — cache simples em memória por rota.
- `src/pages/Dashboard.tsx`, `Events.tsx`, `Finance.tsx`, `Quotes.tsx`, `Sessions.tsx` — adicionar estado `loading` + Skeletons + integrar cache.
- `src/components/ui/skeleton.tsx` já existe, será reutilizado.

## O que NÃO vou mudar

- Lógica de banco, RLS, edge functions, autenticação, PWA — tudo permanece igual.
- Estrutura do menu, design system, cores.

Posso seguir com a implementação?
