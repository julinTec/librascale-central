// === Professional Type ===
export const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  interprete_libras: 'Intérprete de Libras',
  audiodescritor: 'Audiodescritor',
  consultor: 'Consultor',
  locutor: 'Locutor',
  assistente: 'Assistente',
  outro: 'Outro',
};

// === Event Type ===
export const EVENT_TYPE_LABELS: Record<string, string> = {
  evento_pontual: 'Evento Pontual',
  temporada: 'Temporada',
  palestra: 'Palestra',
  gravacao: 'Gravação',
  servico_administrativo: 'Serviço Administrativo',
  video_remoto: 'Vídeo Remoto',
  outro: 'Outro',
};

// === Event Modality ===
export const EVENT_MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

// === Billing Type ===
export const BILLING_TYPE_LABELS: Record<string, string> = {
  unico: 'Único',
  por_sessao: 'Por Sessão',
  mensal: 'Mensal',
  fechado_periodo: 'Fechado por Período',
  misto: 'Misto',
};

// === Service Type ===
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  interprete_libras: 'Intérprete de Libras',
  audiodescricao: 'Audiodescrição',
  consultoria: 'Consultoria em Acessibilidade',
  locucao: 'Locução',
  aluguel_equipamento: 'Aluguel de Equipamento',
  assistencia: 'Assistência Operacional',
  outro: 'Outro',
};

// === Billing Mode ===
export const BILLING_MODE_LABELS: Record<string, string> = {
  por_sessao: 'Por Sessão',
  por_diaria: 'Por Diária',
  valor_fechado: 'Valor Fechado',
  valor_mensal: 'Valor Mensal',
  item_unico: 'Item Único',
};

// === Revenue Type ===
export const REVENUE_TYPE_LABELS: Record<string, string> = {
  faturamento_sessao: 'Faturamento por Sessão',
  faturamento_mensal: 'Faturamento Mensal',
  faturamento_unico: 'Faturamento Único',
  valor_adicional: 'Valor Adicional',
  outro: 'Outro',
};

// === Cost Type ===
export const COST_TYPE_LABELS: Record<string, string> = {
  mao_de_obra: 'Mão de Obra',
  aluguel_equipamento: 'Aluguel de Equipamento',
  imposto: 'Imposto',
  deslocamento: 'Deslocamento',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  outro: 'Outro',
};

// === Payment Mode ===
export const PAYMENT_MODE_LABELS: Record<string, string> = {
  por_sessao: 'Por Sessão',
  por_diaria: 'Por Diária',
  valor_fechado: 'Valor Fechado',
};

// === Quote Status ===
export const QUOTE_STATUS_LABELS: Record<string, string> = {
  recebido: 'Recebido',
  em_orcamento: 'Em Orçamento',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  recebido: 'bg-info/10 text-info border-info/20',
  em_orcamento: 'bg-warning/10 text-warning border-warning/20',
  enviado: 'bg-primary/10 text-primary border-primary/20',
  aprovado: 'bg-success/10 text-success border-success/20',
  recusado: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelado: 'bg-muted text-muted-foreground border-border',
};

// === Event Status ===
export const EVENT_STATUS_LABELS: Record<string, string> = {
  planejado: 'Planejado',
  confirmado: 'Confirmado',
  em_execucao: 'Em Execução',
  concluido: 'Concluído',
  faturado: 'Faturado',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  planejado: 'bg-info/10 text-info border-info/20',
  confirmado: 'bg-success/10 text-success border-success/20',
  em_execucao: 'bg-warning/10 text-warning border-warning/20',
  concluido: 'bg-primary/10 text-primary border-primary/20',
  faturado: 'bg-success/10 text-success border-success/20',
  encerrado: 'bg-muted text-muted-foreground border-border',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
};

// === Schedule Status (Agenda) ===
export const SCHEDULE_STATUS_V2_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
};

