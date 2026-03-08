import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle, Search } from 'lucide-react';
import { EXECUTION_STATUS_LABELS, SCHEDULE_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Execution() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  type ExecStatus = 'realizada_normalmente' | 'atraso_cliente' | 'atraso_interno' | 'cancelada_cliente' | 'cancelada_internamente' | 'parcialmente_realizada' | 'regravada' | 'nao_realizada';
  const [form, setForm] = useState({
    actual_start: '', actual_end: '', worked_hours: 0, billable_hours: 0,
    execution_status: 'realizada_normalmente' as ExecStatus, notes: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('schedules')
      .select('*, clients(name), interpreters(full_name), execution_logs(*)')
      .in('status', ['confirmada', 'em_execucao', 'concluida'])
      .order('activity_date', { ascending: false });
    if (data) setSchedules(data);
  };

  const openExec = (s: any) => {
    setSelected(s);
    const exec = s.execution_logs?.[0];
    if (exec) {
      setForm({
        actual_start: exec.actual_start || '', actual_end: exec.actual_end || '',
        worked_hours: exec.worked_hours || 0, billable_hours: exec.billable_hours || 0,
        execution_status: exec.execution_status, notes: exec.notes || '',
      });
    } else {
      setForm({
        actual_start: s.planned_start || '', actual_end: s.planned_end || '',
        worked_hours: 0, billable_hours: 0, execution_status: 'realizada_normalmente', notes: '',
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const existing = selected.execution_logs?.[0];
      const duration = calcDuration(form.actual_start, form.actual_end);
      const payload = { ...form, schedule_id: selected.id, actual_duration_minutes: duration, created_by: user?.id };

      if (existing) {
        const { error } = await supabase.from('execution_logs').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('execution_logs').insert(payload);
        if (error) throw error;
      }

      // Update schedule status
      await supabase.from('schedules').update({ status: 'concluida' }).eq('id', selected.id);

      toast({ title: 'Execução registrada!' });
      setOpen(false); load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const calcDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const calcHours = (start: string, end: string): number => {
    const mins = calcDuration(start, end);
    if (mins <= 0) return 0;
    return Math.round((mins / 60) * 100) / 100;
  };

  const updateTimes = (newStart: string, newEnd: string, currentForm: typeof form) => {
    const hours = calcHours(newStart, newEnd);
    return { ...currentForm, actual_start: newStart, actual_end: newEnd, worked_hours: hours, billable_hours: hours };
  };

  const filtered = schedules.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    s.clients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Execução Real</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Previsto</TableHead>
                <TableHead>Real</TableHead>
                <TableHead>Status Execução</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => {
                const exec = s.execution_logs?.[0];
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.activity_date ? format(new Date(s.activity_date + 'T12:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium text-sm">{s.title || '-'}</TableCell>
                    <TableCell className="text-sm">{s.clients?.name}</TableCell>
                    <TableCell className="text-sm">{s.planned_start?.slice(0, 5)} - {s.planned_end?.slice(0, 5)}</TableCell>
                    <TableCell className="text-sm">
                      {exec ? `${exec.actual_start?.slice(0, 5)} - ${exec.actual_end?.slice(0, 5)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {exec ? (
                        <Badge variant="secondary">{EXECUTION_STATUS_LABELS[exec.execution_status]}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openExec(s)}>
                        <PlayCircle className="w-4 h-4 mr-1" />Registrar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma atividade encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Execução</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Hora Real Início</Label><Input type="time" value={form.actual_start} onChange={(e) => setForm({ ...form, actual_start: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora Real Fim</Label><Input type="time" value={form.actual_end} onChange={(e) => setForm({ ...form, actual_end: e.target.value })} /></div>
              <div className="space-y-2"><Label>Horas Trabalhadas</Label><Input type="number" step="0.5" value={form.worked_hours} onChange={(e) => setForm({ ...form, worked_hours: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Horas Faturáveis</Label><Input type="number" step="0.5" value={form.billable_hours} onChange={(e) => setForm({ ...form, billable_hours: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Situação Final</Label>
              <Select value={form.execution_status} onValueChange={(v) => setForm({ ...form, execution_status: v as ExecStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EXECUTION_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
