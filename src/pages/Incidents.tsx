import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil } from 'lucide-react';
import { INCIDENT_TYPE_LABELS, INCIDENT_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const defaultForm = {
  schedule_id: '', client_id: '', incident_type: 'atraso_cliente' as string,
  description: '', impact_minutes: 0, estimated_financial_impact: 0, status: 'aberta' as string, notes: '',
};

export default function Incidents() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { load(); loadRefs(); }, []);

  const load = async () => {
    const { data } = await supabase.from('incidents')
      .select('*, clients(name), schedules(title, activity_date)')
      .order('occurred_at', { ascending: false });
    if (data) setItems(data);
  };

  const loadRefs = async () => {
    const [c, s] = await Promise.all([
      supabase.from('clients').select('id, name').eq('is_active', true),
      supabase.from('schedules').select('id, title, activity_date').order('activity_date', { ascending: false }).limit(100),
    ]);
    if (c.data) setClients(c.data);
    if (s.data) setSchedules(s.data);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setOpen(true);
  };

  const openEdit = (incident: any) => {
    setEditingId(incident.id);
    setForm({
      schedule_id: incident.schedule_id || '',
      client_id: incident.client_id || '',
      incident_type: incident.incident_type,
      description: incident.description,
      impact_minutes: incident.impact_minutes || 0,
      estimated_financial_impact: incident.estimated_financial_impact || 0,
      status: incident.status,
      notes: incident.notes || '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        incident_type: form.incident_type,
        description: form.description,
        impact_minutes: form.impact_minutes,
        estimated_financial_impact: form.estimated_financial_impact,
        status: form.status,
        notes: form.notes,
      };
      if (form.schedule_id) payload.schedule_id = form.schedule_id;
      if (form.client_id) payload.client_id = form.client_id;

      if (editingId) {
        const { error } = await supabase.from('incidents').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Ocorrência atualizada!' });
      } else {
        payload.reported_by = user?.id;
        const { error } = await supabase.from('incidents').insert(payload);
        if (error) throw error;
        toast({ title: 'Ocorrência registrada!' });
      }
      setOpen(false); load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = items.filter(i => {
    if (filterType !== 'all' && i.incident_type !== filterType) return false;
    if (search && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    aberta: 'bg-warning/10 text-warning border-warning/20',
    em_analise: 'bg-info/10 text-info border-info/20',
    resolvida: 'bg-success/10 text-success border-success/20',
    encerrada: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ocorrências</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Ocorrência</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Impacto (min)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm">{format(new Date(i.occurred_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell><Badge variant="outline">{INCIDENT_TYPE_LABELS[i.incident_type]}</Badge></TableCell>
                  <TableCell className="text-sm">{i.clients?.name || '-'}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{i.description}</TableCell>
                  <TableCell className="text-sm">{i.impact_minutes || 0}</TableCell>
                  <TableCell><Badge className={statusColors[i.status]}>{INCIDENT_STATUS_LABELS[i.status]}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma ocorrência</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.incident_type} onValueChange={(v) => setForm({ ...form, incident_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agenda Vinculada</Label>
              <Select value={form.schedule_id} onValueChange={(v) => setForm({ ...form, schedule_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.title || s.activity_date}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Descrição *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Impacto (minutos)</Label><Input type="number" value={form.impact_minutes} onChange={(e) => setForm({ ...form, impact_minutes: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Impacto Financeiro (R$)</Label><Input type="number" step="0.01" value={form.estimated_financial_impact} onChange={(e) => setForm({ ...form, estimated_financial_impact: Number(e.target.value) })} /></div>
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
