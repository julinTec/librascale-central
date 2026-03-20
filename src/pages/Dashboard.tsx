import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/lib/constants';
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

  const [stats, setStats] = useState({ events: 0, contractValue: 0, toReceive: 0, toPay: 0, margin: 0, pendingPayments: 0 });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientVolume, setClientVolume] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const { periodStart, periodEnd } = useMemo(() => {
    if (filterMode === 'year') return { periodStart: `${selectedYear}-01-01`, periodEnd: `${selectedYear}-12-31` };
    const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const e = format(lastDayOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    return { periodStart: s, periodEnd: e };
  }, [filterMode, selectedMonth, selectedYear]);

  useEffect(() => { loadDashboard(); }, [periodStart, periodEnd]);

  const loadDashboard = async () => {
    const [eventsRes, recRes, payRes, upcomingRes] = await Promise.all([
      supabase.from('events').select('id, event_name, status, contract_value, client_id, clients(name)').gte('start_date', periodStart).lte('start_date', periodEnd),
      supabase.from('event_receivables').select('amount, status, event_id'),
      supabase.from('event_payables').select('amount, status, event_id'),
      supabase.from('events').select('id, event_name, start_date, status, clients(name)').gte('start_date', new Date().toISOString().split('T')[0]).order('start_date').limit(5),
    ]);

    const evts = eventsRes.data || [];
    const recs = recRes.data || [];
    const pays = payRes.data || [];

    const evtIds = new Set(evts.map(e => e.id));
    const toReceive = recs.filter(r => evtIds.has(r.event_id) && (r.status === 'pendente' || r.status === 'vencido')).reduce((s, r) => s + Number(r.amount), 0);
    const toPay = pays.filter(p => evtIds.has(p.event_id) && (p.status === 'pendente' || p.status === 'vencido')).reduce((s, p) => s + Number(p.amount), 0);
    const contractValue = evts.reduce((s, e) => s + Number(e.contract_value || 0), 0);
    const pendingPayments = pays.filter(p => evtIds.has(p.event_id) && p.status === 'pendente').length;

    setStats({ events: evts.length, contractValue, toReceive, toPay, margin: contractValue - toPay, pendingPayments });
    setUpcomingEvents(upcomingRes.data || []);

    const statusCounts: Record<string, number> = {};
    evts.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; });
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: EVENT_STATUS_LABELS[name] || name, value })));

    const clientMap: Record<string, number> = {};
    evts.forEach(e => { const n = (e.clients as any)?.name || 'N/A'; clientMap[n] = (clientMap[n] || 0) + Number(e.contract_value || 0); });
    setClientVolume(Object.entries(clientMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })));
  };

  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: 'Eventos', value: stats.events, icon: Calendar, color: 'text-primary' },
    { label: 'Valor Contratado', value: fmtMoney(stats.contractValue), icon: DollarSign, color: 'text-primary' },
    { label: 'A Receber', value: fmtMoney(stats.toReceive), icon: TrendingUp, color: 'text-success' },
    { label: 'A Pagar', value: fmtMoney(stats.toPay), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Margem Prevista', value: fmtMoney(stats.margin), icon: DollarSign, color: 'text-info' },
    { label: 'Pgtos Pendentes', value: stats.pendingPayments, icon: AlertTriangle, color: 'text-warning' },
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

      <Card>
        <CardHeader><CardTitle className="text-lg">Próximos Eventos</CardTitle></CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento próximo.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{e.event_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(e.clients as any)?.name} • {e.start_date ? format(new Date(e.start_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                    </p>
                  </div>
                  <Badge className={EVENT_STATUS_COLORS[e.status]}>{EVENT_STATUS_LABELS[e.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
