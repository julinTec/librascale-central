

## Plano de Implementação: Sistema de Gestão de Intérpretes de Libras

### Visão Geral
Sistema web completo para gestão operacional e auditoria de escalas de intérpretes de Libras, com tema verde profissional, usando Lovable Cloud (Supabase) como backend.

---

### Fase 1: Fundação (Backend + Autenticação + Layout)

**Banco de Dados** — Criar todas as tabelas com relacionamentos:
- `users` + `user_roles` (admin, operacional, gestor, intérprete)
- `clients` (clientes contratantes com pacote de horas)
- `interpreters` (intérpretes com disponibilidade e vínculo)
- `schedules` (agenda/escalas — núcleo do sistema)
- `schedule_audit_logs` (histórico de alterações com campo anterior/novo)
- `execution_logs` (registro de execução real)
- `incidents` (ocorrências operacionais)
- `contract_hours` (pacotes de horas por cliente)
- `period_closings` (fechamentos quinzenais/mensais)

**Autenticação e Perfis**
- Login com email/senha
- 4 perfis: Administrador, Operacional, Gestor, Intérprete
- Controle de acesso por perfil em cada tela
- RLS (Row-Level Security) nas tabelas

**Layout Base**
- Sidebar lateral com navegação por módulo
- Tema verde profissional escuro
- Responsivo para desktop e tablet
- Header com info do usuário e perfil

---

### Fase 2: Módulos de Cadastro

**Tela de Clientes**
- Listagem com busca, filtros (status, tipo contrato) e paginação
- Modal/formulário de cadastro e edição
- Visualização detalhada com histórico de consumo
- Badges de status ativo/inativo

**Tela de Intérpretes**
- Listagem com busca e filtros
- Cadastro com campos de disponibilidade e especialidade
- Visualização de agendas vinculadas

---

### Fase 3: Agenda (Módulo Principal)

**Tela de Agenda/Escalas**
- Visualização em lista e calendário
- Criação de escala com todos os campos (cliente, intérprete, horários, modalidade, tipo, etc.)
- Status coloridos: planejada, confirmada, em execução, concluída, cancelada, reprogramada
- Filtros por cliente, intérprete, data, status, modalidade
- **Auditoria automática**: toda alteração grava log com usuário, campo, valor anterior, valor novo e motivo

---

### Fase 4: Execução e Ocorrências

**Tela de Execução Real**
- Registrar horário real de início/fim
- Calcular duração real e horas faturáveis
- Selecionar situação final (realizada, atraso, cancelada, parcial, etc.)
- Campo de observação operacional

**Tela de Ocorrências**
- Registro de incidentes vinculados a agendas
- Tipos pré-definidos (atraso, cancelamento, mudança, problema técnico)
- Campos de impacto em minutos e financeiro
- Filtros por tipo, cliente, período

---

### Fase 5: Fechamento e Dashboard

**Tela de Fechamento de Horas**
- Consolidação quinzenal/mensal por cliente
- Totais: planejadas, realizadas, faturáveis, saldo do pacote, horas adicionais
- Filtros por cliente, período, intérprete
- Valor total calculado

**Dashboard Gerencial**
- Cards com KPIs: horas do mês, cancelamentos, atrasos
- Gráficos: horas por cliente, evolução mensal, distribuição por status
- Tabela de atividades do dia
- Rankings: clientes com mais ocorrências, intérpretes por horas
- Filtros por período, cliente e intérprete

---

### Fase 6: Auditoria e Configurações

**Tela de Auditoria**
- Histórico completo de alterações nas agendas
- Filtros por data, usuário, tipo de alteração
- Visualização de antes/depois

**Tela de Configurações**
- Gestão de perfis e usuários
- Parâmetros do sistema
- Tipos de atividade e classificações

---

### Dados de Exemplo
- Clientes: SEDUC, DETRAN, Cliente Exemplo 3
- Intérpretes fictícios com dados realistas
- Agendas de exemplo com diferentes status
- Ocorrências de amostra

### Design
- Paleta verde escuro profissional com tons de esmeralda
- Cards com sombras suaves, badges coloridos por status
- Tipografia limpa e hierarquia visual clara
- Gráficos com Recharts

