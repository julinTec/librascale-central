## Rebrand visual: nova identidade NM (azul profundo + cyan + dourado)

Substituir a paleta laranja/roxa atual pela nova identidade corporativa premium estilo SaaS enterprise, e trocar a logo em todo o sistema pela nova arte (NM em círculo azul).

### 1. Substituir a logo
- Copiar `user-uploads://logo_3.png` para `src/assets/logo.png` (sobrescreve a atual — todos os imports continuam funcionando: `AppSidebar`, `Login`)
- Copiar também para `public/favicon.png` (favicon já aponta para esse arquivo no `index.html`)

### 2. Design tokens (`src/index.css`)
Reescrever os tokens HSL com a nova paleta:
- `--background` `#F4F7FA` · `--card`/`--popover`/`--surface` `#FFFFFF`
- `--border`/`--input` `#D4DAE2`
- `--foreground` `#052863` (azul quase preto) · `--muted-foreground` cinza-azulado
- `--primary` `#052863` · `--primary-hover` `#043F8B` · `--primary-glow` `#6AC2E5`
- `--secondary` `#043F8B`
- `--accent` `#6AC2E5` (cyan tecnológico) · `--light-accent` `#6D6B91` (premium purple)
- `--gold` `#C4CD72` (destaques VIP — novo token)
- `--ring` = cyan accent (glow sutil em foco/ativo)
- `--radius` `0.875rem` (cantos suaves modernos)
- Sidebar: fundo `#052863` com itens ativos em azul `#043F8B` + borda esquerda cyan
- Gradientes/sombras:
  - `--gradient-primary`: linear `#052863 → #043F8B`
  - `--gradient-accent`: linear `#043F8B → #6AC2E5`
  - `--shadow-soft`, `--shadow-elegant` (glow cyan sutil), `--shadow-card`
- Tema dark equivalente preservando contraste
- Manter utilitários `.glass`, `.gradient-primary`, `.gradient-secondary`, `.shadow-elegant`, e adicionar `.gradient-accent`, `.text-gold`, `.border-gold`

### 3. Tailwind (`tailwind.config.ts`)
- Adicionar token `gold` (`hsl(var(--gold))`)
- Manter `primary.hover`, `primary.glow` e `light-accent`
- Sem outras mudanças estruturais (componentes herdam via tokens semânticos)

### 4. Login (`src/pages/Login.tsx`)
- Atualizar fundo: gradiente sutil `#F4F7FA → branco` com blobs decorativos em cyan/azul (substituindo blobs laranja)
- Card mantém glass + `shadow-elegant` (agora com glow cyan)
- Título já é "Nosso Mundo Talentos" — manter
- Botão CTA usa `gradient-primary` (azul profundo) — herdado automaticamente

### 5. Sidebar (`src/components/AppSidebar.tsx`)
- Manter estrutura; logo já vem do mesmo path
- Ajustar ring do avatar de `ring-primary/40` para `ring-accent/50` (glow cyan ao redor da logo)
- Item ativo: barra esquerda cyan sutil (via classe utilitária no `NavLink` activeClassName)

### 6. Polimento global
A maioria das páginas (`Dashboard`, `Events`, `Interpreters`, `Sessions`, `Finance`, etc.) usa tokens semânticos (`bg-card`, `text-primary`, `bg-primary`, `border`, `bg-muted`) e herda automaticamente. Sem refatoração de páginas individuais nesta etapa — o resultado é um rebrand completo com mudança mínima de código.

### Arquivos alterados
- `src/assets/logo.png` (substituído)
- `public/favicon.png` (substituído)
- `src/index.css` — paleta + gradientes + sombras + token gold
- `tailwind.config.ts` — adicionar `gold`
- `src/pages/Login.tsx` — blobs/fundo na nova paleta
- `src/components/AppSidebar.tsx` — ring cyan + indicador ativo
