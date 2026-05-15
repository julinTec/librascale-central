## Objetivo
Tornar o sistema instalável no celular (iPhone/Android) como um app, mantendo 100% do acesso ao banco de dados Lovable Cloud. O usuário poderá adicionar à tela inicial e abrir como aplicativo, sem barra do navegador.

## Abordagem
Vou usar a estratégia **manifest-only** (sem service worker), recomendada pela Lovable para apps que precisam apenas de instalabilidade — sem cache offline. Isso evita problemas de cache desatualizado e garante que toda alteração feita no PC apareça imediatamente no celular.

> Observação: a instalação só funciona na versão **publicada** (`nosso-mundo-manager.lovable.app`), não no preview do editor.

## Etapas

### 1. Gerar ícones do PWA
Criar ícones nas resoluções exigidas pelo iOS e Android, usando a identidade visual do sistema (Nosso Mundo - Gestão de Eventos):
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/apple-touch-icon.png` (180x180, para iOS)

### 2. Criar `public/manifest.json`
Manifest com:
- `name`: "Nosso Mundo - Gestão de Eventos"
- `short_name`: "Nosso Mundo"
- `start_url`: "/dashboard"
- `display`: "standalone" (abre como app, sem barra do navegador)
- `theme_color` e `background_color` baseados no design system atual
- `icons` apontando para os arquivos acima
- `lang`: "pt-BR"

### 3. Atualizar `index.html`
Adicionar dentro do `<head>`:
- `<link rel="manifest" href="/manifest.json">`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<meta name="apple-mobile-web-app-title" content="Nosso Mundo">`
- `<meta name="theme-color" content="...">`

### 4. Criar página `/instalar` (opcional, mas recomendada)
Uma página simples com instruções visuais de instalação:
- **Android/Chrome**: botão "Instalar app" (usa o evento `beforeinstallprompt`)
- **iPhone/Safari**: instruções "Toque em Compartilhar → Adicionar à Tela de Início"
- Detecta automaticamente o sistema e mostra a instrução certa

Adicionar link "Instalar app no celular" na Central de Ajuda (`/ajuda`).

### 5. Atualizar a Central de Ajuda
Incluir uma nova seção/FAQ sobre **Acesso pelo Celular**, explicando:
- Como instalar no Android
- Como instalar no iPhone
- Que os dados são os mesmos do PC (sincronização em tempo real)

## O que NÃO será feito (intencionalmente)
- ❌ Não vou instalar `vite-plugin-pwa` nem service workers — eles causam problemas no preview da Lovable e cache desatualizado.
- ❌ Não haverá funcionamento offline (o sistema precisa do banco para tudo, então isso não faz diferença prática).
- ❌ Push notifications nativas ficam fora deste escopo.

## Resultado final
Após publicar, qualquer usuário acessando `https://nosso-mundo-manager.lovable.app` pelo celular poderá:
1. Adicionar à tela inicial pelo navegador
2. Abrir como app (sem barra de navegação)
3. Usar todas as funcionalidades normalmente, com dados sincronizados em tempo real com o PC

## Arquivos que serão alterados/criados
- `public/manifest.json` (novo)
- `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` (novos)
- `index.html` (meta tags + link do manifest)
- `src/pages/Install.tsx` (nova página `/instalar`)
- `src/App.tsx` (rota `/instalar`)
- `src/lib/faq-content.ts` (nova seção sobre celular)