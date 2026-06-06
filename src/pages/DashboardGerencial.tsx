import { useEffect, useState, useMemo } from 'react';
import { useCachedState } from '@/lib/page-cache';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  Target,
  Zap,
  Briefcase,
  ShieldCheck,
  TrendingUp as GrowthIcon,
  Percent
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth, subYears, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#F43F5E', '#14B8A6'];

export default function DashboardGerencial() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('todos');
  const [selectedClient, setSelectedClient] = useState('todos');
  const [selectedQuarter, setSelectedQuarter] = useState('todos');
  const [clients, setClients] = useState<any[]>([]);
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i), []);
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  const [mainKpis, setMainKpis] = useCachedState('bi:mainKpis', {
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    avgEventValue: 0,
    eventCount: 0,
    growth: 0,
    overdueReceivables: 0,
    ltv: 0,
    cacEstimate: 0, // Simplified CAC
    burnRate: 0
  });

  const [monthlyPerformance, setMonthlyPerformance] = useCachedState<any[]>('bi:monthlyPerformance', []);
  const [costsByCategory, setCostsByCategory] = useCachedState<any[]>('bi:costsByCategory', []);
  const [clientConcentration, setClientConcentration] = useCachedState<any[]>('bi:clientConcentration', []);
  const [operationalEfficiency, setOperationalEfficiency] = useCachedState<any[]>('bi:operationalEfficiency', []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadBIData();
  }, [selectedYear, selectedMonth, selectedClient, selectedQuarter]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name');
    setClients(data || []);
  };

  const loadBIData = async () => {
    setIsLoading(true);
    
    // Date Range Logic
    let startDate = startOfYear(new Date(selectedYear, 0, 1));
    let endDate = endOfYear(new Date(selectedYear, 0, 1));

    if (selectedMonth !== 'todos') {
      startDate = new Date(selectedYear, parseInt(selectedMonth) - 1, 1);
      endDate = endOfMonth(startDate);
    } else if (selectedQuarter !== 'todos') {
      const q = parseInt(selectedQuarter);
      startDate = new Date(selectedYear, (q - 1) * 3, 1);
      endDate = endOfMonth(new Date(selectedYear, q * 3 - 1, 1));
    }

    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const prevYearStartDateStr = format(startOfYear(subYears(startDate, 1)), 'yyyy-MM-dd');
    const prevYearEndDateStr = format(endOfYear(subYears(endDate, 1)), 'yyyy-MM-dd');

    // Queries
    let eventsQuery = supabase.from('events').select('id, contract_value, start_date, client_id, status');
    let recsQuery = supabase.from('event_receivables').select('amount, net_amount, status, due_date, event_id, events(client_id)');
    let paysQuery = supabase.from('event_payables').select('amount, cost_type, due_date, status, event_id');

    if (selectedClient !== 'todos') {
      eventsQuery = eventsQuery.eq('client_id', selectedClient);
      recsQuery = recsQuery.eq('events.client_id', selectedClient);
    }

    const [eventsRes, recRes, payRes, prevRecRes, allClientsRes] = await Promise.all([
      eventsQuery.gte('start_date', startDateStr).lte('start_date', endDateStr),
      recsQuery.gte('due_date', startDateStr).lte('due_date', endDateStr),
      paysQuery.gte('due_date', startDateStr).lte('due_date', endDateStr),
      supabase.from('event_receivables').select('amount').gte('due_date', prevYearStartDateStr).lte('due_date', prevYearEndDateStr),
      supabase.from('clients').select('id, name')
    ]);

    const events = eventsRes.data || [];
    const receivables = recRes.data || [];
    const payables = payRes.data || [];
    const allClients = allClientsRes.data || [];
    const prevRevenue = (prevRecRes.data || []).reduce((sum, r) => sum + Number(r.amount), 0);
    
    // 1. Strategic KPIs
    const totalRevenue = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalCosts = payables.reduce((sum, p) => sum + Number(p.amount), 0);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const overdueReceivables = receivables.filter(r => r.status === 'vencido').reduce((sum, r) => sum + Number(r.amount), 0);
    
    // LTV Estimate (Average revenue per client)
    const activeClientsCount = new Set(events.map(e => e.client_id)).size;
    const ltv = activeClientsCount > 0 ? totalRevenue / activeClientsCount : 0;

    // Burn Rate (Average monthly costs)
    const monthsInPeriod = selectedQuarter === 'todos' ? 12 : 3;
    const burnRate = totalCosts / monthsInPeriod;

    setMainKpis({
      totalRevenue, totalCosts, netProfit, profitMargin, 
      avgEventValue: events.length > 0 ? totalRevenue / events.length : 0,
      eventCount: events.length, growth, overdueReceivables,
      ltv, cacEstimate: 0, burnRate
    });

    // 2. Monthly Performance Chart
    const monthlyData: any[] = [];
    const loopLimit = selectedQuarter === 'todos' ? 12 : 3;
    const startMonthOffset = selectedQuarter === 'todos' ? 0 : (parseInt(selectedQuarter) - 1) * 3;

    for (let i = 0; i < loopLimit; i++) {
      const monthIdx = startMonthOffset + i;
      const mStart = format(startOfMonth(new Date(selectedYear, monthIdx, 1)), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(new Date(selectedYear, monthIdx, 1)), 'yyyy-MM-dd');
      
      const mRev = receivables.filter(r => r.due_date >= mStart && r.due_date <= mEnd).reduce((s, r) => s + Number(r.amount), 0);
      const mCost = payables.filter(p => p.due_date >= mStart && p.due_date <= mEnd).reduce((s, p) => s + Number(p.amount), 0);
      
      monthlyData.push({ 
        name: format(new Date(selectedYear, monthIdx, 1), 'MMM', { locale: ptBR }), 
        Receita: Math.round(mRev), 
        Custo: Math.round(mCost), 
        Lucro: Math.round(mRev - mCost),
        Margem: mRev > 0 ? Math.round(((mRev - mCost) / mRev) * 100) : 0
      });
    }
    setMonthlyPerformance(monthlyData);

    // 3. Cost Distribution
    const costMap: Record<string, number> = {};
    payables.forEach(p => { costMap[p.cost_type || 'Outros'] = (costMap[p.cost_type || 'Outros'] || 0) + Number(p.amount); });
    setCostsByCategory(Object.entries(costMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    // 4. Client Concentration (Pareto-like)
    const clientRevMap: Record<string, number> = {};
    receivables.forEach(r => {
      const clientId = (r.events as any)?.client_id;
      if (clientId) {
        const clientName = allClients.find(c => c.id === clientId)?.name || 'Outros';
        clientRevMap[clientName] = (clientRevMap[clientName] || 0) + Number(r.amount);
      }
    });
    setClientConcentration(
      Object.entries(clientRevMap)
        .map(([name, value]) => ({ name, value, percent: (value / totalRevenue) * 100 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // 5. Intelligence / Efficiency
    // Ratio of Completed vs Cancelled
    const completed = events.filter(e => e.status === 'concluido' || e.status === 'faturado').length;
    const cancelled = events.filter(e => e.status === 'cancelado').length;
    setOperationalEfficiency([
      { name: 'Sucesso', value: completed },
      { name: 'Cancelados', value: cancelled }
    ]);

    setIsLoading(false);
  };

  const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" /> BI Gerencial Inteligente
          </h1>
          <p className="text-muted-foreground">Insights estratégicos para tomada de decisão baseada em dados.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px] border-0 focus:ring-0 h-8 p-0"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 shadow-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={selectedQuarter !== 'todos' ? `q${selectedQuarter}` : selectedMonth !== 'todos' ? `m${selectedMonth}` : 'todos'} 
              onValueChange={v => {
                if (v === 'todos') {
                  setSelectedQuarter('todos');
                  setSelectedMonth('todos');
                } else if (v.startsWith('q')) {
                  setSelectedQuarter(v.substring(1));
                  setSelectedMonth('todos');
                } else if (v.startsWith('m')) {
                  setSelectedMonth(v.substring(1));
                  setSelectedQuarter('todos');
                }
              }}
            >
              <SelectTrigger className="w-[130px] border-0 focus:ring-0 h-8 p-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o Ano</SelectItem>
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase opacity-50 px-2 py-1">Trimestres</SelectLabel>
                  <SelectItem value="q1">1º Trimestre</SelectItem>
                  <SelectItem value="q2">2º Trimestre</SelectItem>
                  <SelectItem value="q3">3º Trimestre</SelectItem>
                  <SelectItem value="q4">4º Trimestre</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-[10px] font-bold uppercase opacity-50 px-2 py-1">Meses</SelectLabel>
                  {months.map(m => (
                    <SelectItem key={m.value} value={`m${m.value}`}>{m.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px] bg-background shadow-sm"><SelectValue placeholder="Filtrar por Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" className="shadow-sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KpiCard 
          title="Faturamento Bruto" 
          value={fmtCurrency(mainKpis.totalRevenue)} 
          subValue={`${mainKpis.growth >= 0 ? '+' : ''}${mainKpis.growth.toFixed(1)}% vs anterior`}
          icon={DollarSign} 
          color="bg-sky-500" 
          trend={mainKpis.growth >= 0 ? 'up' : 'down'}
        />
        <KpiCard title="Lucro Líquido" value={fmtCurrency(mainKpis.netProfit)} subValue="Resultado final" icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard title="Margem de Lucro" value={`${mainKpis.profitMargin.toFixed(1)}%`} subValue="Saúde financeira" icon={Percent} color="bg-indigo-500" />
        <KpiCard title="LTV (Ticket Médio)" value={fmtCurrency(mainKpis.ltv)} subValue="Valor por cliente" icon={Target} color="bg-purple-500" />
        <KpiCard title="Burn Rate Médio" value={fmtCurrency(mainKpis.burnRate)} subValue="Custo mensal" icon={Zap} color="bg-amber-500" />
        <KpiCard 
          title="Inadimplência" 
          value={fmtCurrency(mainKpis.overdueReceivables)} 
          subValue="A receber vencidos" 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          highlight={mainKpis.overdueReceivables > 0}
        />
      </div>

      <Tabs defaultValue="financeiro" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="financeiro" className="gap-2"><DollarSign className="w-4 h-4" /> Performance Financeira</TabsTrigger>
          <TabsTrigger value="estratégico" className="gap-2"><Briefcase className="w-4 h-4" /> Visão Estratégica</TabsTrigger>
          <TabsTrigger value="operacional" className="gap-2"><Zap className="w-4 h-4" /> Inteligência Operacional</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GrowthIcon className="w-5 h-5 text-sky-500" /> Fluxo de Resultados</CardTitle>
                <CardDescription>Acompanhamento mensal de entrada, saída e margem líquida.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1}/><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${v >= 1000 ? v/1000 + 'k' : v}`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => [fmtCurrency(v), '']} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Receita Bruta" dataKey="Receita" stroke="#0EA5E9" strokeWidth={3} fill="url(#colorRev)" />
                    <Area type="monotone" name="Lucro Líquido" dataKey="Lucro" stroke="#10B981" strokeWidth={3} fill="url(#colorProfit)" />
                    <Line type="monotone" name="Margem (%)" dataKey="Margem" stroke="#8B5CF6" strokeWidth={2} dot={false} yAxisId="right" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-indigo-500" /> Centro de Custos</CardTitle>
                <CardDescription>Distribuição detalhada das despesas.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costsByCategory} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                      {costsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estratégico" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Concentração de Clientes (Top 8)</CardTitle>
                <CardDescription>Identifique a dependência financeira por cliente (Lei de Pareto).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientConcentration.map((item, i) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{fmtCurrency(item.value)} ({item.percent.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${item.percent}%`, backgroundColor: COLORS[i % COLORS.length] }} 
                        />
                      </div>
                    </div>
                  ))}
                  {clientConcentration.length === 0 && <p className="text-center py-10 text-muted-foreground">Sem dados suficientes.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Saúde do Negócio</CardTitle>
                <CardDescription>Principais indicadores de sustentabilidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Margem Alvo</p>
                    <p className="text-2xl font-bold">25.0%</p>
                    <Badge variant={mainKpis.profitMargin >= 25 ? "default" : "destructive"} className="mt-2">
                      {mainKpis.profitMargin >= 25 ? "No Alvo" : "Abaixo da Meta"}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Eventos Totais</p>
                    <p className="text-2xl font-bold">{mainKpis.eventCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">Volume operacional no período</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2"><Target className="w-4 h-4" /> Insight do Consultor</h4>
                  <div className="text-sm p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
                    {mainKpis.profitMargin < 15 ? 
                      "Sua margem está baixa. Reavalie os custos de mão de obra e impostos para otimizar o lucro líquido." : 
                      "Excelente rentabilidade! Considere reinvestir parte do lucro em marketing para aumentar o CAC e escala."
                    }
                    {mainKpis.overdueReceivables > 0 && " Atenção especial à inadimplência: R$ " + Math.round(mainKpis.overdueReceivables) + " estão vencidos."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operacional" className="space-y-6">
           <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Funil de Eficiência de Eventos</CardTitle>
                <CardDescription>Relação entre eventos fechados e cancelamentos.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationalEfficiency} layout="vertical" margin={{ left: 50, right: 50 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                      {operationalEfficiency.map((entry, i) => (
                        <Cell key={i} fill={entry.name === 'Sucesso' ? '#10B981' : '#F43F5E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ title, value, subValue, icon: Icon, color, trend, highlight }: any) {
  return (
    <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow ${highlight ? 'border-rose-500 bg-rose-500/5' : ''}`}>
      <div className={`h-1 w-full ${color}`} />
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">{title}</span>
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <p className="text-xl font-extrabold tracking-tight">{value}</p>
        <div className="flex items-center gap-1 mt-2">
          {trend && (
            trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />
          )}
          <span className={`text-[10px] font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {subValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}