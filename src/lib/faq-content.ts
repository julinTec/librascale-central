import {
  BookOpen, Users, FileText, Calendar, DollarSign, BarChart3,
  Bell, Settings, LifeBuoy, type LucideIcon,
} from 'lucide-react';

export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; icon: LucideIcon; items: FaqItem[] };

export const faqSections: FaqSection[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    icon: BookOpen,
    items: [
      {
        q: 'O que é o Nosso Mundo - Gestão de Eventos?',
        a: 'É a plataforma completa para gerenciar todo o ciclo de vida dos serviços de acessibilidade da Nosso Mundo Talentos: do primeiro contato com o cliente, passando pelo orçamento, execução do evento, alocação de profissionais, até o fechamento financeiro.',
      },
      {
        q: 'Qual é o fluxo geral do sistema?',
        a: 'O fluxo recomendado é: 1) Orçamento (interno ou via pré-cadastro do cliente) → 2) Aprovação e conversão em Evento → 3) Criação das sessões na Agenda → 4) Alocação dos profissionais → 5) Registro de execução e ocorrências → 6) Fechamento financeiro (a receber e a pagar).',
      },
      {
        q: 'Quais são os perfis de acesso?',
        a: 'Administrador (acesso total, inclusive exclusões e configurações), Operacional (cria, edita e visualiza tudo, mas só pode excluir Orçamentos e Ocorrências), Gestor (visão consolidada e relatórios), e Intérprete (acesso restrito aos próprios dados de agenda).',
      },
      {
        q: 'Como ler o Dashboard inicial?',
        a: 'O Dashboard mostra os indicadores operacionais do período: eventos do mês, agenda em aberto, sessões sem profissional alocado e sessões pendentes de confirmação. Os cards são clicáveis e levam direto à página correspondente.',
      },
    ],
  },
  {
    id: 'clientes-profissionais',
    title: 'Clientes e Profissionais',
    icon: Users,
    items: [
      {
        q: 'Como cadastrar um novo cliente?',
        a: 'Acesse Clientes → "Novo Cliente". Preencha nome, documento, contatos e dados de faturamento. O cliente fica disponível imediatamente para vincular em orçamentos e eventos.',
      },
      {
        q: 'Como cadastrar um profissional?',
        a: 'Em Profissionais → "Novo Profissional", selecione o tipo (Intérprete de Libras, Audiodescritor, Locutor, Consultor, Assistente ou Outro), valores de cachê e dados de contato. Ele já fica disponível para alocação na agenda.',
      },
      {
        q: 'Quando usar cada tipo de profissional?',
        a: 'Intérprete de Libras para tradução em Libras; Audiodescritor para descrição de cenas/imagens; Locutor para narração; Consultor para apoio técnico em acessibilidade; Assistente para apoio operacional em campo.',
      },
    ],
  },
  {
    id: 'orcamentos',
    title: 'Orçamentos',
    icon: FileText,
    items: [
      {
        q: 'Qual a diferença entre Pré-cadastro e Orçamento interno?',
        a: 'O Pré-cadastro é um link público que você envia ao cliente para ele preencher os dados do evento sozinho. O Orçamento interno é criado diretamente pela equipe, com base em um briefing já recebido.',
      },
      {
        q: 'Como envio o link de pré-cadastro ao cliente?',
        a: 'Em Orçamentos → aba Pré-cadastros → "Gerar link". O sistema cria um link único com prazo de expiração. Copie e envie ao cliente. Quando ele preencher, o pré-cadastro aparece com status "Recebido" e gera notificação no sino.',
      },
      {
        q: 'O que significa cada status do orçamento?',
        a: 'Recebido: cliente devolveu o pré-cadastro. Em Orçamento: equipe está montando os valores. Enviado: orçamento foi mandado ao cliente. Aprovado: cliente aceitou. Recusado: cliente não aprovou. Cancelado: arquivado sem efeito.',
      },
      {
        q: 'Como converter um orçamento aprovado em Evento?',
        a: 'No orçamento aprovado, clique em "Converter em Evento". Os dados (cliente, datas, escopo, valores) são copiados automaticamente para um novo Evento, pronto para receber as sessões da agenda.',
      },
    ],
  },
  {
    id: 'eventos-agenda',
    title: 'Eventos e Agenda',
    icon: Calendar,
    items: [
      {
        q: 'Quais são os tipos de evento?',
        a: 'Evento Pontual (data única), Temporada (várias datas), Palestra, Gravação, Vídeo Remoto, Serviço Administrativo e Outro. O tipo influencia os campos exibidos e como o evento aparece nos relatórios.',
      },
      {
        q: 'Quais são as modalidades e tipos de faturamento?',
        a: 'Modalidades: Presencial, Remoto e Híbrido. Faturamento: Único, Por Sessão, Mensal, Fechado por Período ou Misto. Escolha conforme o contrato com o cliente.',
      },
      {
        q: 'Como crio sessões na agenda?',
        a: 'Dentro do Evento, vá até a aba "Agenda" e clique em "Nova Sessão". Defina data, horário, modalidade e local. Cada sessão pode receber um ou mais profissionais alocados.',
      },
      {
        q: 'Como aloco profissionais e o que é "conflito de agenda"?',
        a: 'Na sessão, clique em "Alocar Profissional" e escolha. Se o profissional já tem outra sessão com horário sobreposto, o sistema detecta e mostra um conflito no sino de notificações para você reorganizar.',
      },
      {
        q: 'O que significa cada status da sessão?',
        a: 'Agendada: criada mas não confirmada. Confirmada: profissional ciente. Realizada: já aconteceu. Cancelada: não vai ocorrer. Reagendada: foi remarcada para outra data.',
      },
      {
        q: 'Quando registrar uma Ocorrência manual?',
        a: 'Sempre que algo fugir do planejado: atraso do cliente, cancelamento, mudança de horário, ausência de intérprete, problema técnico, divergência de fechamento. A ocorrência fica vinculada à sessão e aparece nos relatórios.',
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: DollarSign,
    items: [
      {
        q: 'Qual a diferença entre Contas a Receber e a Pagar?',
        a: 'A Receber é o que o cliente deve pagar à empresa pelo serviço. A Pagar é o que a empresa deve aos profissionais alocados (cachês) e demais custos do evento (transporte, equipamento, etc.).',
      },
      {
        q: 'Como é calculado o imposto e a margem?',
        a: 'O sistema aplica automaticamente 6% de imposto sobre o faturamento bruto. A margem de lucro é o resultado de: receita líquida (após imposto) menos todos os custos do evento (mão de obra, equipamentos, deslocamento, etc.).',
      },
      {
        q: 'Como dou baixa em um pagamento ou recebimento?',
        a: 'No item financeiro, clique em "Marcar como Pago/Recebido". É possível registrar baixa total ou parcial — neste caso, o status passa para "Parcial" e o saldo continua aberto.',
      },
      {
        q: 'O que significa cada status financeiro?',
        a: 'Pendente: ainda dentro do prazo. Parcial: parte já foi paga/recebida. Pago/Recebido: quitado. Vencido: passou da data de vencimento e gera alerta no sino.',
      },
    ],
  },
  {
    id: 'relatorios',
    title: 'Relatórios e Dashboard Gerencial',
    icon: BarChart3,
    items: [
      {
        q: 'Como gero um relatório em PDF?',
        a: 'Em Relatórios, escolha o tipo, defina os filtros de data e clique em "Exportar PDF". O arquivo é gerado no navegador com o cabeçalho da empresa e o detalhamento granular das atividades.',
      },
      {
        q: 'Como funcionam os filtros de data?',
        a: 'Todos os relatórios e dashboards usam o mesmo padrão de filtro: período (de/até), com atalhos rápidos para Hoje, Semana, Mês e Ano. A escolha é mantida ao trocar de aba dentro da mesma página.',
      },
      {
        q: 'O que aparece no Dashboard Gerencial?',
        a: 'É uma visão Power BI integrada com indicadores estratégicos consolidados (faturamento, custos, margem, produtividade por profissional, etc.). É somente leitura e atualizada automaticamente.',
      },
    ],
  },
  {
    id: 'notificacoes',
    title: 'Notificações (Sino)',
    icon: Bell,
    items: [
      {
        q: 'O que significam as 4 categorias de alerta?',
        a: 'Eventos: começam hoje, nos próximos 7 dias ou estão sem agenda criada. Agenda: sessões sem profissional, conflitos e pendências de execução. Pré-cadastros: clientes devolveram ou link prestes a expirar. Financeiro: recebíveis e pagamentos vencidos.',
      },
      {
        q: 'Quais são as janelas de tempo consideradas?',
        a: 'Eventos: 7 dias à frente. Agenda sem profissional: 3 dias à frente. Pré-cadastros prestes a expirar: 2 dias. Financeiro: tudo que estiver vencido até hoje.',
      },
      {
        q: 'O que faz "Marcar todas como vistas"?',
        a: 'Esconde temporariamente os alertas atuais — eles voltam a aparecer apenas se a condição mudar (novo evento, nova ocorrência etc.). A preferência é salva por usuário no próprio navegador.',
      },
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configurações e Usuários',
    icon: Settings,
    items: [
      {
        q: 'Como crio ou edito usuários?',
        a: 'Apenas Administradores em Configurações → Usuários podem criar, editar papéis e desativar acessos. Defina o e-mail e o papel (Admin, Operacional, Gestor ou Intérprete).',
      },
      {
        q: 'Como redefinir a senha?',
        a: 'Na tela de Login, clique em "Esqueci minha senha". Você receberá um e-mail com link para criar nova senha. Se não chegar, verifique a caixa de spam.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Solução de Problemas',
    icon: LifeBuoy,
    items: [
      {
        q: 'Não consigo salvar um evento — o que verificar?',
        a: 'Confira se todos os campos obrigatórios estão preenchidos (cliente, datas, tipo, modalidade). Campos com asterisco vermelho são obrigatórios. Datas inválidas (fim antes do início) também bloqueiam o salvamento.',
      },
      {
        q: 'Não vejo o botão Excluir — por quê?',
        a: 'Por segurança, o perfil Operacional só pode excluir Orçamentos e Ocorrências. Para excluir Eventos, Sessões, Clientes ou Profissionais é necessário ter perfil Administrador.',
      },
      {
        q: 'Cliente diz que não recebeu o link do pré-cadastro.',
        a: 'Volte em Orçamentos → Pré-cadastros, copie o link novamente e envie por outro canal (WhatsApp, e-mail). Se o link expirou, gere um novo.',
      },
      {
        q: 'O sistema avisou conflito de agenda. Como resolver?',
        a: 'Significa que o mesmo profissional foi alocado em duas sessões com horários sobrepostos. Acesse a Agenda, identifique as sessões em conflito e troque um dos profissionais ou ajuste o horário.',
      },
      {
        q: 'A página ficou em branco ou deu erro.',
        a: 'Tente recarregar (F5). Se persistir, faça logout, limpe o cache do navegador e entre novamente. Se o erro continuar, anote o que estava fazendo e contate o administrador do sistema.',
      },
    ],
  },
];
