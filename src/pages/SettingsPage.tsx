import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ROLE_LABELS } from '@/lib/constants';
import { UserPlus, Trash2, Pencil, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { role, session } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'operacional' });

  // Tax settings
  const [taxSettings, setTaxSettings] = useState<any[]>([]);
  const [taxOpen, setTaxOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: 'Simples Nacional', percentage: 6, is_default: true });
  const [editingTax, setEditingTax] = useState<any>(null);

  useEffect(() => {
    if (role === 'admin') loadUsers();
    loadTaxSettings();
  }, [role]);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*, user_roles(role)');
    if (data) setUsers(data);
  };

  const loadTaxSettings = async () => {
    const { data } = await supabase.from('tax_settings').select('*').order('created_at');
    setTaxSettings(data || []);
  };

  const callManageUsers = async (body: any) => {
    const { data, error } = await supabase.functions.invoke('manage-users', { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' }); return;
    }
    setCreating(true);
    try {
      await callManageUsers({ action: 'create', ...newUser });
      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso.' });
      setNewUser({ full_name: '', email: '', password: '', role: 'operacional' });
      setDialogOpen(false); loadUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao criar', description: err.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await callManageUsers({ action: 'delete', user_id: userId });
      toast({ title: 'Removido', description: `${userName} foi removido.` }); loadUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await callManageUsers({ action: 'update_role', user_id: userId, role: newRole });
      toast({ title: 'Perfil atualizado' }); loadUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveTax = async () => {
    const payload = { name: taxForm.name, percentage: Number(taxForm.percentage), is_default: taxForm.is_default };
    if (editingTax) {
      const { error } = await supabase.from('tax_settings').update(payload).eq('id', editingTax.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('tax_settings').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editingTax ? 'Imposto atualizado' : 'Imposto criado' });
    setTaxOpen(false); setEditingTax(null); setTaxForm({ name: 'Simples Nacional', percentage: 6, is_default: true }); loadTaxSettings();
  };

  const isCurrentUser = (userId: string) => session?.user?.id === userId;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* Tax Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Imposto Padrão</CardTitle>
          {role === 'admin' && (
            <Button size="sm" variant="outline" onClick={() => { setEditingTax(null); setTaxForm({ name: 'Simples Nacional', percentage: 6, is_default: true }); setTaxOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Faixa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Percentual</TableHead>
                <TableHead>Padrão</TableHead>
                {role === 'admin' && <TableHead className="w-[60px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxSettings.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.percentage}%</TableCell>
                  <TableCell>{t.is_default ? <Badge>Padrão</Badge> : '—'}</TableCell>
                  {role === 'admin' && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingTax(t); setTaxForm({ name: t.name, percentage: t.percentage, is_default: t.is_default }); setTaxOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {taxSettings.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma configuração de imposto.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Usuários e Perfis</CardTitle>
          {role === 'admin' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Nome completo</Label><Input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Senha</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} minLength={6} /></div>
                  <div className="space-y-2">
                    <Label>Perfil</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button onClick={handleCreateUser} disabled={creating}>{creating ? 'Criando...' : 'Criar Usuário'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {role !== 'admin' ? (
            <p className="text-muted-foreground text-sm">Apenas administradores podem gerenciar usuários.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Perfil</TableHead><TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.full_name || '-'}
                      {isCurrentUser(u.id) && <Badge variant="outline" className="ml-2 text-xs">Você</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{u.email || '-'}</TableCell>
                    <TableCell>
                      {isCurrentUser(u.id) ? (
                        u.user_roles?.map((r: any) => <Badge key={r.role} variant="secondary">{ROLE_LABELS[r.role] || r.role}</Badge>)
                      ) : (
                        <Select defaultValue={u.user_roles?.[0]?.role || 'operacional'} onValueChange={v => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isCurrentUser(u.id) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                              <AlertDialogDescription>Tem certeza que deseja remover <strong>{u.full_name || u.email}</strong>?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(u.id, u.full_name || u.email)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sobre o Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p><strong>Nosso Mundo Gestão</strong> — Gestão de Acessibilidade em Eventos</p>
            <p>Versão 2.0</p>
            <p>Sistema operacional-financeiro para gestão de serviços de acessibilidade.</p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Dialog */}
      <Dialog open={taxOpen} onOpenChange={setTaxOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingTax ? 'Editar Imposto' : 'Nova Faixa de Imposto'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Nome</Label><Input value={taxForm.name} onChange={e => setTaxForm({ ...taxForm, name: e.target.value })} /></div>
            <div><Label>Percentual (%)</Label><Input type="number" step="0.01" value={taxForm.percentage} onChange={e => setTaxForm({ ...taxForm, percentage: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={taxForm.is_default} onChange={e => setTaxForm({ ...taxForm, is_default: e.target.checked })} />
              <Label>Usar como padrão</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTax}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
