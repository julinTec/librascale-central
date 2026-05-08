import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ROLE_LABELS } from '@/lib/constants';
import { UserPlus, Trash2, Pencil, Plus, Database, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

const TABLES = [
  'clients', 'interpreters', 'events', 'event_sessions', 'event_assignments',
  'event_services', 'event_quotes', 'budget_items', 'event_receivables',
  'event_payables', 'event_expenses', 'schedules', 'execution_logs',
  'incidents', 'contract_hours', 'period_closings', 'tax_settings',
];

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { role, session } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'operacional' });

  // Edit user
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', password: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Tax settings
  const [taxSettings, setTaxSettings] = useState<any[]>([]);
  const [taxOpen, setTaxOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: 'Simples Nacional', percentage: 6, is_default: true });
  const [editingTax, setEditingTax] = useState<any>(null);

  // API copy
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'admin') loadUsers();
    loadTaxSettings();
  }, [role]);

  const loadUsers = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const merged = (profiles || []).map(p => ({
      ...p,
      user_roles: roles?.filter(r => r.user_id === p.id) || [],
    }));
    setUsers(merged);
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

  const openEditDialog = (u: any) => {
    setEditingUser(u);
    setEditForm({ full_name: u.full_name || '', email: u.email || '', password: '' });
    setEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editForm.full_name.trim() || !editForm.email.trim()) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios.', variant: 'destructive' }); return;
    }
    if (editForm.password && editForm.password.length < 6) {
      toast({ title: 'Erro', description: 'Senha deve ter ao menos 6 caracteres.', variant: 'destructive' }); return;
    }
    setSavingEdit(true);
    try {
      const payload: any = { action: 'update', user_id: editingUser.id, full_name: editForm.full_name.trim(), email: editForm.email.trim() };
      if (editForm.password) payload.password = editForm.password;
      await callManageUsers(payload);
      toast({ title: 'Usuário atualizado' });
      setEditOpen(false); setEditingUser(null); loadUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    } finally { setSavingEdit(false); }
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copiado!', description: `URL de ${label} copiada.` });
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

      {/* API Pública */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" /> API Pública de Dados
          </CardTitle>
          <CardDescription>
            Use estas URLs como fonte de dados "Web" no Power BI (Get Data → Web). A API é pública, sem autenticação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="text-sm flex-1 break-all text-foreground">{API_BASE}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(API_BASE, 'base')}>
                {copied === 'base' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Parâmetros: <code className="text-xs bg-muted px-1 rounded">?table=nome</code>{' '}
              <code className="text-xs bg-muted px-1 rounded">&limit=1000</code>{' '}
              <code className="text-xs bg-muted px-1 rounded">&offset=0</code>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
              {TABLES.map((t) => {
                const url = `${API_BASE}?table=${t}`;
                return (
                  <div key={t} className="flex items-center justify-between p-2 border border-border rounded-md text-sm">
                    <span className="font-mono text-foreground">{t}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(url, t)}>
                      {copied === t ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
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
