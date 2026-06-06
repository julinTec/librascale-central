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
  Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  '#0EA5E9', // Sky 500
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#6366F1', // Indigo 500
  '#EC4899', // Pink 500
  '#8B5CF6', // Violet 500
  '#F43F5E', // Rose 500
];

const GRADIENTS = [
  { id: 'colorSky', color: '#0EA5E9' },
  { id: 'colorEmerald', color: '#10B981' },
  { id: 'colorAmber', color: '#F59E0B' },
];

export default function DashboardGerencial() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i), []);

  const [mainKpis, setMainKpis] = useCachedState('bi:mainKpis', {
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    avgEventValue: 0,
    eventCount: 0,
    growth: 0
  });

  const [monthlyPerformance, setMonthlyPerformance] = useCachedState<any[]>('bi:monthlyPerformance', []);
  const [revenueByClient, setRevenueByClient] = useCachedState<any[]>('bi:revenueByClient', []);
  const [costsByCategory, setCostsByCategory] = useCachedState<any[]>('bi:costsByCategory', []);
  const [profitabilityByMonth, setProfitabilityByMonth] = useCachedState<any[]>('bi:profitabilityByMonth', []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBIData();
  }, [selectedYear]);

  const loadBIData = async () => {
    setIsLoading(true);
    const startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    const endDate = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');

    // Previous year for growth calculation
    const prevYearStartDate = format(startOfYear(new Date(selectedYear - 1, 0, 1)), 'yyyy-MM-dd');
    const prevYearEndDate = format(endOfYear(new Date(selectedYear - 1, 0, 1)), 'yyyy-MM-dd');

    const [eventsRes, recRes, payRes, prevEventsRes, prevRecRes] = await Promise.all([
      supabase.from('events').select('id, contract_value, start_date').gte('start_date', startDate).lte('start_date', endDate),
      supabase.from('event_receivables').select('amount, net_amount, status, due_date').gte('due_date', startDate).lte('due_date', endDate),
      supabase.from('event_payables').select('amount, cost_type, due_date').gte('due_date', startDate).lte('due_date', endDate),
      supabase.from('events').select('contract_value').gte('start_date', prevYearStartDate).lte('start_date', prevYearEndDate),
      supabase.from('event_receivables').select('amount').gte('due_date', prevYearStartDate).lte('due_date', prevYearEndDate),
    ]);

    const events = eventsRes.data || [];
    const receivables = recRes.data || [];
    const payables = payRes.data || [];
    const prevRevenue = (prevRecRes.data || []).reduce((sum, r) => sum + Number(r.amount), 0);

    // KPI Calculations
    const totalRevenue = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalCosts = payables.reduce((sum, p) => sum + Number(p.amount), 0);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgEventValue = events.length > 0 ? totalRevenue / events.length : 0;
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    setMainKpis({
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
      avgEventValue,
      eventCount: events.length,
      growth
    });

    // Monthly Performance Chart
    const monthlyData: any[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));
      const mStartStr = format(monthStart, 'yyyy-MM-dd');
      const mEndStr = format(monthEnd, 'yyyy-MM-dd');

      const mRev = receivables
        .filter(r => r.due_date >= mStartStr && r.due_date <= mEndStr)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const mCost = payables
        .filter(p => p.due_date >= mStartStr && p.due_date <= mEndStr)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      monthlyData.push({
        name: format(monthStart, 'MMM', { locale: ptBR }),
        Receita: Math.round(mRev),
        Custo: Math.round(mCost),
        Lucro: Math.round(mRev - mCost)
      });
    }
    setMonthlyPerformance(monthlyData);

    // Costs by Category
    const costMap: Record<string, number> = {};
    payables.forEach(p => {
      const type = p.cost_type || 'Outros';
      costMap[type] = (costMap[type] || 0) + Number(p.amount);
    });
    setCostsByCategory(
      Object.entries(costMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    );

    // Profitability Trend (last 12 months from now)
    const trendData: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const mStart = format(startOfMonth(targetDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd');

      // Re-query or filter if we had more data, for now use current year subset for demo feel
      const mRev = receivables
        .filter(r => r.due_date >= mStart && r.due_date <= mEnd)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const mCost = payables
        .filter(p => p.due_date >= mStart && p.due_date <= mEnd)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      trendData.push({
        month: format(targetDate, 'MM/yy'),
        margem: mRev > 0 ? Math.round(((mRev - mCost) / mRev) * 100) : 0
      });
    }
    setProfitabilityByMonth(trendData);

    setIsLoading(false);
  };

  const fmtCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Gerencial BI</h1>
          <p className="text-muted-foreground mt-1">Análise estratégica de performance e resultados financeiros.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[110px] border-0 focus:ring-0 h-8 p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Receita Bruta" 
          value={fmtCurrency(mainKpis.totalRevenue)} 
          subValue={`${mainKpis.growth > 0 ? '+' : ''}${mainKpis.growth.toFixed(1)}% vs ano ant.`}
          trend={mainKpis.growth >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          color="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <KpiCard 
          title="Lucro Líquido" 
          value={fmtCurrency(mainKpis.netProfit)} 
          subValue="Resultado do exercício"
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard 
          title="Margem de Lucro" 
          value={`${mainKpis.profitMargin.toFixed(1)}%`} 
          subValue="Rentabilidade média"
          icon={PieChartIcon}
          color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
        <KpiCard 
          title="Ticket Médio" 
          value={fmtCurrency(mainKpis.avgEventValue)} 
          subValue={`Baseado em ${mainKpis.eventCount} eventos`}
          icon={BarChart3}
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Performance Area Chart */}
        <Card className="lg:col-span-2 shadow-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Desempenho Mensal</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">Comparativo entre Receita e Custos</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span>Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Lucro</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPerformance}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [fmtCurrency(value), '']}
                  />
                  <Area type="monotone" dataKey="Receita" stroke="#0EA5E9" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="Lucro" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Costs Distribution Pie Chart */}
        <Card className="shadow-sm border-muted/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Composição de Custos</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Distribuição por categoria</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => fmtCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Margin Trend Line Chart */}
        <Card className="shadow-sm border-muted/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução da Margem (%)</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Tendência de rentabilidade (LTM)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitabilityByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    formatter={(v) => [`${v}%`, 'Margem']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="margem" 
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Indicators / Summary Table */}
        <Card className="shadow-sm border-muted/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo Operacional</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Métricas de produtividade e volume</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-2">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
                    <Calendar className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Volume de Eventos</p>
                    <p className="text-xs text-muted-foreground">Total realizados no período</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{mainKpis.eventCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Faturamento Médio / Evento</p>
                    <p className="text-xs text-muted-foreground">Média global de contratos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{fmtCurrency(mainKpis.avgEventValue)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Custo Médio / Evento</p>
                    <p className="text-xs text-muted-foreground">Incluindo taxas e impostos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{fmtCurrency(mainKpis.eventCount > 0 ? mainKpis.totalCosts / mainKpis.eventCount : 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subValue, trend, icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm border-muted/50 overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <p className="text-xs text-muted-foreground pt-1">{subValue}</p>
        </div>
      </CardContent>
      {/* Subtle background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-foreground pointer-events-none transform rotate-12">
        <Icon size={100} />
      </div>
    </Card>
  );
}
