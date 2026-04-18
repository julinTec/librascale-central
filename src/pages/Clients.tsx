import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Client = {
  id: string; name: string; trade_name: string | null; cnpj: string | null;
  main_contact: string | null; email: string | null; phone: string | null;
  contract_type: string | null; monthly_hours_package: number | null;
  additional_hour_rate: number | null; notes: string | null; is_active: boolean;
};

const emptyClient = {
  name: '', trade_name: '', cnpj: '', main_contact: '', email: '', phone: '',
  contract_type: '', monthly_hours_package: 0, additional_hour_rate: 0, notes: '', is_active: true,
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name');
    if (data) setClients(data);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const { error } = await supabase.from('clients').update(form).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Cliente atualizado!' });
      } else {
        const { error } = await supabase.from('clients').insert({ ...form, created_by: user?.id });
        if (error) throw error;
        toast({ title: 'Cliente cadastrado!' });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyClient);
      loadClients();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name, trade_name: c.trade_name || '', cnpj: c.cnpj || '',
      main_contact: c.main_contact || '', email: c.email || '', phone: c.phone || '',
      contract_type: c.contract_type || '', monthly_hours_package: c.monthly_hours_package || 0,
      additional_hour_rate: c.additional_hour_rate || 0, notes: c.notes || '', is_active: c.is_active,
    });
    setOpen(true);
  };

  const openNew = () => { setEditing(null); setForm(emptyClient); setOpen(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('clients').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message + ' (verifique se há eventos/agendas vinculados)', variant: 'destructive' });
    } else {
      toast({ title: 'Cliente excluído' });
      loadClients();
    }
    setDeleteTarget(null);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.trade_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Pacote (h/mês)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.trade_name && <p className="text-xs text-muted-foreground">{c.trade_name}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.cnpj || '-'}</TableCell>
                  <TableCell className="text-sm">{c.email || c.phone || '-'}</TableCell>
                  <TableCell className="text-sm">{c.monthly_hours_package || 0}h</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contato Principal</Label>
              <Input value={form.main_contact} onChange={(e) => setForm({ ...form, main_contact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Input value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Pacote Mensal (horas)</Label>
              <Input type="number" value={form.monthly_hours_package} onChange={(e) => setForm({ ...form, monthly_hours_package: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Valor Hora Adicional (R$)</Label>
              <Input type="number" step="0.01" value={form.additional_hour_rate} onChange={(e) => setForm({ ...form, additional_hour_rate: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita. Se houver eventos ou agendas vinculados, a exclusão será bloqueada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
