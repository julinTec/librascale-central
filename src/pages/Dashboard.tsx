import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Clock, AlertTriangle, CheckCircle, XCircle, Users, CalendarIcon } from 'lucide-react';
import { SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, lastDayOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['hsl(152,45%,28%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(210,80%,52%)', 'hsl(152,20%,60%)', 'hsl(280,60%,50%)'];

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

type FilterMode = 'date' | 'month' | 'year';

export default function Dashboard() {
  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [dateFrom, setDateFrom] = useState<Date>(now);
  const [dateTo, setDateTo] = useState<Date>(now);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [stats, setStats] = useState({ planned: 0, realized: 0, billable: 0, activities: 0, cancellations: 0, delays: 0 });
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientHours, setClientHours] = useState<any[]>([]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - 2 + i);
  }, []);

  const { periodStart, periodEnd } = useMemo(() => {
    if (filterMode === 'date') {
      const d = format(selectedDate, 'yyyy-MM-dd');
      return { periodStart: d, periodEnd: d };
    }
    if (filterMode === 'year') {
      return { periodStart: `${selectedYear}-01-01`, periodEnd: `${selectedYear}-12-31` };
    }
    // month
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const end = format(lastDayOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    return { periodStart: start, periodEnd: end };
  }, [filterMode, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboard();
  }, [periodStart, periodEnd]);

  const loadDashboard = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [schedulesRes, todayRes, execRes, incidentsRes] = await Promise.all([
      supabase.from('schedules').select('status, planned_duration_minutes, client_id, clients(name)').gte('activity_date', periodStart).lte('activity_date', periodEnd),
      supabase.from('schedules').select('*, clients(name), interpreters(full_name)').eq('activity_date', today).order('planned_start'),
      supabase.from('execution_logs').select('billable_hours, worked_hours, schedule_id, schedules!inner(activity_date)').gte('schedules.activity_date', periodStart).lte('schedules.activity_date', periodEnd),
      supabase.from('incidents').select('incident_type').gte('created_at', periodStart).lte('created_at', periodEnd + 'T23:59:59'),
    ]);

    const schedules = schedulesRes.data || [];
    const execs = execRes.data || [];
    const incidents = incidentsRes.data || [];

    const plannedMins = schedules.reduce((s, r) => s + (r.planned_duration_minutes || 0), 0);
    const realizedH = execs.reduce((s, r) => s + (r.worked_hours || 0), 0);
    const billableH = execs.reduce((s, r) => s + (r.billable_hours || 0), 0);
    const cancellations = schedules.filter(s => s.status === 'cancelada').length;
    const delays = incidents.filter(i => i.incident_type === 'atraso_cliente' || i.incident_type === 'atraso_interno').length;

    setStats({ planned: Math.round(plannedMins / 60 * 10) / 10, realized: realizedH, billable: billableH, activities: schedules.length, cancellations, delays });
    setTodaySchedules(todayRes.data || []);

    const statusCounts: Record<string, number> = {};
    schedules.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: SCHEDULE_STATUS_LABELS[name] || name, value })));

    const clientMap: Record<string, number> = {};
    schedules.forEach(s => {
      const cName = (s.clients as any)?.name || 'N/A';
      clientMap[cName] = (clientMap[cName] || 0) + (s.planned_duration_minutes || 0) / 60;
    });
    setClientHours(Object.entries(clientMap).map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 })));
  };

  const kpis = [
    { label: 'Horas Planejadas', value: `${stats.planned}h`, icon: Clock, color: 'text-primary' },
    { label: 'Horas Realizadas', value: `${stats.realized}h`, icon: CheckCircle, color: 'text-success' },
    { label: 'Horas Faturáveis', value: `${stats.billable}h`, icon: CalendarDays, color: 'text-info' },
    { label: 'Atividades', value: stats.activities, icon: Users, color: 'text-primary' },
    { label: 'Cancelamentos', value: stats.cancellations, icon: XCircle, color: 'text-destructive' },
    { label: 'Atrasos', value: stats.delays, icon: AlertTriangle, color: 'text-warning' },
  ];

  const modeButtons: { mode: FilterMode; label: string }[] = [
    { mode: 'date', label: 'Data' },
    { mode: 'month', label: 'Mês' },
    { mode: 'year', label: 'Ano' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-input overflow-hidden">
          {modeButtons.map(({ mode, label }) => (
            <Button
              key={mode}
              size="sm"
              variant={filterMode === mode ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setFilterMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>

        {filterMode === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[180px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}

        {filterMode === 'month' && (
          <>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}

        {filterMode === 'year' && (
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Horas por Cliente</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(152,45%,28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Distribuição por Status</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-lg">Agenda do Dia</CardTitle></CardHeader>
        <CardContent>
          {todaySchedules.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma atividade agendada para hoje.</p>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{s.title || 'Sem título'}</p>
                    <p className="text-xs text-muted-foreground">
                      {(s.clients as any)?.name} • {(s.interpreters as any)?.full_name} • {s.planned_start?.slice(0, 5)} - {s.planned_end?.slice(0, 5)}
                    </p>
                  </div>
                  <Badge className={SCHEDULE_STATUS_COLORS[s.status]}>{SCHEDULE_STATUS_LABELS[s.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
