## Objetivo

Permitir que **admin** ou **operacional** gerem um **link público de pré-cadastro de orçamento** dentro da página Orçamentos. O cliente abre o link sem login, preenche os dados do evento e envia. O sistema recebe esses dados como rascunho ("pré-cadastro recebido"), exibe um badge/contador na sidebar e permite que a equipe converta o rascunho em um orçamento real com 1 clique.

## Campos do formulário público (preenchidos pelo cliente)

**Bloco 1 — Solicitante**
- Nome completo *
- E-mail *
- Telefone / WhatsApp *
- Empresa / Instituição (opcional)

**Bloco 2 — Evento**
- Nome do evento *
- Tipo de serviço (multi-select, mesmas opções da página Eventos: Intérprete de Libras, Audiodescritor, Consultor, Locutor, Assistente, Outro) *
- Modalidade (Presencial / Remoto / Híbrido) *
- Local / Endereço (obrigatório se Presencial ou Híbrido)
- Data início *
- Data fim (opcional, default = data início)
- Quantidade estimada de sessões/encontros (numérico, default 1)
- Descrição / objetivo do evento (textarea)

**Bloco 3 — Outros**
- Observações adicionais (textarea, opcional)
- Como nos conheceu? (texto livre, opcional)

Todos os obrigatórios validados client + server com Zod.

## Banco de dados

Nova tabela `quote_intakes`:

- `id` uuid pk
- `token` uuid único, indexado (vai na URL pública)
- `status` enum: `aguardando` | `recebido` | `convertido` | `descartado`
- `created_by` uuid (admin ou operacional que gerou)
- `assigned_client_id` uuid nullable (cliente pré-vinculado)
- `expires_at` timestamptz (default now()+30 dias, configurável 7/15/30 ao gerar)
- `submitted_at` timestamptz nullable
- `converted_quote_id` uuid nullable (referência ao `event_quotes.id` após conversão)
- Campos preenchidos pelo cliente: `requester_name`, `requester_email`, `requester_phone`, `company_name`, `event_name`, `service_types text[]`, `modality`, `venue`, `start_date`, `end_date`, `sessions_count`, `description`, `observations`, `referral_source`
- `created_at`, `updated_at`

**RLS:**
- `admin` e `operacional`: SELECT, INSERT, UPDATE, DELETE.
- `interprete` / anon: SEM acesso direto à tabela. Acesso público é só via Edge Functions (service role).

## Edge Functions (públicas, `verify_jwt = false`)

### `quote-intake-get` (GET)
- Recebe `?token=...`
- Retorna apenas campos seguros: nome da empresa (Nosso Mundo), status, expirado/válido. **Não vaza** dados internos nem confirma a existência de tokens inválidos de forma específica (resposta genérica "link inválido ou expirado").
- Se `status = recebido` ou `convertido` ou expirado → retorna estado correspondente para a tela exibir mensagem.

### `quote-intake-submit` (POST)
- Recebe `{ token, payload }`
- Validação Zod completa do payload.
- Confere token, expiração, status `aguardando`.
- Honeypot anti-bot (campo invisível `website` deve vir vazio).
- Rate limit simples em memória (ex.: 5 tentativas/min por token).
- Grava dados, marca `status = recebido`, `submitted_at = now()`.
- Retorna sucesso genérico.

## Rota pública no app

Nova rota fora do `AppLayout`/`ProtectedRoute`:

```
/orcamento/preencher/:token
```

Página `PublicQuoteIntake.tsx`:
- Logo Nosso Mundo no topo, identidade visual da marca, sem sidebar/menu.
- Estados: `loading` → `formulário` → `enviado-com-sucesso` → `expirado/inválido` → `já-preenchido`.
- Formulário com os campos listados acima, validação Zod, máscaras leves para telefone.
- Tela de sucesso: "Recebemos suas informações. Em breve entraremos em contato com seu orçamento."
- Rodapé com aviso de LGPD.

## UI dentro de `Quotes.tsx`

### Botão "Gerar link de pré-cadastro" (topo)

- Visível para `admin` e `operacional`.
- Abre modal:
  - Cliente pré-vinculado (opcional, dropdown)
  - Validade do link: 7 / 15 / **30 dias (default)**
  - Botão "Gerar link"
- Após gerar:
  - Mostra a URL completa em campo readonly
  - **Único botão de ação: "Copiar link"** (sem WhatsApp/e-mail)
  - Mensagem: "Link válido até DD/MM/AAAA"

### Aba/seção "Pré-cadastros"

- Tabs no topo da página: **Orçamentos** | **Pré-cadastros** (badge com contador de `recebido` não convertidos).
- Tabela de pré-cadastros: data envio, solicitante, evento, status, ações.
- Filtros por status.
- Ações por linha:
  - **Visualizar** — modal com tudo que o cliente preencheu (read-only)
  - **Converter em orçamento** — abre o modal "Novo Orçamento" pré-preenchido com os dados do intake. Equipe ajusta valores/itens e salva. Após salvar, marca intake como `convertido` e amarra `converted_quote_id`.
  - **Descartar** — marca como `descartado`
  - **Copiar link** — útil para reenviar ao cliente que ainda não preencheu

## Badge na sidebar

- `AppSidebar.tsx`: ao carregar (e a cada navegação), conta `quote_intakes` com `status = 'recebido' AND converted_quote_id IS NULL`.
- Mostra badge numérico ao lado do item "Orçamentos" no menu.
- Atualiza em realtime via `supabase.channel` na tabela `quote_intakes`.

## Segurança

- Token UUID v4 (não enumerável).
- Edge Functions com input validado (Zod), honeypot, rate limit.
- Mensagens de erro genéricas para não vazar existência de tokens.
- RLS bloqueia acesso direto de qualquer role pública à tabela.
- Service role key usada apenas dentro das Edge Functions.

## Ordem de implementação

1. Migração: criar tabela `quote_intakes` + enum de status + índices + RLS.
2. Edge Functions `quote-intake-get` e `quote-intake-submit`.
3. Rota pública e página `PublicQuoteIntake.tsx`.
4. Modal "Gerar link" + integração em `Quotes.tsx`.
5. Aba "Pré-cadastros" + ação "Converter em orçamento".
6. Badge na sidebar com realtime.

## Fora de escopo (futuro)

- Envio automático por e-mail/WhatsApp.
- Anexos (cliente subir briefing/PDF).
- Edição pelo cliente após envio.
- Notificação por e-mail à equipe.
