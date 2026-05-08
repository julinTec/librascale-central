# Rebrand visual: paleta Nosso Mundo Talentos + logo

Aplicar a paleta da marca em todo o sistema, integrar a logo e adotar um visual premium, moderno, com cantos suaves, sombras elegantes e leve glassmorphism.

## 1. Tokens do design system (`src/index.css`)
Substituir o tema verde atual por tokens HSL da nova paleta:
- `--background` `#F7F5F1`, `--card/--popover` `#FFFFFF`, `--border/--input` `#DDD8D2`
- `--foreground` `#1F1F1F`, `--muted-foreground` `#6E6A73`
- `--primary` `#E56718`, `--primary-hover` `#C95512`, `--primary-glow` `#F2B277`
- `--secondary` `#5B4B7A` (roxo institucional)
- `--accent` `#F2B277`, `--light-accent` `#C9BEDB`
- `--ring` = primary
- Sidebar: fundo roxo `#5B4B7A` (variações claras/escuras), itens ativos com leve laranja translúcido
- Aumentar `--radius` para `0.875rem` (14px) — atende 12–18px solicitado
- Adicionar gradientes e sombras: `--gradient-primary` (laranja), `--gradient-secondary` (roxo), `--shadow-soft`, `--shadow-elegant`, `--shadow-card`
- Tema dark equivalente preservando contraste

## 2. Tailwind (`tailwind.config.ts`)
- Estender `primary` com `hover` e `glow`
- Adicionar cor `light-accent`
- Manter as demais cores semânticas como estão

## 3. Logo da empresa
- Copiar `user-uploads://logo_2.png` para `src/assets/logo.png` (já feito)
- Substituir o ícone `Mic` por `<img src={logo} />` em:
  - `src/components/AppSidebar.tsx` (header — versão expandida e colapsada, em circle)
  - `src/pages/Login.tsx` (cabeçalho do card)
- Atualizar `index.html` com favicon apontando para a logo

## 4. Login (`src/pages/Login.tsx`)
- Fundo com gradiente sutil laranja→bege e blobs decorativos
- Card com efeito `glass` (utilitário CSS), `shadow-elegant`, `rounded-2xl`
- Logo grande no topo, título "Nosso Mundo Talentos"
- Botão CTA com gradiente laranja (`gradient-primary` + `shadow-elegant`)

## 5. Polimento global (sem refatorar páginas)
A maior parte dos componentes usa tokens semânticos (`bg-primary`, `bg-card`, etc.), então herdarão o novo tema automaticamente. Ajustes pontuais:
- `src/components/AppLayout.tsx` / sidebar: garantir que itens ativos usem `sidebar-accent` com leve tom laranja
- Botão "default" no shadcn já usa `bg-primary` — passará a ter gradiente via classe utilitária aplicada nos CTAs principais quando necessário (mantém variantes existentes)

## Arquivos alterados
- `src/index.css` — tokens, gradientes, sombras, utilitários `.glass`, `.gradient-primary`, `.shadow-elegant`
- `tailwind.config.ts` — extends de `primary.hover`, `primary.glow`, `light-accent`
- `src/components/AppSidebar.tsx` — logo + estilo do header
- `src/pages/Login.tsx` — novo layout premium com glass + gradiente
- `index.html` — favicon
- `src/assets/logo.png` — asset da logo (já copiado)
