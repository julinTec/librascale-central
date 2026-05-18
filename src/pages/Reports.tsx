import { useEffect, useState, useMemo } from 'react';
import { useCachedState } from '@/lib/page-cache';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, lastDayOfMonth } from 'date-fns';
import { COST_TYPE_LABELS, REVENUE_TYPE_LABELS } from '@/lib/constants';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

type FilterMode = 'month' | 'year';

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function Reports() {
  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('year');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i), []);

  const [eventReport, setEventReport] = useCachedState<any[]>('reports:eventReport', []);
  const [interpreterReport, setInterpreterReport] = useCachedState<any[]>('reports:interpreterReport', []);
  const [monthlyProfit, setMonthlyProfit] = useCachedState<any[]>('reports:monthlyProfit', []);
  const [costsByType, setCostsByType] = useCachedState<any[]>('reports:costsByType', []);
  const [revenueByType, setRevenueByType] = useCachedState<any[]>('reports:revenueByType', []);

  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    if (filterMode === 'year') {
      return {
        periodStart: `${selectedYear}-01-01`,
        periodEnd: `${selectedYear}-12-31`,
        periodLabel: String(selectedYear),
      };
    }
    const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const e = format(lastDayOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    return {
      periodStart: s,
      periodEnd: e,
      periodLabel: `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`,
    };
  }, [filterMode, selectedMonth, selectedYear]);

  useEffect(() => { loadReports(); }, [periodStart, periodEnd]);

  const loadReports = async () => {
    const [eventsRes, recRes, payRes, assignRes, sessionsRes] = await Promise.all([
      supabase.from('events').select('id, event_name, start_date, contract_value, clients(name)').gte('start_date', periodStart).lte('start_date', periodEnd),
      supabase.from('event_receivables').select('event_id, amount, net_amount, tax_percentage, status, revenue_type, competence_date, due_date'),
      supabase.from('event_payables').select('event_id, amount, status, cost_type, competence_date, due_date'),
      supabase.from('event_assignments').select('interpreter_id, fee_final, fee_expected, transport_final, transport_expected, session_id, interpreters(full_name)'),
      supabase.from('event_sessions').select('id, session_date').gte('session_date', periodStart).lte('session_date', periodEnd),
    ]);

    const evts = eventsRes.data || [];
    const recs = recRes.data || [];
    const pays = payRes.data || [];
    const evtIds = new Set(evts.map(e => e.id));
    const eventStartMap: Record<string, string | null> = {};
    evts.forEach(e => { eventStartMap[e.id] = e.start_date; });

    const netExpected = (r: any) => {
      const n = Number(r.net_amount || 0);
      if (n > 0) return n;
      const tax = Number(r.tax_percentage || 0);
      return Number(r.amount || 0) * (1 - tax / 100);
    };

    // Lucro por Evento
    const evReport = evts.map(ev => {
      const evRecs = recs.filter(r => r.event_id === ev.id);
      const evPays = pays.filter(p => p.event_id === ev.id);
      const netExp = evRecs.reduce((s, r) => s + netExpected(r), 0);
      const received = evRecs.filter(r => r.status === 'recebido').reduce((s, r) => s + netExpected(r), 0);
      const costsExp = evPays.reduce((s, p) => s + Number(p.amount), 0);
      const costsPaid = evPays.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0);
      return {
        ...ev,
        clientName: (ev.clients as any)?.name || 'Sem cliente',
        netExp: round2(netExp),
        received: round2(received),
        costsExp: round2(costsExp),
        costsPaid: round2(costsPaid),
        profitExp: round2(netExp - costsExp),
      };
    });
    setEventReport(evReport);

    // Pagamentos por Profissional (filtrado por sessão no período)
    const sessionIdsInPeriod = new Set((sessionsRes.data || []).map((s: any) => s.id));
    const interpMap: Record<string, { name: string; total: number }> = {};
    (assignRes.data || []).filter((a: any) => sessionIdsInPeriod.has(a.session_id)).forEach((a: any) => {
      const id = a.interpreter_id;
      if (!interpMap[id]) interpMap[id] = { name: (a.interpreters as any)?.full_name || '—', total: 0 };
      const fee = Number(a.fee_final ?? a.fee_expected ?? 0);
      const transp = Number(a.transport_final ?? a.transport_expected ?? 0);
      interpMap[id].total += fee + transp;
    });
    setInterpreterReport(Object.values(interpMap).sort((a, b) => b.total - a.total));

    // Lucro por Mês (com fallback de data)
    const monthMap: Record<string, { revExp: number; received: number; costsExp: number; costsPaid: number }> = {};
    const ensure = (m: string) => {
      if (!monthMap[m]) monthMap[m] = { revExp: 0, received: 0, costsExp: 0, costsPaid: 0 };
      return monthMap[m];
    };
    recs.forEach(r => {
      const date = r.competence_date || r.due_date || eventStartMap[r.event_id];
      if (!date) return;
      const m = date.substring(0, 7);
      if (m < periodStart.substring(0, 7) || m > periodEnd.substring(0, 7)) return;
      const bucket = ensure(m);
      const ne = netExpected(r);
      bucket.revExp += ne;
      if (r.status === 'recebido') bucket.received += ne;
    });
    pays.forEach(p => {
      const date = p.competence_date || p.due_date || eventStartMap[p.event_id];
      if (!date) return;
      const m = date.substring(0, 7);
      if (m < periodStart.substring(0, 7) || m > periodEnd.substring(0, 7)) return;
      const bucket = ensure(m);
      const amt = Number(p.amount);
      bucket.costsExp += amt;
      if (p.status === 'pago') bucket.costsPaid += amt;
    });
    setMonthlyProfit(
      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({
          month: (MONTHS[parseInt(month.split('-')[1]) - 1]?.label || month) + '/' + month.split('-')[0],
          revExp: round2(d.revExp),
          received: round2(d.received),
          costsExp: round2(d.costsExp),
          costsPaid: round2(d.costsPaid),
          profitExp: round2(d.revExp - d.costsExp),
          profitReal: round2(d.received - d.costsPaid),
        }))
    );

    // Custos por Tipo (eventos do período)
    const costMap: Record<string, number> = {};
    pays.filter(p => evtIds.has(p.event_id)).forEach(p => {
      costMap[p.cost_type] = (costMap[p.cost_type] || 0) + Number(p.amount);
    });
    setCostsByType(Object.entries(costMap).map(([type, value]) => ({ type, label: COST_TYPE_LABELS[type] || type, value: round2(value) })).sort((a, b) => b.value - a.value));

    // Receitas por Tipo (líquidas)
    const revMap: Record<string, number> = {};
    recs.filter(r => evtIds.has(r.event_id)).forEach(r => {
      revMap[r.revenue_type] = (revMap[r.revenue_type] || 0) + netExpected(r);
    });
    setRevenueByType(Object.entries(revMap).map(([type, value]) => ({ type, label: REVENUE_TYPE_LABELS[type] || type, value: round2(value) })).sort((a, b) => b.value - a.value));
  };

  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatórios - ${periodLabel}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${periodStart} a ${periodEnd}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Evento', 'Cliente', 'Contratado', 'Rec. Líq. Prev.', 'Recebido', 'Custos Prev.', 'Custos Pagos', 'Lucro Prev.']],
      body: eventReport.map(e => [e.event_name, e.clientName, fmtMoney(Number(e.contract_value || 0)), fmtMoney(e.netExp), fmtMoney(e.received), fmtMoney(e.costsExp), fmtMoney(e.costsPaid), fmtMoney(e.profitExp)]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185] },
      didDrawPage: (data) => { doc.setFontSize(11); doc.text('Lucro por Evento', 14, data.settings.startY! - 4); },
    });

    autoTable(doc, {
      head: [['Mês', 'Receita Prev.', 'Recebido', 'Custos Prev.', 'Pagos', 'Lucro Prev.', 'Lucro Real']],
      body: monthlyProfit.map(m => [m.month, fmtMoney(m.revExp), fmtMoney(m.received), fmtMoney(m.costsExp), fmtMoney(m.costsPaid), fmtMoney(m.profitExp), fmtMoney(m.profitReal)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      didDrawPage: (data) => { doc.setFontSize(11); doc.text('Lucro por Mês', 14, data.settings.startY! - 4); },
    });

    autoTable(doc, {
      head: [['Tipo de Custo', 'Total']],
      body: costsByType.map(c => [c.label, fmtMoney(c.value)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [192, 57, 43] },
      didDrawPage: (data) => { doc.setFontSize(11); doc.text('Custos por Tipo', 14, data.settings.startY! - 4); },
    });

    autoTable(doc, {
      head: [['Tipo de Receita', 'Total Líquido']],
      body: revenueByType.map(r => [r.label, fmtMoney(r.value)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [39, 174, 96] },
      didDrawPage: (data) => { doc.setFontSize(11); doc.text('Receitas por Tipo', 14, data.settings.startY! - 4); },
    });

    autoTable(doc, {
      head: [['Profissional', 'Total (Cachê + Transporte)']],
      body: interpreterReport.map(i => [i.name, fmtMoney(i.total)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [142, 68, 173] },
      didDrawPage: (data) => { doc.setFontSize(11); doc.text('Pagamentos por Profissional', 14, data.settings.startY! - 4); },
    });

    doc.save(`relatorios_${periodLabel.replace('/', '-')}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const totRevExp = monthlyProfit.reduce((s, m) => s + m.revExp, 0);
    const totReceived = monthlyProfit.reduce((s, m) => s + m.received, 0);
    const totCostsExp = monthlyProfit.reduce((s, m) => s + m.costsExp, 0);
    const totCostsPaid = monthlyProfit.reduce((s, m) => s + m.costsPaid, 0);

    const resumo = [
      ['Período', periodLabel],
      ['Início', periodStart],
      ['Fim', periodEnd],
      [],
      ['Receita Líquida Prevista', totRevExp],
      ['Recebido', totReceived],
      ['Custos Previstos', totCostsExp],
      ['Custos Pagos', totCostsPaid],
      ['Lucro Previsto', totRevExp - totCostsExp],
      ['Lucro Realizado', totReceived - totCostsPaid],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventReport.map(e => ({
      Evento: e.event_name, Cliente: e.clientName, 'Valor Contratado': Number(e.contract_value || 0),
      'Receita Líquida Prevista': e.netExp, Recebido: e.received,
      'Custos Previstos': e.costsExp, 'Custos Pagos': e.costsPaid, 'Lucro Previsto': e.profitExp,
    }))), 'Lucro por Evento');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlyProfit.map(m => ({
      Mês: m.month, 'Receita Prevista': m.revExp, Recebido: m.received,
      'Custos Previstos': m.costsExp, 'Custos Pagos': m.costsPaid,
      'Lucro Previsto': m.profitExp, 'Lucro Realizado': m.profitReal,
    }))), 'Lucro por Mês');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costsByType.map(c => ({ Tipo: c.label, Total: c.value }))), 'Custos por Tipo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueByType.map(r => ({ Tipo: r.label, 'Total Líquido': r.value }))), 'Receitas por Tipo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(interpreterReport.map(i => ({ Profissional: i.name, Total: i.total }))), 'Pagamentos Profissionais');

    XLSX.writeFile(wb, `relatorios_${periodLabel.replace('/', '-')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportPDF}><FileDown className="h-4 w-4 mr-1" />Exportar PDF</Button>
          <Button size="sm" variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-1" />Exportar Excel</Button>
        </div>
      </div>

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

      {/* Lucro por Evento */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Lucro por Evento</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Evento</TableHead><TableHead>Cliente</TableHead><TableHead>Contratado</TableHead>
              <TableHead>Rec. Líq. Prev.</TableHead><TableHead>Recebido</TableHead>
              <TableHead>Custos Prev.</TableHead><TableHead>Custos Pagos</TableHead><TableHead>Lucro Prev.</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {eventReport.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_name}</TableCell>
                  <TableCell>{e.clientName}</TableCell>
                  <TableCell>{fmtMoney(Number(e.contract_value || 0))}</TableCell>
                  <TableCell className="text-success">{fmtMoney(e.netExp)}</TableCell>
                  <TableCell className="text-success font-medium">{fmtMoney(e.received)}</TableCell>
                  <TableCell className="text-destructive">{fmtMoney(e.costsExp)}</TableCell>
                  <TableCell className="text-destructive font-medium">{fmtMoney(e.costsPaid)}</TableCell>
                  <TableCell className={e.profitExp >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{fmtMoney(e.profitExp)}</TableCell>
                </TableRow>
              ))}
              {eventReport.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum evento no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lucro por Mês */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Lucro por Mês</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mês</TableHead><TableHead>Receita Prev.</TableHead><TableHead>Recebido</TableHead>
              <TableHead>Custos Prev.</TableHead><TableHead>Pagos</TableHead>
              <TableHead>Lucro Prev.</TableHead><TableHead>Lucro Real</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {monthlyProfit.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-success">{fmtMoney(m.revExp)}</TableCell>
                  <TableCell className="text-success font-medium">{fmtMoney(m.received)}</TableCell>
                  <TableCell className="text-destructive">{fmtMoney(m.costsExp)}</TableCell>
                  <TableCell className="text-destructive font-medium">{fmtMoney(m.costsPaid)}</TableCell>
                  <TableCell className={m.profitExp >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{fmtMoney(m.profitExp)}</TableCell>
                  <TableCell className={m.profitReal >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{fmtMoney(m.profitReal)}</TableCell>
                </TableRow>
              ))}
              {monthlyProfit.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum dado financeiro no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Custos por Tipo</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {costsByType.map((c, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{c.label}</TableCell><TableCell>{fmtMoney(c.value)}</TableCell></TableRow>
                ))}
                {costsByType.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum custo no período.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Receitas por Tipo de Serviço</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Total Líquido</TableHead></TableRow></TableHeader>
              <TableBody>
                {revenueByType.map((r, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{r.label}</TableCell><TableCell>{fmtMoney(r.value)}</TableCell></TableRow>
                ))}
                {revenueByType.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhuma receita no período.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pagamentos por Profissional</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Profissional</TableHead><TableHead>Total (Cachê + Transporte)</TableHead></TableRow></TableHeader>
            <TableBody>
              {interpreterReport.map((i, idx) => (
                <TableRow key={idx}><TableCell className="font-medium">{i.name}</TableCell><TableCell>{fmtMoney(i.total)}</TableCell></TableRow>
              ))}
              {interpreterReport.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum dado no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
