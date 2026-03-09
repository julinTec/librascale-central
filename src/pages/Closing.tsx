import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileDown, ChevronDown, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScheduleDetail {
  title: string;
  activity_date: string;
  planned_hours: number;
  worked_hours: number;
  billable_hours: number;
  status: string;
}

interface ClientRow {
  client_id: string;
  client_name: string;
  package_hours: number;
  add_rate: number;
  hour_rate: number;
  planned: number;
  realized: number;
  billable: number;
  unused: number;
  additional: number;
  total_additional: number;
  total_value: number;
  details: ScheduleDetail[];
}

export default function Closing() {
  const [clients, setClients] = useState<any[]>([]);
  const [filterClient, setFilterClient] = useState('all');
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [data, setData] = useState<ClientRow[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { loadData(); }, [filterClient, periodStart, periodEnd]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, monthly_hours_package, additional_hour_rate').eq('is_active', true);
    if (data) setClients(data);
  };

  const toggleClient = (clientName: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientName)) next.delete(clientName);
      else next.add(clientName);
      return next;
    });
  };

  const statusLabels: Record<string, string> = {
    realizada_normalmente: 'Realizada',
    atraso_cliente: 'Atraso Cliente',
    atraso_interno: 'Atraso Interno',
    cancelada_cliente: 'Cancelada (Cliente)',
    cancelada_internamente: 'Cancelada (Interno)',
    parcialmente_realizada: 'Parcial',
    regravada: 'Regravada',
    nao_realizada: 'Não Realizada',
    planejada: 'Planejada',
    confirmada: 'Confirmada',
    em_execucao: 'Em Execução',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    reprogramada: 'Reprogramada',
  };

  const loadData = async () => {
    let query = supabase.from('schedules')
      .select('*, clients(name, monthly_hours_package, additional_hour_rate), execution_logs(*)')
      .gte('activity_date', periodStart).lte('activity_date', periodEnd);
    if (filterClient !== 'all') query = query.eq('client_id', filterClient);

    let chQuery = supabase.from('contract_hours')
      .select('client_id, hour_rate')
      .lte('period_start', periodEnd)
      .gte('period_end', periodStart);
    if (filterClient !== 'all') chQuery = chQuery.eq('client_id', filterClient);

    const [{ data: schedules }, { data: contracts }] = await Promise.all([query, chQuery]);
    if (!schedules) return;

    const rateMap: Record<string, number> = {};
    if (contracts) {
      for (const c of contracts) {
        rateMap[c.client_id] = c.hour_rate;
      }
    }

    const clientMap: Record<string, ClientRow> = {};
    for (const s of schedules) {
      const cid = s.client_id;
      if (!clientMap[cid]) {
        clientMap[cid] = {
          client_id: cid,
          client_name: s.clients?.name || 'N/A',
          package_hours: s.clients?.monthly_hours_package || 0,
          add_rate: s.clients?.additional_hour_rate || 0,
          hour_rate: rateMap[cid] ?? s.clients?.additional_hour_rate ?? 0,
          planned: 0, realized: 0, billable: 0,
          unused: 0, additional: 0, total_additional: 0, total_value: 0,
          details: [],
        };
      }

      const plannedH = (s.planned_duration_minutes || 0) / 60;
      clientMap[cid].planned += plannedH;

      const exec = s.execution_logs;
      const workedH = exec?.worked_hours || 0;
      const billableH = exec?.billable_hours || 0;
      clientMap[cid].realized += workedH;
      clientMap[cid].billable += billableH;

      clientMap[cid].details.push({
        title: s.title || s.internal_code || 'Sem título',
        activity_date: s.activity_date,
        planned_hours: Math.round(plannedH * 10) / 10,
        worked_hours: Math.round(workedH * 10) / 10,
        billable_hours: Math.round(billableH * 10) / 10,
        status: exec ? (statusLabels[exec.execution_status] || exec.execution_status) : (statusLabels[s.status] || s.status),
      });
    }

    const rows = Object.values(clientMap).map((c) => ({
      ...c,
      planned: Math.round(c.planned * 10) / 10,
      realized: Math.round(c.realized * 10) / 10,
      billable: Math.round(c.billable * 10) / 10,
      unused: Math.max(0, Math.round((c.package_hours - c.billable) * 10) / 10),
      additional: Math.max(0, Math.round((c.billable - c.package_hours) * 10) / 10),
      total_additional: Math.round(Math.max(0, c.billable - c.package_hours) * c.add_rate * 100) / 100,
      total_value: Math.round(c.billable * c.hour_rate * 100) / 100,
      details: c.details.sort((a, b) => a.activity_date.localeCompare(b.activity_date)),
    }));

    setData(rows);
  };

  const totals = data.reduce((acc, r) => ({
    planned: acc.planned + (r.planned || 0),
    realized: acc.realized + (r.realized || 0),
    billable: acc.billable + (r.billable || 0),
    unused: acc.unused + (r.unused || 0),
    additional: acc.additional + (r.additional || 0),
    total_additional: acc.total_additional + (r.total_additional || 0),
    total_value: acc.total_value + (r.total_value || 0),
  }), { planned: 0, realized: 0, billable: 0, unused: 0, additional: 0, total_additional: 0, total_value: 0 });

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const periodLabel = `${format(new Date(periodStart + 'T12:00:00'), 'dd/MM/yyyy')} a ${format(new Date(periodEnd + 'T12:00:00'), 'dd/MM/yyyy')}`;

    // Title
    doc.setFontSize(18);
    doc.text('Fechamento de Horas', 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${periodLabel}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 34);

    // Summary KPIs
    doc.setFontSize(10);
    doc.setFont(undefined as any, 'bold');
    doc.text('Resumo Geral', 14, 44);
    doc.setFont(undefined as any, 'normal');

    autoTable(doc, {
      startY: 48,
      head: [['Planejadas', 'Realizadas', 'Faturáveis', 'Não Consumidas', 'Adicionais', 'Valor Adicional', 'Valor Total']],
      body: [[
        `${totals.planned.toFixed(1)}h`,
        `${totals.realized.toFixed(1)}h`,
        `${totals.billable.toFixed(1)}h`,
        `${totals.unused.toFixed(1)}h`,
        `${totals.additional.toFixed(1)}h`,
        `R$ ${totals.total_additional.toFixed(2)}`,
        `R$ ${totals.total_value.toFixed(2)}`,
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
      bodyStyles: { fontSize: 9, fontStyle: 'bold' },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Per client
    for (const row of data) {
      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined as any, 'bold');
      doc.text(row.client_name, 14, currentY);
      doc.setFont(undefined as any, 'normal');
      doc.setFontSize(9);
      doc.text(
        `Pacote: ${row.package_hours}h | Planejadas: ${row.planned}h | Realizadas: ${row.realized}h | Faturáveis: ${row.billable}h | Adicionais: ${row.additional}h | Valor: R$ ${row.total_value.toFixed(2)}`,
        14, currentY + 5
      );

      currentY += 10;

      if (row.details.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Título', 'Planejadas (h)', 'Realizadas (h)', 'Faturáveis (h)', 'Status']],
          body: row.details.map(d => [
            format(new Date(d.activity_date + 'T12:00:00'), 'dd/MM/yyyy'),
            d.title,
            d.planned_hours.toFixed(1),
            d.worked_hours.toFixed(1),
            d.billable_hours.toFixed(1),
            d.status,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [100, 116, 139], fontSize: 7 },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 30 },
          },
          margin: { left: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    doc.save(`fechamento_${periodStart}_${periodEnd}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fechamento de Horas</h1>
        <Button onClick={generatePDF} disabled={data.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Planejadas', value: `${totals.planned.toFixed(1)}h` },
          { label: 'Realizadas', value: `${totals.realized.toFixed(1)}h` },
          { label: 'Faturáveis', value: `${totals.billable.toFixed(1)}h` },
          { label: 'Não Consumidas', value: `${totals.unused.toFixed(1)}h` },
          { label: 'Adicionais', value: `${totals.additional.toFixed(1)}h` },
          { label: 'Valor Adicional', value: `R$ ${totals.total_additional.toFixed(2)}` },
          { label: 'Valor Total', value: `R$ ${totals.total_value.toFixed(2)}` },
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
                <TableHead className="w-8"></TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pacote (h)</TableHead>
                <TableHead>Planejadas</TableHead>
                <TableHead>Realizadas</TableHead>
                <TableHead>Faturáveis</TableHead>
                <TableHead>Não Consumidas</TableHead>
                <TableHead>Adicionais</TableHead>
                <TableHead>Valor Adic. (R$)</TableHead>
                <TableHead>Valor Total (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r, i) => (
                <>
                  <TableRow key={`client-${i}`} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleClient(r.client_name)}>
                    <TableCell className="px-2">
                      {expandedClients.has(r.client_name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-medium">{r.client_name}</TableCell>
                    <TableCell>{r.package_hours}h</TableCell>
                    <TableCell>{r.planned}h</TableCell>
                    <TableCell>{r.realized}h</TableCell>
                    <TableCell>{r.billable}h</TableCell>
                    <TableCell>{r.unused}h</TableCell>
                    <TableCell>{r.additional}h</TableCell>
                    <TableCell>R$ {r.total_additional.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">R$ {r.total_value.toFixed(2)}</TableCell>
                  </TableRow>
                  {expandedClients.has(r.client_name) && r.details.map((d, j) => (
                    <TableRow key={`detail-${i}-${j}`} className="bg-muted/30">
                      <TableCell></TableCell>
                      <TableCell className="pl-8 text-sm text-muted-foreground">{d.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(d.activity_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">{d.planned_hours}h</TableCell>
                      <TableCell className="text-sm">{d.worked_hours}h</TableCell>
                      <TableCell className="text-sm">{d.billable_hours}h</TableCell>
                      <TableCell colSpan={2} className="text-sm text-muted-foreground">{d.status}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              {data.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhum dado no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
