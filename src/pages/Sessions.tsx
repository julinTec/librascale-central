import { useEffect, useState, useMemo } from 'react';
import { useCachedState } from '@/lib/page-cache';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Calendar, Clock, User, Filter, MoreVertical, ChevronDown, ChevronRight, UserPlus, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SCHEDULE_STATUS_V2_LABELS, SCHEDULE_STATUS_V2_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_MODE_LABELS, EVENT_MODALITY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type ScheduleStatusV2 = Database['public']['Enums']['schedule_status_v2'];

const emptySession = { event_id: '', title: '', session_date: '', start_time: '', end_time: '', duration_minutes: 0, location: '', modality: 'presencial' as 'presencial' | 'remoto' | 'hibrido', notes: '', status: 'agendada' as ScheduleStatusV2 };
const emptyAssignment = { interpreter_id: '', service_role: '', payment_mode: 'por_sessao' as 'por_sessao' | 'por_diaria' | 'valor_fechado', quantity: 1, unit_value: 0, total_value: 0, fee_expected: 0, fee_final: 0, transport_expected: 0, transport_final: 0, notes: '' };

export default function Agenda() {
  const { toast } = useToast();
  const [sessions, setSessions] = useCachedState<any[]>('agenda:sessions', []);
  const [events, setEvents] = useCachedState<any[]>('agenda:events', []);
  const [interpreters, setInterpreters] = useCachedState<any[]>('agenda:interpreters', []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptySession);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('all'); // normalized event name or 'all'
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterInterpreter, setFilterInterpreter] = useState('all');
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
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

  const handleSave = async () => {
    if (!form.event_id || !form.session_date || !form.start_time || !form.end_time) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' }); return;
    }
    const payload = { ...form, duration_minutes: Number(form.duration_minutes) || 0, status: form.status as ScheduleStatusV2 };
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
      start_time: s.start_time, end_time: s.end_time, duration_minutes: s.duration_minutes || 0,
      location: s.location || '', modality: s.modality || 'presencial', notes: s.notes || '', status: s.status,
    });
    setOpen(true);
  };

  const handleSaveAssign = async () => {
    if (!assignForm.interpreter_id) { toast({ title: 'Selecione um profissional', variant: 'destructive' }); return; }
    const payload = { ...assignForm, session_id: assignSessionId, quantity: Number(assignForm.quantity) || 0, unit_value: Number(assignForm.unit_value) || 0, total_value: Number(assignForm.total_value) || 0, fee_expected: Number(assignForm.fee_expected) || 0, fee_final: Number(assignForm.fee_final) || 0, transport_expected: Number(assignForm.transport_expected) || 0, transport_final: Number(assignForm.transport_final) || 0 };
    if (editingAssign) {
      const { error } = await supabase.from('event_assignments').update(payload).eq('id', editingAssign.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_assignments').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editingAssign ? 'Alocação atualizada' : 'Profissional alocado' });
    setAssignOpen(false); setEditingAssign(null); setAssignForm(emptyAssignment);
    loadAssignments(assignSessionId); loadAllAssignments();
  };

  // Normalize event name (trim + collapse spaces + lowercase) to dedupe duplicates
  const normalizeName = (n: string) => (n || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // Build event options FROM sessions (only events that actually have agendas),
  // deduped by normalized name and with a count of matching sessions.
  const uniqueEvents = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    sessions.forEach(s => {
      const raw = s.events?.event_name || '';
      const norm = normalizeName(raw);
      if (!norm) return;
      const display = raw.trim().replace(/\s+/g, ' ');
      const cur = map.get(norm);
      if (cur) cur.count += 1;
      else map.set(norm, { name: display, count: 1 });
    });
    return Array.from(map.entries())
      .map(([norm, v]) => ({ norm, name: v.name, count: v.count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [sessions]);

  // Years available consider the currently-selected event filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sessions.forEach(s => {
      if (!s.session_date) return;
      if (filterEvent !== 'all' && normalizeName(s.events?.event_name || '') !== filterEvent) return;
      years.add(s.session_date.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [sessions, filterEvent]);

  // Months available consider event + year selection
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sessions.forEach(s => {
      if (!s.session_date) return;
      if (filterEvent !== 'all' && normalizeName(s.events?.event_name || '') !== filterEvent) return;
      if (filterYear !== 'all' && s.session_date.slice(0, 4) !== filterYear) return;
      months.add(s.session_date.slice(5, 7));
    });
    return months;
  }, [sessions, filterEvent, filterYear]);

  // Auto-reset year/month if they become invalid for the new event selection
  useEffect(() => {
    if (filterYear !== 'all' && !availableYears.includes(filterYear)) setFilterYear('all');
  }, [availableYears, filterYear]);
  useEffect(() => {
    if (filterMonth !== 'all' && !availableMonths.has(filterMonth)) setFilterMonth('all');
  }, [availableMonths, filterMonth]);

  const MONTHS = [
    { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
    { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' },
  ];

  const selectedEventLabel = filterEvent === 'all'
    ? 'Todos os Eventos'
    : uniqueEvents.find(u => u.norm === filterEvent)?.name || 'Todos os Eventos';

  const filtered = sessions.filter(s => {
    const evName = s.events?.event_name || '';
    const matchSearch = (s.title || '').toLowerCase().includes(search.toLowerCase()) || evName.toLowerCase().includes(search.toLowerCase());
    const matchEvent = filterEvent === 'all' || normalizeName(evName) === filterEvent;
    const matchYear = filterYear === 'all' || (s.session_date || '').slice(0, 4) === filterYear;
    const matchMonth = filterMonth === 'all' || (s.session_date || '').slice(5, 7) === filterMonth;
    const matchInterpreter = filterInterpreter === 'all' || (allAssignmentsMap[s.id] || []).some(a => a.interpreter_id === filterInterpreter);
    return matchSearch && matchEvent && matchYear && matchMonth && matchInterpreter;
  });

  const filteredEventOptions = uniqueEvents.filter(u =>
    !eventSearch || u.name.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda & Execução</h1>
          <p className="text-muted-foreground">Controle sessões, profissionais e conflitos em tempo real.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptySession); setOpen(true); }} className="shadow-md hover:shadow-lg transition-all">
          <Plus className="w-4 h-4 mr-2" /> Nova Agenda
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por evento ou título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 focus:bg-background transition-all" />
            </div>

            <Popover open={eventPopoverOpen} onOpenChange={setEventPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full sm:w-[240px] justify-between bg-background/50 font-normal">
                  <span className="truncate">{selectedEventLabel}</span>
                  <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Buscar evento..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-7 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => { setFilterEvent('all'); setEventPopoverOpen(false); setEventSearch(''); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                  >
                    <Check className={cn('w-4 h-4', filterEvent === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos os Eventos
                  </button>
                  {filteredEventOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento encontrado</p>
                  ) : filteredEventOptions.map(opt => (
                    <button
                      key={opt.norm}
                      type="button"
                      onClick={() => { setFilterEvent(opt.norm); setEventPopoverOpen(false); setEventSearch(''); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                    >
                      <Check className={cn('w-4 h-4 shrink-0', filterEvent === opt.norm ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate flex-1">{opt.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{opt.count}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-[130px] bg-background/50">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background/50">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {MONTHS.filter(m => availableMonths.has(m.v)).map(m => (
                  <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="font-semibold py-4">Data & Horário</TableHead>
                  <TableHead className="font-semibold py-4">Evento / Título</TableHead>
                  <TableHead className="font-semibold py-4">Profissionais</TableHead>
                  <TableHead className="font-semibold py-4">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const isExp = expanded.has(s.id);
                  const sessAssigns = allAssignmentsMap[s.id] || [];
                  return (
                    <>
                      <TableRow key={s.id} className="cursor-pointer group hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(s.id)}>
                        <TableCell>
                          {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{format(new Date(s.session_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold group-hover:text-primary transition-colors">{s.events?.event_name || '—'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{s.title || (s.events?.clients?.name ? `Cliente: ${s.events.clients.name}` : '')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {sessAssigns.length > 0 ? (
                              sessAssigns.slice(0, 3).map((a, idx) => (
                                <div key={idx} title={a.full_name} className="h-7 w-7 rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                  {a.full_name.charAt(0)}
                                </div>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/5 gap-1">
                                <AlertTriangle className="w-3 h-3" /> Sem Alocação
                              </Badge>
                            )}
                            {sessAssigns.length > 3 && <div className="h-7 w-7 rounded-full border-2 border-background bg-muted text-muted-foreground flex items-center justify-center text-[10px]">+{sessAssigns.length - 3}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px] uppercase font-bold px-2 py-0.5", SCHEDULE_STATUS_V2_COLORS[s.status] || 'bg-muted')}>
                            {SCHEDULE_STATUS_V2_LABELS[s.status] || s.status}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir agenda?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação removerá a sessão e todas as alocações vinculadas.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={async () => {
                                    const { error } = await supabase.from('event_sessions').delete().eq('id', s.id);
                                    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
                                    toast({ title: 'Agenda excluída' }); load();
                                  }}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {isExp && (
                          <TableRow className="bg-muted/20 border-l-2 border-primary/50">
                            <TableCell colSpan={6} className="p-0 border-b">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden p-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Profissionais Alocados</h4>
                                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-semibold" onClick={() => { setAssignSessionId(s.id); setEditingAssign(null); setAssignForm(emptyAssignment); setAssignOpen(true); }}>
                                    <UserPlus className="w-3.5 h-3.5" /> Adicionar Profissional
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {(assignments[s.id] || []).length === 0 ? (
                                    <p className="text-sm text-center py-6 text-muted-foreground bg-background/50 rounded-lg border border-dashed">Nenhum profissional alocado para esta sessão.</p>
                                  ) : (
                                    (assignments[s.id] || []).map(a => (
                                      <div key={a.id} className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm group/row">
                                        <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{a.interpreters?.full_name?.charAt(0)}</div>
                                          <div>
                                            <p className="text-sm font-bold">{a.interpreters?.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{a.service_role || 'Sem função definida'}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-right hidden sm:block">
                                            <p className="text-xs font-bold text-foreground">R$ {Number(a.total_value || 0).toLocaleString('pt-BR')}</p>
                                            <p className="text-[10px] text-muted-foreground">Custo Total</p>
                                          </div>
                                          <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAssign(a); setAssignSessionId(s.id); setAssignForm({ ...a }); setAssignOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                                              const { error } = await supabase.from('event_assignments').delete().eq('id', a.id);
                                              if (error) { toast({ title: 'Erro', variant: 'destructive' }); return; }
                                              loadAssignments(s.id); loadAllAssignments();
                                            }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editing ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Evento Relacionado *</Label>
              <Select value={form.event_id} onValueChange={v => setForm({ ...form, event_id: v })}>
                <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
                <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.event_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Data *</Label>
                <Input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} className="bg-muted/30" />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Título (opcional)</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Abertura" className="bg-muted/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label className="text-sm font-semibold">Início *</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="bg-muted/30" /></div>
              <div className="grid gap-2"><Label className="text-sm font-semibold">Fim *</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="bg-muted/30" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Modalidade</Label>
                <Select value={form.modality} onValueChange={v => setForm({ ...form, modality: v as any })}>
                  <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EVENT_MODALITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger className={cn("bg-muted/30 font-bold", SCHEDULE_STATUS_V2_COLORS[form.status])}><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SCHEDULE_STATUS_V2_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editingAssign ? 'Editar Alocação' : 'Alocar Profissional'}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
             <div className="grid gap-2">
                <Label className="text-sm font-semibold">Profissional *</Label>
                <Select value={assignForm.interpreter_id} onValueChange={v => setAssignForm({ ...assignForm, interpreter_id: v })}>
                  <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                  <SelectContent>{interpreters.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-sm font-semibold">Papel / Função</Label><Input value={assignForm.service_role} onChange={e => setAssignForm({ ...assignForm, service_role: e.target.value })} placeholder="Ex: Intérprete Titular" className="bg-muted/30" /></div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Forma Pagto</Label>
                  <Select value={assignForm.payment_mode} onValueChange={v => setAssignForm({ ...assignForm, payment_mode: v as any })}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2"><Label className="text-sm font-semibold">Qtd</Label><Input type="number" value={assignForm.quantity} onChange={e => { const q = Number(e.target.value); setAssignForm({ ...assignForm, quantity: q, total_value: q * assignForm.unit_value }); }} className="bg-muted/30" /></div>
                <div className="grid gap-2"><Label className="text-sm font-semibold">Valor Unit.</Label><Input type="number" step="0.01" value={assignForm.unit_value} onChange={e => { const u = Number(e.target.value); setAssignForm({ ...assignForm, unit_value: u, total_value: u * assignForm.quantity }); }} className="bg-muted/30" /></div>
                <div className="grid gap-2"><Label className="text-sm font-semibold text-primary">Custo Total</Label><Input type="number" value={assignForm.total_value} readOnly className="bg-primary/5 border-primary/20 font-bold" /></div>
             </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancelar</Button><Button onClick={handleSaveAssign}>Confirmar Alocação</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}