## Objetivo

No modal "Novo Evento" (página Eventos), trocar o campo **"Tipo do Evento"** (seletor único) por **"Tipo de Serviço"** (seletor com múltipla seleção), permitindo escolher mais de uma opção por evento.

## Mudanças

### 1. Banco de dados (migração)

Adicionar uma nova coluna `service_types text[]` na tabela `events`:

- Tipo: `text[]` (array de textos), default `'{}'`.
- Backfill: copiar o valor atual de `event_type` para dentro do array em todos os registros existentes (`service_types = ARRAY[event_type::text]`).
- Manter a coluna `event_type` por enquanto (compatibilidade), preenchida automaticamente com o **primeiro** item do array via trigger, para não quebrar nada externo.

### 2. UI — `src/pages/Events.tsx`

- Renomear o label do campo de "Tipo do Evento" para **"Tipo de Serviço"**.
- Substituir o `<Select>` (única escolha) por um componente de **multi-select** baseado em `Popover` + `Command` (padrão shadcn) ou `DropdownMenuCheckboxItem`, listando as mesmas opções de `EVENT_TYPE_LABELS`:
  - Evento Pontual, Temporada, Palestra, Gravação, Serviço Administrativo, Vídeo Remoto, Outro.
- Estado do formulário: `service_types: string[]` (substitui `event_type: string`).
- Validação: pelo menos 1 opção selecionada.
- Ao salvar:
  - Gravar `service_types` (array completo).
  - Gravar `event_type` com o primeiro item selecionado (compat).
- Ao editar um evento existente: carregar `service_types` (ou cair no `[event_type]` se vazio).
- Na **tabela de listagem**: mostrar os tipos como múltiplos badges lado a lado (um por item).

### 3. Constantes / Labels

Renomear referências visuais de "Tipo de Evento" → "Tipo de Serviço" apenas no contexto do modal/tabela de eventos. As chaves do enum (`evento_pontual`, etc.) permanecem iguais para não quebrar dados.

## Fora de escopo

- Página de **Orçamentos** (`Quotes.tsx`) não será alterada — lá o campo é texto livre e tem outro propósito.
- Nenhuma mudança em Financeiro, Agenda, Dashboard ou Relatórios.

## Detalhes técnicos

- Migração via `supabase--migration` adicionando coluna + backfill + trigger `BEFORE INSERT/UPDATE` em `events` que sincroniza `event_type := service_types[1]` quando `service_types` não estiver vazio.
- Multi-select: usar `Popover` + `Command` (`CommandInput`, `CommandItem` com `Check`) — já presente em `src/components/ui`. Trigger é um `Button variant="outline"` mostrando os labels selecionados ou "Selecione...".
