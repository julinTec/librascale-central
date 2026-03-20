import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, lastDayOfMonth } from 'date-fns';

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

type FilterMode = 'month' | 'year';

export default function Reports() {
  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i), []);

  const [eventReport, setEventReport] = useState<any[]>([]);
  const [interpreterReport, setInterpreterReport] = useState<any[]>([]);

  const { periodStart, periodEnd } = useMemo(() => {
    if (filterMode === 'year') return { periodStart: `${selectedYear}-01-01`, periodEnd: `${selectedYear}-12-31` };
    const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const e = format(lastDayOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    return { periodStart: s, periodEnd: e };
  }, [filterMode, selectedMonth, selectedYear]);

  useEffect(() => { loadReports(); }, [periodStart, periodEnd]);

  const loadReports = async () => {
    const [eventsRes, recRes, payRes, assignRes] = await Promise.all([
      supabase.from('events').select('id, event_name, contract_value, clients(name)').gte('start_date', periodStart).lte('start_date', periodEnd),
      supabase.from('event_receivables').select('event_id, amount, status'),
      supabase.from('event_payables').select('event_id, amount, status'),
      supabase.from('event_assignments').select('interpreter_id, fee_final, transport_final, interpreters(full_name)'),
    ]);

    const evts = eventsRes.data || [];
    const recs = recRes.data || [];
    const pays = payRes.data || [];

    const evReport = evts.map(ev => {
      const received = recs.filter(r => r.event_id === ev.id && r.status === 'recebido').reduce((s, r) => s + Number(r.amount), 0);
      const costs = pays.filter(p => p.event_id === ev.id).reduce((s, p) => s + Number(p.amount), 0);
      return { ...ev, clientName: (ev.clients as any)?.name, received, costs, margin: Number(ev.contract_value || 0) - costs };
    });
    setEventReport(evReport);

    const interpMap: Record<string, { name: string; total: number }> = {};
    (assignRes.data || []).forEach((a: any) => {
      const id = a.interpreter_id;
      if (!interpMap[id]) interpMap[id] = { name: (a.interpreters as any)?.full_name || '—', total: 0 };
      interpMap[id].total += Number(a.fee_final || 0) + Number(a.transport_final || 0);
    });
    setInterpreterReport(Object.values(interpMap).sort((a, b) => b.total - a.total));
  };

  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

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

      <Card>
        <CardHeader><CardTitle className="text-lg">Resultado por Evento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Evento</TableHead><TableHead>Cliente</TableHead><TableHead>Valor Contratado</TableHead>
              <TableHead>Recebido</TableHead><TableHead>Custos</TableHead><TableHead>Margem</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {eventReport.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_name}</TableCell>
                  <TableCell>{e.clientName}</TableCell>
                  <TableCell>{fmtMoney(Number(e.contract_value || 0))}</TableCell>
                  <TableCell className="text-success">{fmtMoney(e.received)}</TableCell>
                  <TableCell className="text-destructive">{fmtMoney(e.costs)}</TableCell>
                  <TableCell className={e.margin >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{fmtMoney(e.margin)}</TableCell>
                </TableRow>
              ))}
              {eventReport.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum evento no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pagamentos por Intérprete</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Intérprete</TableHead><TableHead>Total (Cachê + Transporte)</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {interpreterReport.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{fmtMoney(i.total)}</TableCell>
                </TableRow>
              ))}
              {interpreterReport.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum dado no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
