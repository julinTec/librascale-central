import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type QuoteStatus = Database['public']['Enums']['quote_status'];
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, ArrowRightCircle, Search } from 'lucide-react';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';

const emptyForm = {
  client_id: '', event_name: '', event_type: '', venue: '',
  start_date: '', end_date: '', sessions_count: 1, quoted_value: 0,
  status: 'recebido' as string, source_channel: '', notes: '',
};

export default function Quotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { load(); loadClients(); }, []);

  const load = async () => {
    const { data } = await supabase.from('event_quotes').select('*, clients(name)').order('created_at', { ascending: false });
    setQuotes(data || []);
  };

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').eq('is_active', true).order('name');
    setClients(data || []);
  };

  const handleSave = async () => {
    if (!form.client_id || !form.event_name) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const payload = { ...form, sessions_count: Number(form.sessions_count), quoted_value: Number(form.quoted_value), status: form.status as QuoteStatus };
    if (editing) {
      const { error } = await supabase.from('event_quotes').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_quotes').insert({ ...payload, created_by: user?.id });
      if (error) { toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Orçamento atualizado' : 'Orçamento criado' });
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const openEdit = (q: any) => {
    setEditing(q);
    setForm({
      client_id: q.client_id, event_name: q.event_name, event_type: q.event_type || '',
      venue: q.venue || '', start_date: q.start_date || '', end_date: q.end_date || '',
      sessions_count: q.sessions_count || 1, quoted_value: q.quoted_value || 0,
      status: q.status, source_channel: q.source_channel || '', notes: q.notes || '',
    });
    setOpen(true);
  };

  const convertToEvent = async (q: any) => {
    const { error } = await supabase.from('events').insert({
      client_id: q.client_id, quote_id: q.id, event_name: q.event_name,
      venue: q.venue, contract_value: q.quoted_value, start_date: q.start_date,
      end_date: q.end_date, created_by: user?.id,
    });
    if (error) { toast({ title: 'Erro ao converter', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('event_quotes').update({ status: 'aprovado' }).eq('id', q.id);
    toast({ title: 'Evento criado a partir do orçamento!' });
    load();
  };

  const filtered = quotes.filter(q => {
    const matchSearch = q.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      (q.clients as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por evento ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.event_name}</TableCell>
                  <TableCell>{(q.clients as any)?.name}</TableCell>
                  <TableCell>R$ {Number(q.quoted_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {q.start_date ? format(new Date(q.start_date + 'T12:00:00'), 'dd/MM/yy') : '—'}
                    {q.end_date ? ` - ${format(new Date(q.end_date + 'T12:00:00'), 'dd/MM/yy')}` : ''}
                  </TableCell>
                  <TableCell><Badge className={QUOTE_STATUS_COLORS[q.status]}>{QUOTE_STATUS_LABELS[q.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                      {(q.status === 'enviado' || q.status === 'aprovado') && (
                        <Button variant="ghost" size="icon" title="Converter em Evento" onClick={() => convertToEvent(q)}>
                          <ArrowRightCircle className="h-4 w-4 text-success" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum orçamento encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do Evento *</Label>
                <Input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo do Evento</Label><Input value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} /></div>
              <div><Label>Local</Label><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              <div><Label>Qtd Sessões</Label><Input type="number" min={1} value={form.sessions_count} onChange={e => setForm({ ...form, sessions_count: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Valor Orçado (R$)</Label><Input type="number" step="0.01" value={form.quoted_value} onChange={e => setForm({ ...form, quoted_value: Number(e.target.value) })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Canal de Origem</Label><Input value={form.source_channel} onChange={e => setForm({ ...form, source_channel: e.target.value })} placeholder="WhatsApp, E-mail..." /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