export const SCHEDULE_STATUS_V2_COLORS: Record<string, string> = {
  agendada: 'bg-info/10 text-info border-info/20',
  confirmada: 'bg-success/10 text-success border-success/20',
  realizada: 'bg-primary/10 text-primary border-primary/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  reagendada: 'bg-warning/10 text-warning border-warning/20',
};

// === Payment Status ===
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  parcialmente_pago: 'Parcialmente Pago',
  pago: 'Pago',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning border-warning/20',
  parcialmente_pago: 'bg-info/10 text-info border-info/20',
  pago: 'bg-success/10 text-success border-success/20',
};

// === Receivable Status ===
export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  recebido_parcial: 'Recebido Parcial',
  recebido: 'Recebido',
  vencido: 'Vencido',
};

export const RECEIVABLE_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning border-warning/20',
  recebido_parcial: 'bg-info/10 text-info border-info/20',
  recebido: 'bg-success/10 text-success border-success/20',
  vencido: 'bg-destructive/10 text-destructive border-destructive/20',
};

// === Payable Status ===
export const PAYABLE_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago_parcial: 'Pago Parcial',
  pago: 'Pago',
  vencido: 'Vencido',
};

export const PAYABLE_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning border-warning/20',
  pago_parcial: 'bg-info/10 text-info border-info/20',
  pago: 'bg-success/10 text-success border-success/20',
  vencido: 'bg-destructive/10 text-destructive border-destructive/20',
};

// === Roles ===
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operacional: 'Operacional',
  gestor: 'Gestor',
  interprete: 'Intérprete',
};

// === Legacy (kept for backward compatibility) ===
export const SESSION_STATUS_LABELS = SCHEDULE_STATUS_V2_LABELS;
export const SESSION_STATUS_COLORS = SCHEDULE_STATUS_V2_COLORS;

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  planejada: 'Planejada',
  confirmada: 'Confirmada',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  reprogramada: 'Reprogramada',
};

export const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  planejada: 'bg-info/10 text-info border-info/20',
  confirmada: 'bg-success/10 text-success border-success/20',
  em_execucao: 'bg-warning/10 text-warning border-warning/20',
  concluida: 'bg-primary/10 text-primary border-primary/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  reprogramada: 'bg-muted text-muted-foreground border-border',
};

export const MODALITY_LABELS: Record<string, string> = {
  estudio: 'Estúdio',
  remoto: 'Remoto',
  ao_vivo: 'Ao Vivo',
  hibrido: 'Híbrido',
};

export const EXECUTION_STATUS_LABELS: Record<string, string> = {
  realizada_normalmente: 'Realizada Normalmente',
  atraso_cliente: 'Atraso do Cliente',
  atraso_interno: 'Atraso Interno',
  cancelada_cliente: 'Cancelada pelo Cliente',
  cancelada_internamente: 'Cancelada Internamente',
  parcialmente_realizada: 'Parcialmente Realizada',
  regravada: 'Regravada',
  nao_realizada: 'Não Realizada',
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  atraso_cliente: 'Atraso do Cliente',
  atraso_interno: 'Atraso Interno',
  cancelamento_cliente: 'Cancelamento pelo Cliente',
  cancelamento_interno: 'Cancelamento Interno',
  mudanca_horario: 'Mudança de Horário',
  mudanca_conteudo: 'Mudança de Conteúdo',
  reducao_duracao: 'Redução de Duração',
  ampliacao_duracao: 'Ampliação de Duração',
  ausencia_interprete: 'Ausência de Intérprete',
  problema_tecnico: 'Problema Técnico',
  divergencia_fechamento: 'Divergência de Fechamento',
  outro: 'Outro',
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Análise',
  resolvida: 'Resolvida',
  encerrada: 'Encerrada',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  gravacao_estudio: 'Gravação no Estúdio',
  gravacao_remota: 'Gravação Remota',
  ao_vivo_estudio: 'Ao Vivo + Estúdio',
  formacao: 'Formação',
  regravacao: 'Regravação',
  outro: 'Outro',
};

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  cache: 'Cachê',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  taxa: 'Taxa',
  outro: 'Outro',
};
