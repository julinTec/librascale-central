import { useEffect, useState } from 'react';
import { useCachedState } from '@/lib/page-cache';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type EventStatus = Database['public']['Enums']['event_status'];
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS, EVENT_TYPE_LABELS, EVENT_MODALITY_LABELS, BILLING_TYPE_LABELS, SERVICE_TYPE_LABELS, BILLING_MODE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

const emptyForm = {
  client_id: '', event_name: '', description: '', venue: '',
  contract_value: 0, status: 'planejado' as string,
  start_date: '', end_date: '', notes: '',
  service_types: ['evento_pontual'] as string[],
  modality: 'presencial' as string,
  billing_type: 'unico' as string,
};

const emptyService = { service_type: 'interprete_libras' as string, description: '', quantity: 1, billing_mode: 'valor_fechado' as string, daily_value: 0, expected_value: 0, notes: '' };

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useCachedState<any[]>('events:list', []);
  const [clients, setClients] = useCachedState<any[]>('events:clients', []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // Event services
  const [services, setServices] = useState<any[]>([]);
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcForm, setSvcForm] = useState(emptyService);
  const [svcEventId, setSvcEventId] = useState('');
  // Linked receivable info
  const [linkedReceivable, setLinkedReceivable] = useState<any>(null);
  const [taxDefault, setTaxDefault] = useState(6);
  // Edit/Delete receivable
  const [recOpen, setRecOpen] = useState(false);
  const [recDelOpen, setRecDelOpen] = useState(false);
  const [recForm, setRecForm] = useState({ amount: 0, tax_percentage: 0, competence_date: '', due_date: '', status: 'pendente', invoice_number: '', description: '' });

  useEffect(() => { load(); loadClients(); loadTaxDefault(); }, []);

  const loadTaxDefault = async () => {
    const { data } = await supabase.from('tax_settings').select('percentage').eq('is_default', true).limit(1);
    if (data?.[0]) setTaxDefault(Number(data[0].percentage));
  };

  const load = async () => {
    const { data } = await supabase.from('events').select('*, clients(name)').order('created_at', { ascending: false });
    setEvents(data || []);
  };

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').eq('is_active', true).order('name');
    setClients(data || []);
  };

  const loadServices = async (eventId: string) => {
    const { data } = await supabase.from('event_services').select('*').eq('event_id', eventId).order('created_at');
    setServices(data || []);
  };

  const upsertReceivable = async (eventId: string, payload: typeof emptyForm) => {
    const amt = Number(payload.contract_value || 0);
    if (amt <= 0) return;
    // Check existing
    const { data: existing } = await supabase.from('event_receivables').select('*').eq('event_id', eventId).limit(1);
    if (existing && existing.length > 0) {
      // Update only origin fields, preserve tax/dates/status set by user
      const r = existing[0];
      const taxPct = Number(r.tax_percentage || 0);
      const taxAmt = amt * taxPct / 100;
      await supabase.from('event_receivables').update({
        amount: amt,
        client_id: payload.client_id || null,
        competence_date: payload.start_date || r.competence_date,
        description: payload.event_name,
        tax_amount: taxAmt,
        net_amount: amt - taxAmt,
      }).eq('id', r.id);
    } else {
      const taxPct = taxDefault;
      const taxAmt = amt * taxPct / 100;
      await supabase.from('event_receivables').insert({
        event_id: eventId,
        client_id: payload.client_id || null,
        amount: amt,
        tax_percentage: taxPct,
        tax_amount: taxAmt,
        net_amount: amt - taxAmt,
        status: 'pendente',
        revenue_type: 'faturamento_unico',
        competence_date: payload.start_date || null,
        description: payload.event_name,
      });
    }
  };

  const loadLinkedReceivable = async (eventId: string) => {
    const { data } = await supabase.from('event_receivables').select('*').eq('event_id', eventId).limit(1);
    setLinkedReceivable(data?.[0] || null);
  };

  const handleSave = async () => {
    if (!form.event_name) {
      toast({ title: 'Preencha o nome do evento', variant: 'destructive' }); return;
    }
    if (!form.service_types || form.service_types.length === 0) {
      toast({ title: 'Selecione ao menos um Tipo de Serviço', variant: 'destructive' }); return;
    }
    const { service_types, ...rest } = form;
    const payload = {
      ...rest,
      client_id: form.client_id || null,
      contract_value: Number(form.contract_value),
      status: form.status as EventStatus,
      service_types,
      event_type: service_types[0] as any,
      modality: form.modality as any,
      billing_type: form.billing_type as any,
    };
    let savedId = editing?.id as string | undefined;
    if (editing) {
      const { error } = await supabase.from('events').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { data, error } = await supabase.from('events').insert({ ...payload, created_by: user?.id }).select('id').single();
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      savedId = data?.id;
      // Persist pending services collected before the event existed
      if (savedId && services.length > 0) {
        const rows = services.map(s => ({
          event_id: savedId,
          service_type: s.service_type,
          description: s.description || null,
          quantity: Number(s.quantity) || 1,
          billing_mode: s.billing_mode,
          expected_value: Number(s.expected_value) || 0,
          notes: s.notes || null,
        }));
        const { error: svcErr } = await supabase.from('event_services').insert(rows);
        if (svcErr) toast({ title: 'Erro ao salvar serviços', description: svcErr.message, variant: 'destructive' });
      }
    }
    if (savedId) await upsertReceivable(savedId, form);
    toast({ title: editing ? 'Evento atualizado' : 'Evento criado', description: Number(form.contract_value) > 0 ? 'Receita vinculada atualizada no Financeiro.' : undefined });
    setOpen(false); setEditing(null); setForm(emptyForm); setServices([]); setLinkedReceivable(null); load();
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      client_id: e.client_id || '', event_name: e.event_name, description: e.description || '',
      venue: e.venue || '', contract_value: e.contract_value || 0, status: e.status,
      start_date: e.start_date || '', end_date: e.end_date || '', notes: e.notes || '',
      service_types: (e.service_types && e.service_types.length > 0) ? e.service_types : [e.event_type || 'evento_pontual'],
      modality: e.modality || 'presencial',
      billing_type: e.billing_type || 'unico',
    });
    setOpen(true);
    loadServices(e.id);
    loadLinkedReceivable(e.id);
  };

  const handleSaveService = async () => {
    // When creating a new event, queue services in memory until save
    if (!svcEventId) {
      setServices(prev => [...prev, { ...svcForm, _local: true, _key: `local-${Date.now()}-${Math.random()}` }]);
      toast({ title: 'Serviço adicionado' });
      setSvcOpen(false); setSvcForm(emptyService);
      return;
    }
    const payload = { ...svcForm, event_id: svcEventId, quantity: Number(svcForm.quantity), expected_value: Number(svcForm.expected_value), service_type: svcForm.service_type as any, billing_mode: svcForm.billing_mode as any };
    const { error } = await supabase.from('event_services').insert(payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Serviço adicionado' });
    setSvcOpen(false); setSvcForm(emptyService); loadServices(svcEventId);
  };

  const handleRemoveService = async (svc: any) => {
    if (svc._local) {
      setServices(prev => prev.filter(s => s._key !== svc._key));
      return;
    }
    const { error } = await supabase.from('event_services').delete().eq('id', svc.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Serviço removido' });
    if (editing) loadServices(editing.id);
  };

  const handleUpdateReceivable = async () => {
    if (!linkedReceivable) return;
    const amt = Number(recForm.amount || 0);
    const taxPct = Number(recForm.tax_percentage || 0);
    const taxAmt = amt * taxPct / 100;
    const { error } = await supabase.from('event_receivables').update({
      amount: amt,
      tax_percentage: taxPct,
      tax_amount: taxAmt,
      net_amount: amt - taxAmt,
      competence_date: recForm.competence_date || null,
      due_date: recForm.due_date || null,
      status: recForm.status as any,
      invoice_number: recForm.invoice_number || null,
      description: recForm.description || null,
    }).eq('id', linkedReceivable.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Receita atualizada' });
    setRecOpen(false);
    if (editing) loadLinkedReceivable(editing.id);
  };

  const handleDeleteReceivable = async () => {
    if (!linkedReceivable) return;
    const { error } = await supabase.from('event_receivables').delete().eq('id', linkedReceivable.id);
    if (error) { toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Receita excluída', description: 'Para não recriar ao salvar, zere o Valor Contratado.' });
    setRecDelOpen(false);
    setLinkedReceivable(null);
  };

  const filtered = events.filter(e => {
    const matchSearch = e.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      (e.clients as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalValue = filtered.reduce((s, e) => s + Number(e.contract_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setServices([]); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Eventos</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor Contratado</p><p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar evento ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_name}</TableCell>
                  <TableCell>{(e.clients as any)?.name || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {((e.service_types && e.service_types.length > 0) ? e.service_types : [e.event_type]).filter(Boolean).map((t: string) => (
                        <Badge key={t} variant="outline">{EVENT_TYPE_LABELS[t] || t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{EVENT_MODALITY_LABELS[e.modality] || e.modality}</TableCell>
                  <TableCell>R$ {Number(e.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.start_date ? format(new Date(e.start_date + 'T12:00:00'), 'dd/MM/yy') : '—'}
                    {e.end_date ? ` - ${format(new Date(e.end_date + 'T12:00:00'), 'dd/MM/yy')}` : ''}
                  </TableCell>
                  <TableCell><Badge className={EVENT_STATUS_COLORS[e.status]}>{EVENT_STATUS_LABELS[e.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Todas as agendas, alocações de profissionais, despesas, contas a pagar e receitas vinculadas a este evento também serão removidas. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => {
                              const { error } = await supabase.rpc('delete_event_cascade', { _event_id: e.id });
                              if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
                              toast({ title: 'Evento excluído' });
                              load();
                            }}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum evento encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={form.client_id || '__none__'} onValueChange={v => setForm({ ...form, client_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem cliente</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nome do Evento *</Label><Input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo de Serviço</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start font-normal h-10 truncate">
                      {form.service_types.length === 0
                        ? <span className="text-muted-foreground">Selecione...</span>
                        : <span className="truncate">{form.service_types.map(t => EVENT_TYPE_LABELS[t] || t).join(', ')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => {
                        const checked = form.service_types.includes(k);
                        return (
                          <label key={k} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                setForm({
                                  ...form,
                                  service_types: c
                                    ? [...form.service_types, k]
                                    : form.service_types.filter(s => s !== k),
                                });
                              }}
                            />
                            <span className="text-sm">{v}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Modalidade</Label>
                <Select value={form.modality} onValueChange={v => setForm({ ...form, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EVENT_MODALITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo Faturamento</Label>
                <Select value={form.billing_type} onValueChange={v => setForm({ ...form, billing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(BILLING_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Local</Label><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
              <div><Label>Valor Contratado (R$)</Label><Input type="number" step="0.01" value={form.contract_value} onChange={e => setForm({ ...form, contract_value: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

            {/* Linked receivable panel */}
            {editing && Number(form.contract_value) > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Receita Vinculada (Financeiro)</Label>
                  {linkedReceivable && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setRecForm({
                          amount: Number(linkedReceivable.amount || 0),
                          tax_percentage: Number(linkedReceivable.tax_percentage || 0),
                          competence_date: linkedReceivable.competence_date || '',
                          due_date: linkedReceivable.due_date || '',
                          status: linkedReceivable.status || 'pendente',
                          invoice_number: linkedReceivable.invoice_number || '',
                          description: linkedReceivable.description || '',
                        });
                        setRecOpen(true);
                      }}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => setRecDelOpen(true)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  )}
                </div>
                {linkedReceivable ? (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-md border bg-muted/30 text-sm">
                    <div><p className="text-xs text-muted-foreground">Bruto</p><p className="font-semibold">R$ {Number(linkedReceivable.amount).toFixed(2)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Imposto</p><p className="font-semibold">{Number(linkedReceivable.tax_percentage).toFixed(2)}%</p></div>
                    <div><p className="text-xs text-muted-foreground">Líquido</p><p className="font-semibold text-success">R$ {Number(linkedReceivable.net_amount || 0).toFixed(2)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold capitalize">{linkedReceivable.status}</p></div>
                    <p className="col-span-full text-xs text-muted-foreground">Editar aqui não altera o Valor Contratado. Salvar o evento sobrescreve o bruto.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Será criada ao salvar (imposto padrão {taxDefault}%).</p>
                )}
              </div>
            )}

            {/* Event Services section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Serviços do Evento</Label>
                <Button size="sm" variant="outline" onClick={() => { setSvcEventId(editing?.id || ''); setSvcForm(emptyService); setSvcOpen(true); }}>
                  <Plus className="h-3 w-3 mr-1" /> Serviço
                </Button>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum serviço vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {services.map((svc, idx) => (
                    <div key={svc.id || svc._key || idx} className="flex items-center justify-between p-2 rounded border text-sm gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mr-2">{SERVICE_TYPE_LABELS[svc.service_type] || svc.service_type}</Badge>
                        <span className="text-muted-foreground">{svc.description || ''} • Qtd: {svc.quantity} • {BILLING_MODE_LABELS[svc.billing_mode]}</span>
                      </div>
                      <span className="font-medium whitespace-nowrap">R$ {Number(svc.expected_value || 0).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveService(svc)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {!editing && services.length > 0 && (
                <p className="text-xs text-muted-foreground">Os serviços serão criados ao salvar o evento.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={svcOpen} onOpenChange={setSvcOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Serviço</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Tipo de Serviço</Label>
              <Select value={svcForm.service_type} onValueChange={v => setSvcForm({ ...svcForm, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={svcForm.quantity} onChange={e => setSvcForm({ ...svcForm, quantity: Number(e.target.value) })} /></div>
              <div>
                <Label>Forma de Cobrança</Label>
                <Select value={svcForm.billing_mode} onValueChange={v => setSvcForm({ ...svcForm, billing_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(BILLING_MODE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Valor Previsto (R$)</Label><Input type="number" step="0.01" value={svcForm.expected_value} onChange={e => setSvcForm({ ...svcForm, expected_value: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvcOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveService}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Receivable Dialog */}
      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Receita Vinculada</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Bruto (R$)</Label><Input type="number" step="0.01" value={recForm.amount} onChange={e => setRecForm({ ...recForm, amount: Number(e.target.value) })} /></div>
              <div><Label>Imposto (%)</Label><Input type="number" step="0.01" value={recForm.tax_percentage} onChange={e => setRecForm({ ...recForm, tax_percentage: Number(e.target.value) })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Líquido: <strong>R$ {(recForm.amount * (1 - recForm.tax_percentage / 100)).toFixed(2)}</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Competência</Label><Input type="date" value={recForm.competence_date} onChange={e => setRecForm({ ...recForm, competence_date: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={recForm.due_date} onChange={e => setRecForm({ ...recForm, due_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={recForm.status} onValueChange={v => setRecForm({ ...recForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nº NF</Label><Input value={recForm.invoice_number} onChange={e => setRecForm({ ...recForm, invoice_number: e.target.value })} /></div>
            </div>
            <div><Label>Descrição</Label><Input value={recForm.description} onChange={e => setRecForm({ ...recForm, description: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">⚠️ Editar aqui não altera o Valor Contratado do evento. Salvar o evento sobrescreve o bruto.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateReceivable}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Receivable Confirmation */}
      <AlertDialog open={recDelOpen} onOpenChange={setRecDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita vinculada?</AlertDialogTitle>
            <AlertDialogDescription>
              A receita será removida do Financeiro. Para evitar que seja recriada ao salvar este evento, zere o Valor Contratado antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceivable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
