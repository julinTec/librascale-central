import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react';
import { SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['hsl(152,45%,28%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(210,80%,52%)', 'hsl(152,20%,60%)', 'hsl(280,60%,50%)'];

export default function Dashboard() {
  const [stats, setStats] = useState({ planned: 0, realized: 0, billable: 0, activities: 0, cancellations: 0, delays: 0 });
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientHours, setClientHours] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';

    const [schedulesRes, todayRes, execRes, incidentsRes] = await Promise.all([
      supabase.from('schedules').select('status, planned_duration_minutes, client_id, clients(name)').gte('activity_date', monthStart),
      supabase.from('schedules').select('*, clients(name), interpreters(full_name)').eq('activity_date', today).order('planned_start'),
      supabase.from('execution_logs').select('billable_hours, worked_hours, schedule_id, schedules!inner(activity_date)').gte('schedules.activity_date', monthStart),
      supabase.from('incidents').select('incident_type').gte('created_at', monthStart),
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

    // Status distribution
    const statusCounts: Record<string, number> = {};
    schedules.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: SCHEDULE_STATUS_LABELS[name] || name, value })));

    // Hours by client
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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
