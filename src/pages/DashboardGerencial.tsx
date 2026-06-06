import { useEffect, useState, useMemo } from 'react';
import { useCachedState } from '@/lib/page-cache';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#F43F5E'];

export default function DashboardGerencial() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedClient, setSelectedClient] = useState('todos');
  const [clients, setClients] = useState<any[]>([]);
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i), []);

  const [mainKpis, setMainKpis] = useCachedState('bi:mainKpis', {
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    avgEventValue: 0,
    eventCount: 0,
    growth: 0,
    overdueReceivables: 0
  });

  const [monthlyPerformance, setMonthlyPerformance] = useCachedState<any[]>('bi:monthlyPerformance', []);
  const [revenueByClient, setRevenueByClient] = useCachedState<any[]>('bi:revenueByClient', []);
  const [costsByCategory, setCostsByCategory] = useCachedState<any[]>('bi:costsByCategory', []);
  const [profitabilityByMonth, setProfitabilityByMonth] = useCachedState<any[]>('bi:profitabilityByMonth', []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadBIData();
  }, [selectedYear, selectedClient]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name');
    setClients(data || []);
  };

  const loadBIData = async () => {
    setIsLoading(true);
    const startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    const endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');

    const prevYearStartDate = format(startOfYear(subYears(new Date(selectedYear, 0, 1), 1)), 'yyyy-MM-dd');
    const prevYearEndDate = format(endOfYear(subYears(new Date(selectedYear, 0, 1), 1)), 'yyyy-MM-dd');

    let eventsQuery = supabase.from('events').select('id, contract_value, start_date, client_id');
    let recsQuery = supabase.from('event_receivables').select('amount, net_amount, status, due_date, event_id, events(client_id)');
    let paysQuery = supabase.from('event_payables').select('amount, cost_type, due_date, event_id');

    if (selectedClient !== 'todos') {
      eventsQuery = eventsQuery.eq('client_id', selectedClient);
      recsQuery = recsQuery.eq('events.client_id', selectedClient);
    }

    const [eventsRes, recRes, payRes, prevRecRes] = await Promise.all([
      eventsQuery.gte('start_date', startDate).lte('start_date', endDate),
      recsQuery.gte('due_date', startDate).lte('due_date', endDate),
      paysQuery.gte('due_date', startDate).lte('due_date', endDate),
      supabase.from('event_receivables').select('amount').gte('due_date', prevYearStartDate).lte('due_date', prevYearEndDate),
    ]);

    const events = eventsRes.data || [];
    const receivables = recRes.data || [];
    const payables = payRes.data || [];
    const prevRevenue = (prevRecRes.data || []).reduce((sum, r) => sum + Number(r.amount), 0);
    const overdueReceivables = receivables.filter(r => r.status === 'vencido').reduce((sum, r) => sum + Number(r.amount), 0);

    const totalRevenue = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalCosts = payables.reduce((sum, p) => sum + Number(p.amount), 0);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgEventValue = events.length > 0 ? totalRevenue / events.length : 0;
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    setMainKpis({
      totalRevenue, totalCosts, netProfit, profitMargin, avgEventValue, 
      eventCount: events.length, growth, overdueReceivables
    });

    const monthlyData: any[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = format(startOfMonth(new Date(selectedYear, i, 1)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(selectedYear, i, 1)), 'yyyy-MM-dd');
      const mRev = receivables.filter(r => r.due_date >= monthStart && r.due_date <= monthEnd).reduce((s, r) => s + Number(r.amount), 0);
      const mCost = payables.filter(p => p.due_date >= monthStart && p.due_date <= monthEnd).reduce((s, p) => s + Number(p.amount), 0);
      monthlyData.push({ name: format(new Date(selectedYear, i, 1), 'MMM', { locale: ptBR }), Receita: mRev, Custo: mCost, Lucro: mRev - mCost });
    }
    setMonthlyPerformance(monthlyData);

    const costMap: Record<string, number> = {};
    payables.forEach(p => { costMap[p.cost_type || 'Outros'] = (costMap[p.cost_type || 'Outros'] || 0) + Number(p.amount); });
    setCostsByCategory(Object.entries(costMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    setIsLoading(false);
  };

  const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">BI Gerencial</h1>
          <p className="text-muted-foreground text-sm">Visão estratégica e análise de dados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Receita" value={fmtCurrency(mainKpis.totalRevenue)} icon={DollarSign} color="text-sky-500" />
        <KpiCard title="Lucro" value={fmtCurrency(mainKpis.netProfit)} icon={TrendingUp} color="text-emerald-500" />
        <KpiCard title="Margem" value={`${mainKpis.profitMargin.toFixed(1)}%`} icon={PieChartIcon} color="text-indigo-500" />
        <KpiCard title="Ticket Médio" value={fmtCurrency(mainKpis.avgEventValue)} icon={BarChart3} color="text-amber-500" />
        <KpiCard title="A Receber Vencido" value={fmtCurrency(mainKpis.overdueReceivables)} icon={AlertTriangle} color="text-rose-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Evolução Receita vs Custo</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                <Area type="monotone" dataKey="Receita" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.1} />
                <Area type="monotone" dataKey="Lucro" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição de Custos</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costsByCategory} innerRadius={60} outerRadius={80} dataKey="value" label={({ name }) => name}>
                  {costsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-lg font-bold mt-2 truncate">{value}</p>
      </CardContent>
    </Card>
  );
}