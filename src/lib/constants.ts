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

// === Session Status ===
export const SESSION_STATUS_LABELS: Record<string, string> = {
  planejada: 'Planejada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

export const SESSION_STATUS_COLORS: Record<string, string> = {
  planejada: 'bg-info/10 text-info border-info/20',
  confirmada: 'bg-success/10 text-success border-success/20',
  realizada: 'bg-primary/10 text-primary border-primary/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
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

// === Expense Type ===
export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  cache: 'Cachê',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  taxa: 'Taxa',
  outro: 'Outro',
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

// === Roles (kept from original) ===
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operacional: 'Operacional',
  gestor: 'Gestor',
  interprete: 'Intérprete',
};

// === Legacy (kept for backward compatibility) ===
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
