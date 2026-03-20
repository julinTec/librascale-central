import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { RECEIVABLE_STATUS_LABELS, RECEIVABLE_STATUS_COLORS, PAYABLE_STATUS_LABELS, PAYABLE_STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';

const emptyReceivable = { event_id: '', amount: 0, due_date: '', received_date: '', invoice_number: '', status: 'pendente' as string, notes: '' };
const emptyPayable = { event_id: '', interpreter_id: '', amount: 0, due_date: '', paid_date: '', status: 'pendente' as string, notes: '' };

export default function Finance() {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [interpreters, setInterpreters] = useState<any[]>([]);

  const [recOpen, setRecOpen] = useState(false);
  const [recEditing, setRecEditing] = useState<any>(null);
  const [recForm, setRecForm] = useState(emptyReceivable);

  const [payOpen, setPayOpen] = useState(false);
  const [payEditing, setPayEditing] = useState<any>(null);
  const [payForm, setPayForm] = useState(emptyPayable);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [r, p, e, i] = await Promise.all([
      supabase.from('event_receivables').select('*, events(event_name, clients(name))').order('due_date'),
      supabase.from('event_payables').select('*, events(event_name), interpreters(full_name)').order('due_date'),
      supabase.from('events').select('id, event_name').order('event_name'),
      supabase.from('interpreters').select('id, full_name').eq('is_active', true).order('full_name'),
    ]);
    setReceivables(r.data || []);
    setPayables(p.data || []);
    setEvents(e.data || []);
    setInterpreters(i.data || []);
  };

  const totalRecPending = receivables.filter(r => r.status === 'pendente' || r.status === 'vencido').reduce((s, r) => s + Number(r.amount), 0);
  const totalPayPending = payables.filter(p => p.status === 'pendente' || p.status === 'vencido').reduce((s, p) => s + Number(p.amount), 0);

  const saveReceivable = async () => {
    if (!recForm.event_id || !recForm.amount) { toast({ title: 'Preencha campos obrigatórios', variant: 'destructive' }); return; }
    const payload = { ...recForm, amount: Number(recForm.amount), received_date: recForm.received_date || null };
    if (recEditing) {
      const { error } = await supabase.from('event_receivables').update(payload).eq('id', recEditing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_receivables').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: recEditing ? 'Recebível atualizado' : 'Recebível criado' });
    setRecOpen(false); setRecEditing(null); setRecForm(emptyReceivable); loadAll();
  };

  const savePayable = async () => {
    if (!payForm.event_id || !payForm.amount) { toast({ title: 'Preencha campos obrigatórios', variant: 'destructive' }); return; }
    const payload = { ...payForm, amount: Number(payForm.amount), paid_date: payForm.paid_date || null, interpreter_id: payForm.interpreter_id || null };
    if (payEditing) {
      const { error } = await supabase.from('event_payables').update(payload).eq('id', payEditing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_payables').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: payEditing ? 'Pagável atualizado' : 'Pagável criado' });
    setPayOpen(false); setPayEditing(null); setPayForm(emptyPayable); loadAll();
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '—';
  const fmtMoney = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-success" />
          <div><p className="text-xs text-muted-foreground">A Receber (Pendente)</p><p className="text-xl font-bold">{fmtMoney(totalRecPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-destructive" />
          <div><p className="text-xs text-muted-foreground">A Pagar (Pendente)</p><p className="text-xl font-bold">{fmtMoney(totalPayPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Saldo Previsto</p><p className="text-xl font-bold">{fmtMoney(totalRecPending - totalPayPending)}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">A Receber</TabsTrigger>
          <TabsTrigger value="payables">A Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setRecEditing(null); setRecForm(emptyReceivable); setRecOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Recebível
            </Button>
          </div>
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Evento</TableHead><TableHead>Cliente</TableHead><TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead><TableHead>NF</TableHead><TableHead>Status</TableHead><TableHead className="w-[60px]" />
              </TableRow></TableHeader>
              <TableBody>
                {receivables.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r.events as any)?.event_name}</TableCell>
                    <TableCell>{(r.events as any)?.clients?.name}</TableCell>
                    <TableCell>{fmtMoney(Number(r.amount))}</TableCell>
                    <TableCell>{fmtDate(r.due_date)}</TableCell>
                    <TableCell className="text-sm">{r.invoice_number || '—'}</TableCell>
                    <TableCell><Badge className={RECEIVABLE_STATUS_COLORS[r.status]}>{RECEIVABLE_STATUS_LABELS[r.status]}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setRecEditing(r); setRecForm({ event_id: r.event_id, amount: r.amount, due_date: r.due_date || '', received_date: r.received_date || '', invoice_number: r.invoice_number || '', status: r.status, notes: r.notes || '' }); setRecOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {receivables.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum recebível.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setPayEditing(null); setPayForm(emptyPayable); setPayOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Pagável
            </Button>
          </div>
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Evento</TableHead><TableHead>Intérprete</TableHead><TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="w-[60px]" />
              </TableRow></TableHeader>
              <TableBody>
                {payables.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{(p.events as any)?.event_name}</TableCell>
                    <TableCell>{(p.interpreters as any)?.full_name || '—'}</TableCell>
                    <TableCell>{fmtMoney(Number(p.amount))}</TableCell>
                    <TableCell>{fmtDate(p.due_date)}</TableCell>
                    <TableCell><Badge className={PAYABLE_STATUS_COLORS[p.status]}>{PAYABLE_STATUS_LABELS[p.status]}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setPayEditing(p); setPayForm({ event_id: p.event_id, interpreter_id: p.interpreter_id || '', amount: p.amount, due_date: p.due_date || '', paid_date: p.paid_date || '', status: p.status, notes: p.notes || '' }); setPayOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payables.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum pagável.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Receivable Dialog */}
      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{recEditing ? 'Editar Recebível' : 'Novo Recebível'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Evento *</Label>
              <Select value={recForm.event_id} onValueChange={v => setRecForm({ ...recForm, event_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.event_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={recForm.amount} onChange={e => setRecForm({ ...recForm, amount: Number(e.target.value) })} /></div>
              <div><Label>Nº Nota Fiscal</Label><Input value={recForm.invoice_number} onChange={e => setRecForm({ ...recForm, invoice_number: e.target.value })} /></div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{payEditing ? 'Editar Pagável' : 'Novo Pagável'}</DialogTitle></DialogHeader>
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
                <Label>Intérprete</Label>
                <Select value={payForm.interpreter_id} onValueChange={v => setPayForm({ ...payForm, interpreter_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{interpreters.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={payForm.status} onValueChange={v => setPayForm({ ...payForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PAYABLE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Vencimento</Label><Input type="date" value={payForm.due_date} onChange={e => setPayForm({ ...payForm, due_date: e.target.value })} /></div>
              <div><Label>Data Pagamento</Label><Input type="date" value={payForm.paid_date} onChange={e => setPayForm({ ...payForm, paid_date: e.target.value })} /></div>
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
