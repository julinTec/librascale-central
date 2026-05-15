## Central de Ajuda — FAQ do Sistema

Nova página `/ajuda` acessível pelo menu lateral e por um atalho no header, cobrindo todas as funcionalidades do sistema em formato de FAQ navegável e pesquisável.

### Estrutura da página

**Cabeçalho**
- Título "Central de Ajuda" + subtítulo
- Campo de busca em tempo real (filtra perguntas e respostas, ignora acentos/maiúsculas)
- Grid de cards "Acesso rápido" linkando às seções principais

**Seções (Accordion por categoria)**

1. **Primeiros Passos**
   - O que é o Nosso Mundo - Gestão de Eventos
   - Fluxo geral: Orçamento → Evento → Agenda → Alocação → Financeiro
   - Perfis de acesso (Admin, Operacional, Gestor, Intérprete) e permissões de cada um
   - Como ler o Dashboard inicial e o sino de notificações

2. **Clientes e Profissionais**
   - Cadastrar/editar cliente
   - Cadastrar profissional (intérprete, audiodescritor, locutor, consultor, assistente)
   - Tipos de profissional e quando usar cada um

3. **Orçamentos**
   - Diferença entre Pré-cadastro (link público) e Orçamento interno
   - Como enviar link de pré-cadastro ao cliente
   - Status do orçamento (Recebido, Em Orçamento, Enviado, Aprovado, Recusado, Cancelado)
   - Como converter orçamento aprovado em Evento

4. **Eventos e Agenda**
   - Tipos de evento (Pontual, Temporada, Palestra, Gravação, Vídeo Remoto, Serviço Administrativo)
   - Modalidades (Presencial, Remoto, Híbrido) e Tipos de Faturamento
   - Criar sessões de agenda dentro do evento
   - Alocar profissionais e o que significa "conflito de agenda"
   - Status da sessão (Agendada, Confirmada, Realizada, Cancelada, Reagendada)
   - Ocorrências manuais: quando e como registrar

5. **Financeiro**
   - Contas a Receber x Contas a Pagar
   - Cálculo de imposto (6%) e margem de lucro
   - Marcar pagamento/recebimento e baixas parciais
   - Status (Pendente, Parcial, Pago/Recebido, Vencido)

6. **Relatórios e Dashboard Gerencial**
   - Como gerar PDF de relatórios
   - Filtros de data unificados
   - O que aparece no Dashboard Gerencial (Power BI)

7. **Notificações (Sino)**
   - O que cada categoria significa (Eventos, Agenda, Pré-cadastros, Financeiro)
   - Janelas de tempo (7d eventos, 3d agenda, 2d pré-cadastros)
   - "Marcar todas como vistas"

8. **Configurações e Usuários**
   - Criar/editar usuários e definir papéis
   - Redefinir senha

9. **Solução de Problemas**
   - "Não consigo salvar um evento" → checar campos obrigatórios
   - "Não vejo o botão Excluir" → restrições por papel (operacional só exclui Orçamentos e Ocorrências)
   - "Cliente não recebeu o link do pré-cadastro" → reenviar link
   - "Conflito de agenda detectado" → como resolver
   - "Página em branco / erro" → recarregar e limpar cache

### Implementação técnica

- Página: `src/pages/Help.tsx`
- Conteúdo: `src/lib/faq-content.ts` — array tipado `faqSections: { id, title, icon, items: { q, a }[] }`, fácil de manter sem tocar na UI
- UI: shadcn `Accordion`, `Card`, `Input` + ícones lucide (`HelpCircle`, `BookOpen`, `Users`, `FileText`, `Calendar`, `DollarSign`, `Bell`, `Settings`, `LifeBuoy`)
- Busca: filtro client-side com normalização (sem acento, lowercase) sobre pergunta + resposta; seções sem match são ocultadas
- Rota: adicionar `<Route path="/ajuda" element={<Help />} />` em `src/App.tsx` (visível a todos os usuários autenticados, sem restrição de papel)
- Menu lateral: novo item "Ajuda" (ícone `HelpCircle`) em `AppSidebar.tsx`, posicionado acima de "Configurações"
- Atalho no header: ícone `HelpCircle` em `AppLayout.tsx` ao lado do sino, linkando para `/ajuda`
- Tokens semânticos do design system (sem cores hardcoded)
- SEO: `<title>Central de Ajuda — Nosso Mundo</title>`, H1 único, conteúdo semântico

### Arquivos

**Novos**
- `src/pages/Help.tsx`
- `src/lib/faq-content.ts`

**Editados**
- `src/App.tsx` — nova rota `/ajuda`
- `src/components/AppSidebar.tsx` — item "Ajuda" no menu
- `src/components/AppLayout.tsx` — botão `HelpCircle` no header

Sem migrações, sem mudanças de backend.
