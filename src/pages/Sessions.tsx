import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ScheduleStatusV2 = Database['public']['Enums']['schedule_status_v2'];
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Search, ChevronDown, ChevronRight, UserPlus, AlertTriangle, Trash2 } from 'lucide-react';
import { SCHEDULE_STATUS_V2_LABELS, SCHEDULE_STATUS_V2_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_MODE_LABELS, EVENT_MODALITY_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

const emptySession = { event_id: '', title: '', session_date: '', start_time: '', end_time: '', duration_minutes: 0, location: '', modality: 'presencial' as string, notes: '', status: 'agendada' as string };
const emptyAssignment = { interpreter_id: '', service_role: '', payment_mode: 'por_sessao' as string, quantity: 1, unit_value: 0, total_value: 0, fee_expected: 0, fee_final: 0, transport_expected: 0, transport_final: 0, notes: '' };

export default function Agenda() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptySession);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<Record<string, any[]>>({});
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSessionId, setAssignSessionId] = useState('');
  const [assignForm, setAssignForm] = useState(emptyAssignment);
  const [editingAssign, setEditingAssign] = useState<any>(null);

  const [allAssignmentsMap, setAllAssignmentsMap] = useState<Record<string, { interpreter_id: string; full_name: string }[]>>({});

  useEffect(() => { load(); loadEvents(); loadInterpreters(); loadAllAssignments(); }, []);

  const load = async () => {
    const { data } = await supabase.from('event_sessions').select('*, events(event_name, clients(name))').order('session_date', { ascending: false });
    setSessions(data || []);
  };

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('id, event_name').order('event_name');
    setEvents(data || []);
  };

  const loadInterpreters = async () => {
    const { data } = await supabase.from('interpreters').select('id, full_name').eq('is_active', true).order('full_name');
    setInterpreters(data || []);
  };

  const loadAssignments = async (sessionId: string) => {
    const { data } = await supabase.from('event_assignments').select('*, interpreters(full_name)').eq('session_id', sessionId);
    setAssignments(prev => ({ ...prev, [sessionId]: data || [] }));
  };

  const loadAllAssignments = async () => {
    const { data } = await supabase.from('event_assignments').select('session_id, interpreter_id, interpreters(full_name)');
    const map: Record<string, { interpreter_id: string; full_name: string }[]> = {};
    (data || []).forEach((a: any) => {
      if (!map[a.session_id]) map[a.session_id] = [];
      map[a.session_id].push({ interpreter_id: a.interpreter_id, full_name: a.interpreters?.full_name || '' });
    });
    setAllAssignmentsMap(map);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) { next.delete(id); } else { next.add(id); loadAssignments(id); }
    setExpanded(next);
  };

  // Conflict = same professional allocated to overlapping sessions on same date
  const getConflictNames = (s: any): string[] => {
    if (s.status === 'cancelada') return [];
    const myAssigns = allAssignmentsMap[s.id] || [];
    if (myAssigns.length === 0) return [];
    const conflicts = new Set<string>();
    sessions.forEach(other => {
      if (other.id === s.id || other.status === 'cancelada') return;
      if (other.session_date !== s.session_date) return;
      if (!(other.start_time < s.end_time && other.end_time > s.start_time)) return;
      const otherAssigns = allAssignmentsMap[other.id] || [];
      myAssigns.forEach(m => {
        if (otherAssigns.some(o => o.interpreter_id === m.interpreter_id)) {
          conflicts.add(m.full_name);
        }
      });
    });
    return Array.from(conflicts);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await supabase.from('event_assignments').delete().eq('session_id', sessionId);
    const { error } = await supabase.from('event_sessions').delete().eq('id', sessionId);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Agenda excluída' });
    load(); loadAllAssignments();
  };

  const handleDeleteAssignment = async (assignmentId: string, sessionId: string) => {
    const { error } = await supabase.from('event_assignments').delete().eq('id', assignmentId);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Alocação removida' });
    loadAssignments(sessionId); loadAllAssignments();
  };

  const handleSave = async () => {
    if (!form.event_id || !form.session_date || !form.start_time || !form.end_time) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' }); return;
    }
    const payload = {
      event_id: form.event_id, title: form.title || null, session_date: form.session_date,
      start_time: form.start_time, end_time: form.end_time,
      duration_minutes: Number(form.duration_minutes) || null,
      location: form.location || null, modality: form.modality as Database['public']['Enums']['event_modality'],
      notes: form.notes || null, status: form.status as ScheduleStatusV2,
    };
    if (editing) {
      const { error } = await supabase.from('event_sessions').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_sessions').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Agenda atualizada' : 'Agenda criada' });
    setOpen(false); setEditing(null); setForm(emptySession); load();
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      event_id: s.event_id, title: s.title || '', session_date: s.session_date,
      start_time: s.start_time?.slice(0, 5) || '', end_time: s.end_time?.slice(0, 5) || '',
      duration_minutes: s.duration_minutes || 0, location: s.location || '',
      modality: s.modality || 'presencial', notes: s.notes || '', status: s.status,
    });
    setOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignForm.interpreter_id) { toast({ title: 'Selecione um profissional', variant: 'destructive' }); return; }
    const payload = {
      session_id: assignSessionId, interpreter_id: assignForm.interpreter_id,
      service_role: assignForm.service_role || null, role: assignForm.service_role || null,
      payment_mode: assignForm.payment_mode as Database['public']['Enums']['payment_mode'],
      quantity: Number(assignForm.quantity) || 1, unit_value: Number(assignForm.unit_value) || 0,
      total_value: Number(assignForm.total_value) || 0,
      fee_expected: Number(assignForm.fee_expected), fee_final: Number(assignForm.fee_final) || null,
      transport_expected: Number(assignForm.transport_expected), transport_final: Number(assignForm.transport_final) || null,
      notes: assignForm.notes || null,
    };
    if (editingAssign) {
      const { error } = await supabase.from('event_assignments').update(payload).eq('id', editingAssign.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_assignments').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editingAssign ? 'Alocação atualizada' : 'Profissional alocado' });
    setAssignOpen(false); setEditingAssign(null); setAssignForm(emptyAssignment);
    loadAssignments(assignSessionId);
  };

  const sessionsWithoutProfessional = sessions.filter(s => s.status !== 'cancelada' && !(assignments[s.id]?.length > 0));

  const filtered = sessions.filter(s => {
    const evName = (s.events as any)?.event_name || '';
    const title = s.title || '';
    const matchSearch = evName.toLowerCase().includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase());
    const matchEvent = filterEvent === 'all' || s.event_id === filterEvent;
    return matchSearch && matchEvent;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => { setEditing(null); setForm(emptySession); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Agenda
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por evento ou título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.event_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead>Evento</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[40px]" />
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <>
                  <TableRow key={s.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(s.id)}>
                        {expanded.has(s.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{(s.events as any)?.event_name}</TableCell>
                    <TableCell className="text-sm">{s.title || '—'}</TableCell>
                    <TableCell>{format(new Date(s.session_date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</TableCell>
                    <TableCell className="text-sm">{EVENT_MODALITY_LABELS[s.modality] || s.modality}</TableCell>
                    <TableCell><Badge className={SCHEDULE_STATUS_V2_COLORS[s.status]}>{SCHEDULE_STATUS_V2_LABELS[s.status]}</Badge></TableCell>
                    <TableCell>
                      {(() => {
                        const conflicts = getConflictNames(s);
                        return conflicts.length > 0 ? (
                          <span title={`Conflito: ${conflicts.join(', ')} também alocado(s) em outra agenda neste horário`}>
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          </span>
                        ) : null;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Alocar profissional" onClick={() => {
                          setAssignSessionId(s.id); setEditingAssign(null); setAssignForm(emptyAssignment); setAssignOpen(true);
                        }}><UserPlus className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir agenda?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {(allAssignmentsMap[s.id]?.length || 0) > 0
                                  ? `Esta agenda possui ${allAssignmentsMap[s.id]?.length} profissional(is) alocado(s). Todas as alocações serão removidas.`
                                  : 'Esta ação não pode ser desfeita.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSession(s.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded.has(s.id) && (
                    <TableRow key={`${s.id}-assignments`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <p className="text-sm font-medium mb-2">Profissionais Alocados</p>
                        {(assignments[s.id] || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhum profissional alocado.</p>
                        ) : (
                          <Table>
                            <TableHeader><TableRow>
                              <TableHead>Profissional</TableHead><TableHead>Função</TableHead>
                              <TableHead>Mod. Pagamento</TableHead>
                              <TableHead>Cachê Prev.</TableHead><TableHead>Cachê Final</TableHead>
                              <TableHead>Transp. Prev.</TableHead><TableHead>Transp. Final</TableHead>
                              <TableHead>Pagamento</TableHead><TableHead className="w-[60px]" />
                            </TableRow></TableHeader>
                            <TableBody>
                              {(assignments[s.id] || []).map((a: any) => (
                                <TableRow key={a.id}>
                                  <TableCell>{(a.interpreters as any)?.full_name}</TableCell>
                                  <TableCell>{a.service_role || a.role || '—'}</TableCell>
                                  <TableCell><Badge variant="outline">{PAYMENT_MODE_LABELS[a.payment_mode] || a.payment_mode}</Badge></TableCell>
                                  <TableCell>R$ {Number(a.fee_expected || 0).toFixed(2)}</TableCell>
                                  <TableCell>R$ {Number(a.fee_final || 0).toFixed(2)}</TableCell>
                                  <TableCell>R$ {Number(a.transport_expected || 0).toFixed(2)}</TableCell>
                                  <TableCell>R$ {Number(a.transport_final || 0).toFixed(2)}</TableCell>
                                  <TableCell><Badge className={PAYMENT_STATUS_COLORS[a.payment_status]}>{PAYMENT_STATUS_LABELS[a.payment_status]}</Badge></TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      setAssignSessionId(s.id); setEditingAssign(a);
                                      setAssignForm({
                                        interpreter_id: a.interpreter_id, service_role: a.service_role || a.role || '',
                                        payment_mode: a.payment_mode || 'por_sessao', quantity: a.quantity || 1,
                                        unit_value: a.unit_value || 0, total_value: a.total_value || 0,
                                        fee_expected: a.fee_expected || 0, fee_final: a.fee_final || 0,
                                        transport_expected: a.transport_expected || 0, transport_final: a.transport_final || 0,
                                        notes: a.notes || '',
                                      });
                                      setAssignOpen(true);
                                    }}><Pencil className="h-3 w-3" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma agenda encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agenda Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Evento *</Label>
              <Select value={form.event_id} onValueChange={v => setForm({ ...form, event_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.event_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Título da Agenda</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Sessão manhã, Ensaio..." /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Data *</Label><Input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} /></div>
              <div><Label>Início *</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label>Fim *</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Local</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div>
                <Label>Modalidade</Label>
                <Select value={form.modality} onValueChange={v => setForm({ ...form, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EVENT_MODALITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SCHEDULE_STATUS_V2_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAssign ? 'Editar Alocação' : 'Alocar Profissional'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Profissional *</Label>
              <Select value={assignForm.interpreter_id} onValueChange={v => setAssignForm({ ...assignForm, interpreter_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{interpreters.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Função/Serviço</Label><Input value={assignForm.service_role} onChange={e => setAssignForm({ ...assignForm, service_role: e.target.value })} placeholder="Ex: Intérprete principal" /></div>
              <div>
                <Label>Mod. Pagamento</Label>
                <Select value={assignForm.payment_mode} onValueChange={v => setAssignForm({ ...assignForm, payment_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={assignForm.quantity} onChange={e => setAssignForm({ ...assignForm, quantity: Number(e.target.value) })} /></div>
              <div><Label>Valor Unitário (R$)</Label><Input type="number" step="0.01" value={assignForm.unit_value} onChange={e => setAssignForm({ ...assignForm, unit_value: Number(e.target.value) })} /></div>
              <div><Label>Valor Total (R$)</Label><Input type="number" step="0.01" value={assignForm.total_value} onChange={e => setAssignForm({ ...assignForm, total_value: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cachê Previsto (R$)</Label><Input type="number" step="0.01" value={assignForm.fee_expected} onChange={e => setAssignForm({ ...assignForm, fee_expected: Number(e.target.value) })} /></div>
              <div><Label>Cachê Final (R$)</Label><Input type="number" step="0.01" value={assignForm.fee_final} onChange={e => setAssignForm({ ...assignForm, fee_final: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Transporte Previsto (R$)</Label><Input type="number" step="0.01" value={assignForm.transport_expected} onChange={e => setAssignForm({ ...assignForm, transport_expected: Number(e.target.value) })} /></div>
              <div><Label>Transporte Final (R$)</Label><Input type="number" step="0.01" value={assignForm.transport_final} onChange={e => setAssignForm({ ...assignForm, transport_final: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAssignment}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
