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

export const MODALITY_LABELS: Record<string, string> = {
  estudio: 'Estúdio',
  remoto: 'Remoto',
  ao_vivo: 'Ao Vivo',
  hibrido: 'Híbrido',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  gravacao_estudio: 'Gravação no Estúdio',
  gravacao_remota: 'Gravação Remota',
  ao_vivo_estudio: 'Ao Vivo + Estúdio',
  formacao: 'Formação',
  regravacao: 'Regravação',
  outro: 'Outro',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operacional: 'Operacional',
  gestor: 'Gestor',
  interprete: 'Intérprete',
};
