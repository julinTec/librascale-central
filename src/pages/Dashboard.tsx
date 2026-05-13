import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Clock } from 'lucide-react';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS, COST_TYPE_LABELS, SCHEDULE_STATUS_V2_LABELS, SCHEDULE_STATUS_V2_COLORS } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, lastDayOfMonth } from 'date-fns';

const PIE_COLORS = ['hsl(152,45%,28%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(210,80%,52%)', 'hsl(152,20%,60%)', 'hsl(280,60%,50%)', 'hsl(30,80%,50%)'];

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

type FilterMode = 'month' | 'year';

export default function Dashboard() {
  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i), []);

  const [stats, setStats] = useState({ events: 0, contractValue: 0, toReceive: 0, toPay: 0, margin: 0, pendingPayments: 0, realProfit: 0 });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientVolume, setClientVolume] = useState<any[]>([]);
  const [profitByEvent, setProfitByEvent] = useState<any[]>([]);
  const [costsByType, setCostsByType] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ unallocated: number; pendingConfirm: number }>({ unallocated: 0, pendingConfirm: 0 });

  const { periodStart, periodEnd } = useMemo(() => {
    if (filterMode === 'year') return { periodStart: `${selectedYear}-01-01`, periodEnd: `${selectedYear}-12-31` };
    const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const e = format(lastDayOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    return { periodStart: s, periodEnd: e };
  }, [filterMode, selectedMonth, selectedYear]);

  useEffect(() => { loadDashboard(); }, [periodStart, periodEnd]);

  const loadDashboard = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [eventsRes, recRes, payRes, sessionsRes, assignRes] = await Promise.all([
      supabase.from('events').select('id, event_name, status, contract_value, client_id, clients(name)').gte('start_date', periodStart).lte('start_date', periodEnd),
      supabase.from('event_receivables').select('amount, net_amount, status, event_id'),
      supabase.from('event_payables').select('amount, status, event_id, cost_type'),
      supabase.from('event_sessions').select('id, title, session_date, start_time, end_time, status, event_id, events(event_name)').gte('session_date', today).order('session_date').limit(10),
      supabase.from('event_assignments').select('session_id'),
    ]);

    const evts = eventsRes.data || [];
    const recs = recRes.data || [];
    const pays = payRes.data || [];
    const sessions = sessionsRes.data || [];
    const assigns = assignRes.data || [];

    const evtIds = new Set(evts.map(e => e.id));
    const toReceive = recs.filter(r => evtIds.has(r.event_id) && (r.status === 'pendente' || r.status === 'vencido')).reduce((s, r) => s + Number(r.amount), 0);
    const toPay = pays.filter(p => evtIds.has(p.event_id) && (p.status === 'pendente' || p.status === 'vencido')).reduce((s, p) => s + Number(p.amount), 0);
    const contractValue = evts.reduce((s, e) => s + Number(e.contract_value || 0), 0);
    const pendingPayments = pays.filter(p => evtIds.has(p.event_id) && p.status === 'pendente').length;

    // Real Profit: net received - paid costs
    const netReceived = recs.filter(r => evtIds.has(r.event_id) && r.status === 'recebido').reduce((s, r) => s + Number(r.net_amount || 0), 0);
    const paidCosts = pays.filter(p => evtIds.has(p.event_id) && p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0);
    const realProfit = netReceived - paidCosts;

    setStats({ events: evts.length, contractValue, toReceive, toPay, margin: contractValue - toPay, pendingPayments, realProfit });

    // Status chart
    const statusCounts: Record<string, number> = {};
    evts.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; });
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: EVENT_STATUS_LABELS[name] || name, value })));

    // Client volume
    const clientMap: Record<string, number> = {};
    evts.forEach(e => { const n = (e.clients as any)?.name || 'Sem cliente'; clientMap[n] = (clientMap[n] || 0) + Number(e.contract_value || 0); });
    setClientVolume(Object.entries(clientMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })));

    // Profit by event
    const profitData = evts.map(ev => {
      const evNetRec = recs.filter(r => r.event_id === ev.id && r.status === 'recebido').reduce((s, r) => s + Number(r.net_amount || 0), 0);
      const evCosts = pays.filter(p => p.event_id === ev.id && p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0);
      return { name: ev.event_name, lucro: Math.round((evNetRec - evCosts) * 100) / 100 };
    }).filter(d => d.lucro !== 0);
    setProfitByEvent(profitData);

    // Costs by type
    const costMap: Record<string, number> = {};
    pays.filter(p => evtIds.has(p.event_id)).forEach(p => {
      const t = COST_TYPE_LABELS[p.cost_type] || p.cost_type;
      costMap[t] = (costMap[t] || 0) + Number(p.amount);
    });
    setCostsByType(Object.entries(costMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })));

    // Upcoming sessions
    setUpcomingSessions(sessions.slice(0, 5));

    // Alerts
    const sessionIds = new Set(assigns.map(a => a.session_id));
    const futureSessions = sessions.filter(s => s.status !== 'cancelada' && s.status !== 'realizada');
    const unallocated = futureSessions.filter(s => !sessionIds.has(s.id)).length;
    const pendingConfirm = futureSessions.filter(s => s.status === 'agendada').length;
    setAlerts({ unallocated, pendingConfirm });
  };

  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: 'Eventos', value: stats.events, icon: Calendar, color: 'text-primary' },
    { label: 'Valor Contratado', value: fmtMoney(stats.contractValue), icon: DollarSign, color: 'text-primary' },
    { label: 'A Receber', value: fmtMoney(stats.toReceive), icon: TrendingUp, color: 'text-success' },
    { label: 'A Pagar', value: fmtMoney(stats.toPay), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Margem Prevista', value: fmtMoney(stats.margin), icon: DollarSign, color: 'text-info' },
    { label: 'Lucro Real', value: fmtMoney(stats.realProfit), icon: CheckCircle, color: stats.realProfit >= 0 ? 'text-success' : 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-input overflow-hidden">
          <Button size="sm" variant={filterMode === 'month' ? 'default' : 'ghost'} className="rounded-none" onClick={() => setFilterMode('month')}>Mês</Button>
          <Button size="sm" variant={filterMode === 'year' ? 'default' : 'ghost'} className="rounded-none" onClick={() => setFilterMode('year')}>Ano</Button>
        </div>
        {filterMode === 'month' && (
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold truncate">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operational Alerts */}
      {(alerts.unallocated > 0 || alerts.pendingConfirm > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {alerts.unallocated > 0 && (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate('/agenda')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/agenda'); }}
              className="border-warning/50 bg-warning/5 cursor-pointer transition hover:bg-warning/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-warning/40"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">{alerts.unallocated} agenda(s) sem profissional</p>
                  <p className="text-xs text-muted-foreground">Agende profissionais para as próximas sessões</p>
                </div>
              </CardContent>
            </Card>
          )}
          {alerts.pendingConfirm > 0 && (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate('/agenda')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/agenda'); }}
              className="border-info/50 bg-info/5 cursor-pointer transition hover:bg-info/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-info/40"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-info" />
                <div>
                  <p className="font-medium text-sm">{alerts.pendingConfirm} agenda(s) pendente(s) de confirmação</p>
                  <p className="text-xs text-muted-foreground">Confirme as agendas com status "Agendada"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Volume Financeiro por Cliente</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Bar dataKey="value" fill="hsl(152,45%,28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Eventos por Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Lucro Real por Evento</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {profitByEvent.length === 0 ? (
                <p className="text-muted-foreground text-sm pt-8 text-center">Nenhum dado financeiro no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByEvent}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                    <Bar dataKey="lucro" fill="hsl(210,80%,52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Custos por Tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {costsByType.length === 0 ? (
                <p className="text-muted-foreground text-sm pt-8 text-center">Nenhum custo no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costsByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: R$${value.toLocaleString('pt-BR')}`}>
                      {costsByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Próximas Agendas</CardTitle></CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma agenda próxima.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{s.title || (s.events as any)?.event_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.session_date ? format(new Date(s.session_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'} • {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <Badge className={SCHEDULE_STATUS_V2_COLORS[s.status]}>{SCHEDULE_STATUS_V2_LABELS[s.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
