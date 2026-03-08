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
import { Plus, Search, Pencil, CalendarDays, List } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS, MODALITY_LABELS, ACTIVITY_TYPE_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Schedule = any;

const emptyForm = {
  client_id: '', interpreter_id: '', activity_date: '', planned_start: '', planned_end: '',
  activity_type: 'gravacao_estudio' as const, modality: 'estudio' as const, location: '',
  title: '', internal_code: '', notes: '', status: 'planejada' as const,
};

export default function Schedules() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [changeReason, setChangeReason] = useState('');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    load();
    loadRefs();
  }, []);

  const load = async () => {
    const { data } = await supabase.from('schedules')
      .select('*, clients(name), interpreters(full_name)')
      .order('activity_date', { ascending: false }).order('planned_start');
    if (data) setItems(data);
  };

  const loadRefs = async () => {
    const [c, i] = await Promise.all([
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
      supabase.from('interpreters').select('id, full_name').eq('is_active', true).order('full_name'),
    ]);
    if (c.data) setClients(c.data);
    if (i.data) setInterpreters(i.data);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        // Create audit logs for changed fields
        const auditLogs: any[] = [];
        const fields = Object.keys(emptyForm) as (keyof typeof emptyForm)[];
        for (const field of fields) {
          const oldVal = String(editing[field] || '');
          const newVal = String(form[field] || '');
          if (oldVal !== newVal) {
            auditLogs.push({
              schedule_id: editing.id,
              changed_by: user?.id,
              field_name: field,
              old_value: oldVal,
              new_value: newVal,
              change_reason: changeReason,
            });
          }
        }
        const { error } = await supabase.from('schedules').update({ ...form, updated_by: user?.id }).eq('id', editing.id);
        if (error) throw error;
        if (auditLogs.length > 0) {
          await supabase.from('schedule_audit_logs').insert(auditLogs);
        }
        toast({ title: 'Agenda atualizada!' });
      } else {
        const { error } = await supabase.from('schedules').insert({ ...form, created_by: user?.id });
        if (error) throw error;
        toast({ title: 'Agenda criada!' });
      }
      setOpen(false); setEditing(null); setForm(emptyForm); setChangeReason(''); load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      client_id: s.client_id, interpreter_id: s.interpreter_id,
      activity_date: s.activity_date, planned_start: s.planned_start,
      planned_end: s.planned_end, activity_type: s.activity_type,
      modality: s.modality, location: s.location || '',
      title: s.title || '', internal_code: s.internal_code || '',
      notes: s.notes || '', status: s.status,
    });
    setOpen(true);
  };

  const filtered = items.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterClient !== 'all' && s.client_id !== filterClient) return false;
    if (search && !(s.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const calendarDates = items.map(s => new Date(s.activity_date + 'T12:00:00'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <List className="w-4 h-4 mr-1" />Lista
          </Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')}>
            <CalendarDays className="w-4 h-4 mr-1" />Calendário
          </Button>
          <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nova Agenda
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(SCHEDULE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {view === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Intérprete</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.activity_date ? format(new Date(s.activity_date + 'T12:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="text-sm">{s.planned_start?.slice(0, 5)} - {s.planned_end?.slice(0, 5)}</TableCell>
                    <TableCell className="font-medium text-sm">{s.title || '-'}</TableCell>
                    <TableCell className="text-sm">{s.clients?.name}</TableCell>
                    <TableCell className="text-sm">{s.interpreters?.full_name}</TableCell>
                    <TableCell className="text-sm">{MODALITY_LABELS[s.modality] || s.modality}</TableCell>
                    <TableCell><Badge className={SCHEDULE_STATUS_COLORS[s.status]}>{SCHEDULE_STATUS_LABELS[s.status]}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma agenda encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single" selected={calendarDate} onSelect={setCalendarDate} locale={ptBR}
              modifiers={{ hasEvent: calendarDates }}
              modifiersStyles={{ hasEvent: { fontWeight: 'bold', backgroundColor: 'hsl(152,45%,28%)', color: 'white', borderRadius: '50%' } }}
            />
            {calendarDate && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold text-sm">
                  Atividades em {format(calendarDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                {items.filter(s => s.activity_date === format(calendarDate, 'yyyy-MM-dd')).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">{s.title || 'Sem título'}</span>
                      <span className="text-muted-foreground ml-2">{s.planned_start?.slice(0, 5)} - {s.planned_end?.slice(0, 5)}</span>
                    </div>
                    <Badge className={SCHEDULE_STATUS_COLORS[s.status]}>{SCHEDULE_STATUS_LABELS[s.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intérprete *</Label>
              <Select value={form.interpreter_id || '_none'} onValueChange={(v) => setForm({ ...form, interpreter_id: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {interpreters.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Hora Início *</Label><Input type="time" value={form.planned_start} onChange={(e) => setForm({ ...form, planned_start: e.target.value })} /></div>
            <div className="space-y-2"><Label>Hora Fim *</Label><Input type="time" value={form.planned_end} onChange={(e) => setForm({ ...form, planned_end: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <Select value={form.activity_type} onValueChange={(v: any) => setForm({ ...form, activity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select value={form.modality} onValueChange={(v: any) => setForm({ ...form, modality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MODALITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SCHEDULE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Local / Estúdio</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Código Interno</Label><Input value={form.internal_code} onChange={(e) => setForm({ ...form, internal_code: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {editing && (
              <div className="col-span-2 space-y-2">
                <Label>Motivo da Alteração *</Label>
                <Textarea value={changeReason} onChange={(e) => setChangeReason(e.target.value)} placeholder="Descreva o motivo da alteração (obrigatório para auditoria)" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={editing ? !changeReason : false}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
