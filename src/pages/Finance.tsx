import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ReceivableStatus = Database['public']['Enums']['receivable_status'];
type PayableStatus = Database['public']['Enums']['payable_status'];
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { RECEIVABLE_STATUS_LABELS, RECEIVABLE_STATUS_COLORS, PAYABLE_STATUS_LABELS, PAYABLE_STATUS_COLORS, REVENUE_TYPE_LABELS, COST_TYPE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

const emptyReceivable = { event_id: '', amount: 0, tax_percentage: 0, due_date: '', received_date: '', invoice_number: '', status: 'pendente' as string, notes: '', revenue_type: 'faturamento_unico' as string, competence_date: '', description: '', client_id: '' };
const emptyPayable = { event_id: '', interpreter_id: '', amount: 0, due_date: '', paid_date: '', status: 'pendente' as string, notes: '', cost_type: 'mao_de_obra' as string, competence_date: '', description: '' };

export default function Finance() {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [taxDefault, setTaxDefault] = useState(0);

  const [recOpen, setRecOpen] = useState(false);
  const [recEditing, setRecEditing] = useState<any>(null);
  const [recForm, setRecForm] = useState(emptyReceivable);

  const [payOpen, setPayOpen] = useState(false);
  const [payEditing, setPayEditing] = useState<any>(null);
  const [payForm, setPayForm] = useState(emptyPayable);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'receivable' | 'payable'; id: string; label: string } | null>(null);

  useEffect(() => { loadAll(); loadTaxDefault(); }, []);

  const loadAll = async () => {
    const [r, p, e, i, c] = await Promise.all([
      supabase.from('event_receivables').select('*, events(event_name, clients(name))').order('due_date'),
      supabase.from('event_payables').select('*, events(event_name), interpreters(full_name)').order('due_date'),
      supabase.from('events').select('id, event_name').order('event_name'),
      supabase.from('interpreters').select('id, full_name').eq('is_active', true).order('full_name'),
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
    ]);
    setReceivables(r.data || []);
    setPayables(p.data || []);
    setEvents(e.data || []);
    setInterpreters(i.data || []);
    setClients(c.data || []);
  };

  const loadTaxDefault = async () => {
    const { data } = await supabase.from('tax_settings').select('percentage').eq('is_default', true).limit(1);
    if (data?.[0]) setTaxDefault(Number(data[0].percentage));
  };

  const totalRecPending = receivables.filter(r => r.status === 'pendente' || r.status === 'vencido').reduce((s, r) => s + Number(r.amount), 0);
  const totalPayPending = payables.filter(p => p.status === 'pendente' || p.status === 'vencido').reduce((s, p) => s + Number(p.amount), 0);
  const totalNetReceived = receivables.filter(r => r.status === 'recebido').reduce((s, r) => s + Number(r.net_amount || r.amount || 0), 0);
  const totalPaidCosts = payables.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0);
  const realProfit = totalNetReceived - totalPaidCosts;

  const saveReceivable = async () => {
    if (!recForm.event_id || !recForm.amount) { toast({ title: 'Preencha campos obrigatórios', variant: 'destructive' }); return; }
    const amt = Number(recForm.amount);
    const taxPct = Number(recForm.tax_percentage) || 0;
    const taxAmt = amt * taxPct / 100;
    const netAmt = amt - taxAmt;
    const payload = {
      event_id: recForm.event_id, amount: amt,
      tax_percentage: taxPct, tax_amount: taxAmt, net_amount: netAmt,
      due_date: recForm.due_date || null, received_date: recForm.received_date || null,
      invoice_number: recForm.invoice_number || null,
      status: recForm.status as ReceivableStatus,
      notes: recForm.notes || null,
      revenue_type: recForm.revenue_type as any,
      competence_date: recForm.competence_date || null,
      description: recForm.description || null,
      client_id: recForm.client_id || null,
    };
    if (recEditing) {
      const { error } = await supabase.from('event_receivables').update(payload).eq('id', recEditing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_receivables').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: recEditing ? 'Receita atualizada' : 'Receita criada' });
    setRecOpen(false); setRecEditing(null); setRecForm(emptyReceivable); loadAll();
  };

  const savePayable = async () => {
    if (!payForm.event_id || !payForm.amount) { toast({ title: 'Preencha campos obrigatórios', variant: 'destructive' }); return; }
    const payload = {
      event_id: payForm.event_id, amount: Number(payForm.amount),
      due_date: payForm.due_date || null, paid_date: payForm.paid_date || null,
      interpreter_id: payForm.interpreter_id || null,
      status: payForm.status as PayableStatus,
      notes: payForm.notes || null,
      cost_type: payForm.cost_type as any,
      competence_date: payForm.competence_date || null,
      description: payForm.description || null,
    };
    if (payEditing) {
      const { error } = await supabase.from('event_payables').update(payload).eq('id', payEditing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_payables').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: payEditing ? 'Custo atualizado' : 'Custo criado' });
    setPayOpen(false); setPayEditing(null); setPayForm(emptyPayable); loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'receivable' ? 'event_receivables' : 'event_payables';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) { toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Lançamento excluído' });
    setDeleteTarget(null);
    loadAll();
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '—';
  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-success" />
          <div><p className="text-xs text-muted-foreground">A Receber</p><p className="text-lg font-bold">{fmtMoney(totalRecPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-destructive" />
          <div><p className="text-xs text-muted-foreground">A Pagar</p><p className="text-lg font-bold">{fmtMoney(totalPayPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Saldo Previsto</p><p className="text-lg font-bold">{fmtMoney(totalRecPending - totalPayPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-success" />
          <div><p className="text-xs text-muted-foreground">Recebido Líq.</p><p className="text-lg font-bold">{fmtMoney(totalNetReceived)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-info" />
          <div><p className="text-xs text-muted-foreground">Lucro Real</p><p className={`text-lg font-bold ${realProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtMoney(realProfit)}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">Receitas</TabsTrigger>
          <TabsTrigger value="payables">Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            As receitas são geradas automaticamente a partir dos eventos cadastrados. Aqui você ajusta imposto, datas, NF e status.
          </p>
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Evento</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Valor Bruto</TableHead><TableHead>Imposto</TableHead><TableHead>Valor Líquido</TableHead>
                <TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="w-[60px]" />
              </TableRow></TableHeader>
              <TableBody>
                {receivables.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r.events as any)?.event_name}</TableCell>
                    <TableCell className="text-sm">{r.description || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{REVENUE_TYPE_LABELS[r.revenue_type] || r.revenue_type}</Badge></TableCell>
                    <TableCell>{fmtMoney(Number(r.amount))}</TableCell>
                    <TableCell className="text-sm text-destructive">{r.tax_percentage ? `${r.tax_percentage}% (${fmtMoney(Number(r.tax_amount || 0))})` : '—'}</TableCell>
                    <TableCell className="font-medium text-success">{fmtMoney(Number(r.net_amount || r.amount))}</TableCell>
                    <TableCell>{fmtDate(r.due_date)}</TableCell>
                    <TableCell><Badge className={RECEIVABLE_STATUS_COLORS[r.status]}>{RECEIVABLE_STATUS_LABELS[r.status]}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setRecEditing(r); setRecForm({
                          event_id: r.event_id, amount: r.amount, tax_percentage: r.tax_percentage || 0,
                          due_date: r.due_date || '', received_date: r.received_date || '',
                          invoice_number: r.invoice_number || '', status: r.status, notes: r.notes || '',
                          revenue_type: r.revenue_type || 'faturamento_unico',
                          competence_date: r.competence_date || '', description: r.description || '',
                          client_id: r.client_id || '',
                        }); setRecOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {receivables.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma receita.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setPayEditing(null); setPayForm(emptyPayable); setPayOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Custo
            </Button>
          </div>
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Evento</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Profissional</TableHead><TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="w-[60px]" />
              </TableRow></TableHeader>
              <TableBody>
                {payables.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{(p.events as any)?.event_name}</TableCell>
                    <TableCell className="text-sm">{p.description || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{COST_TYPE_LABELS[p.cost_type] || p.cost_type}</Badge></TableCell>
                    <TableCell>{(p.interpreters as any)?.full_name || '—'}</TableCell>
                    <TableCell>{fmtMoney(Number(p.amount))}</TableCell>
                    <TableCell>{fmtDate(p.due_date)}</TableCell>
                    <TableCell><Badge className={PAYABLE_STATUS_COLORS[p.status]}>{PAYABLE_STATUS_LABELS[p.status]}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setPayEditing(p); setPayForm({
                          event_id: p.event_id, interpreter_id: p.interpreter_id || '', amount: p.amount,
                          due_date: p.due_date || '', paid_date: p.paid_date || '', status: p.status,
                          notes: p.notes || '', cost_type: p.cost_type || 'mao_de_obra',
                          competence_date: p.competence_date || '', description: p.description || '',
                        }); setPayOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payables.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum custo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Receivable Dialog */}
      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Receita</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Origem (vinculada ao evento)</p>
              <p className="font-medium">{events.find(ev => ev.id === recForm.event_id)?.event_name || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Valor bruto: <span className="font-medium text-foreground">{fmtMoney(Number(recForm.amount))}</span></p>
            </div>
            <div>
              <Label>Tipo de Receita</Label>
              <Select value={recForm.revenue_type} onValueChange={v => setRecForm({ ...recForm, revenue_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(REVENUE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Imposto (%) — afeta o líquido</Label>
                <Input type="number" step="0.01" value={recForm.tax_percentage} onChange={e => setRecForm({ ...recForm, tax_percentage: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Valor Líquido</Label>
                <Input readOnly value={fmtMoney(Number(recForm.amount) - (Number(recForm.amount) * Number(recForm.tax_percentage) / 100))} className="bg-muted font-semibold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nº Nota Fiscal</Label><Input value={recForm.invoice_number} onChange={e => setRecForm({ ...recForm, invoice_number: e.target.value })} /></div>
              <div><Label>Competência</Label><Input type="date" value={recForm.competence_date} onChange={e => setRecForm({ ...recForm, competence_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Vencimento</Label><Input type="date" value={recForm.due_date} onChange={e => setRecForm({ ...recForm, due_date: e.target.value })} /></div>
              <div><Label>Data Recebimento</Label><Input type="date" value={recForm.received_date} onChange={e => setRecForm({ ...recForm, received_date: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={recForm.status} onValueChange={v => setRecForm({ ...recForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(RECEIVABLE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecOpen(false)}>Cancelar</Button>
            <Button onClick={saveReceivable}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payable Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{payEditing ? 'Editar Custo' : 'Novo Custo'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evento *</Label>
                <Select value={payForm.event_id} onValueChange={v => setPayForm({ ...payForm, event_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.event_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Custo</Label>
                <Select value={payForm.cost_type} onValueChange={v => setPayForm({ ...payForm, cost_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(COST_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Input value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Profissional</Label>
                <Select value={payForm.interpreter_id || '__none__'} onValueChange={v => setPayForm({ ...payForm, interpreter_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {interpreters.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Competência</Label><Input type="date" value={payForm.competence_date} onChange={e => setPayForm({ ...payForm, competence_date: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={payForm.due_date} onChange={e => setPayForm({ ...payForm, due_date: e.target.value })} /></div>
              <div><Label>Data Pagamento</Label><Input type="date" value={payForm.paid_date} onChange={e => setPayForm({ ...payForm, paid_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={payForm.status} onValueChange={v => setPayForm({ ...payForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PAYABLE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button onClick={savePayable}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
