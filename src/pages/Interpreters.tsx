import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROFESSIONAL_TYPE_LABELS } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const emptyForm = {
  full_name: '', cpf: '', phone: '', email: '', employment_type: '',
  hourly_rate: 0, specialty: '', default_availability: '', notes: '', is_active: true,
  professional_type: 'interprete_libras' as string,
};

export default function Interpreters() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('interpreters').select('*').order('full_name');
    if (data) setItems(data);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, hourly_rate: Number(form.hourly_rate) || 0, professional_type: form.professional_type as any };
      if (editing) {
        const { error } = await supabase.from('interpreters').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('interpreters').insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
      toast({ title: editing ? 'Profissional atualizado!' : 'Profissional cadastrado!' });
      setOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (i: any) => {
    setEditing(i);
    setForm({
      full_name: i.full_name, cpf: i.cpf || '', phone: i.phone || '', email: i.email || '',
      employment_type: i.employment_type || '', hourly_rate: i.hourly_rate || 0,
      specialty: i.specialty || '', default_availability: i.default_availability || '',
      notes: i.notes || '', is_active: i.is_active,
      professional_type: i.professional_type || 'interprete_libras',
    });
    setOpen(true);
  };

  const handleDelete = async (i: any) => {
    const { count } = await supabase.from('event_assignments').select('id', { count: 'exact', head: true }).eq('interpreter_id', i.id);
    if ((count || 0) > 0) {
      toast({ title: 'Não é possível excluir', description: 'Profissional possui alocações vinculadas. Inative em vez de excluir.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('interpreters').delete().eq('id', i.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Profissional excluído' });
    load();
  };

  const filtered = items.filter(i => i.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Profissional
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar profissional..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CPF / CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Valor/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.full_name}</TableCell>
                  <TableCell><Badge variant="outline">{PROFESSIONAL_TYPE_LABELS[i.professional_type] || i.professional_type}</Badge></TableCell>
                  <TableCell className="text-sm">{i.cpf || '-'}</TableCell>
                  <TableCell className="text-sm">{i.email || i.phone || '-'}</TableCell>
                  <TableCell className="text-sm">R$ {(i.hourly_rate || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={i.is_active ? 'default' : 'secondary'}>{i.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Profissionais com alocações vinculadas não podem ser excluídos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(i)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum profissional encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Tipo Profissional</Label>
              <Select value={form.professional_type} onValueChange={v => setForm({ ...form, professional_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PROFESSIONAL_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tipo de Vínculo</Label><Input value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Valor Hora (R$)</Label><Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Especialidade</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
