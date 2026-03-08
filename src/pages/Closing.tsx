import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Closing() {
  const [clients, setClients] = useState<any[]>([]);
  const [filterClient, setFilterClient] = useState('all');
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { loadData(); }, [filterClient, periodStart, periodEnd]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, monthly_hours_package, additional_hour_rate').eq('is_active', true);
    if (data) setClients(data);
  };

  const loadData = async () => {
    let query = supabase.from('schedules')
      .select('*, clients(name, monthly_hours_package, additional_hour_rate), execution_logs(*)')
      .gte('activity_date', periodStart).lte('activity_date', periodEnd);
    if (filterClient !== 'all') query = query.eq('client_id', filterClient);

    const { data: schedules } = await query;
    if (!schedules) return;

    // Group by client
    const clientMap: Record<string, any> = {};
    for (const s of schedules) {
      const cid = s.client_id;
      if (!clientMap[cid]) {
        clientMap[cid] = {
          client_name: s.clients?.name || 'N/A',
          package_hours: s.clients?.monthly_hours_package || 0,
          add_rate: s.clients?.additional_hour_rate || 0,
          planned: 0, realized: 0, billable: 0,
        };
      }
      clientMap[cid].planned += (s.planned_duration_minutes || 0) / 60;
      const exec = s.execution_logs;
      if (exec) {
        clientMap[cid].realized += exec.worked_hours || 0;
        clientMap[cid].billable += exec.billable_hours || 0;
      }
    }

    const rows = Object.values(clientMap).map((c: any) => ({
      ...c,
      planned: Math.round(c.planned * 10) / 10,
      realized: Math.round(c.realized * 10) / 10,
      billable: Math.round(c.billable * 10) / 10,
      unused: Math.max(0, Math.round((c.package_hours - c.billable) * 10) / 10),
      additional: Math.max(0, Math.round((c.billable - c.package_hours) * 10) / 10),
      total: Math.round(Math.max(0, c.billable - c.package_hours) * c.add_rate * 100) / 100,
    }));

    setData(rows);
  };

  const totals = data.reduce((acc, r) => ({
    planned: acc.planned + r.planned,
    realized: acc.realized + r.realized,
    billable: acc.billable + r.billable,
    unused: acc.unused + r.unused,
    additional: acc.additional + r.additional,
    total: acc.total + r.total,
  }), { planned: 0, realized: 0, billable: 0, unused: 0, additional: 0, total: 0 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fechamento de Horas</h1>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Período Início</Label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Período Fim</Label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cliente</Label>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Planejadas', value: `${totals.planned.toFixed(1)}h` },
          { label: 'Realizadas', value: `${totals.realized.toFixed(1)}h` },
          { label: 'Faturáveis', value: `${totals.billable.toFixed(1)}h` },
          { label: 'Não Consumidas', value: `${totals.unused.toFixed(1)}h` },
          { label: 'Adicionais', value: `${totals.additional.toFixed(1)}h` },
          { label: 'Valor Adicional', value: `R$ ${totals.total.toFixed(2)}` },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Detalhamento por Cliente</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Pacote (h)</TableHead>
                <TableHead>Planejadas</TableHead>
                <TableHead>Realizadas</TableHead>
                <TableHead>Faturáveis</TableHead>
                <TableHead>Não Consumidas</TableHead>
                <TableHead>Adicionais</TableHead>
                <TableHead>Valor Adic. (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.client_name}</TableCell>
                  <TableCell>{r.package_hours}h</TableCell>
                  <TableCell>{r.planned}h</TableCell>
                  <TableCell>{r.realized}h</TableCell>
                  <TableCell>{r.billable}h</TableCell>
                  <TableCell>{r.unused}h</TableCell>
                  <TableCell>{r.additional}h</TableCell>
                  <TableCell>R$ {r.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum dado no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
