import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoNossoMundo from '@/assets/logo-nosso-mundo.jpg';

type QuoteStatus = Database['public']['Enums']['quote_status'];

// Helpers para parsear/serializar campos extras dentro de notes (JSON retro-compatível)
const parseNotes = (raw: string | null | undefined): { ac: string; payment: string; obs: string } => {
  if (!raw) return { ac: '', payment: '', obs: '' };
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object' && ('ac' in j || 'payment' in j || 'obs' in j)) {
      return { ac: j.ac || '', payment: j.payment || '', obs: j.obs || '' };
    }
  } catch { /* not json */ }
  return { ac: '', payment: '', obs: raw };
};
const serializeNotes = (ac: string, payment: string, obs: string) =>
  JSON.stringify({ ac: ac || '', payment: payment || '', obs: obs || '' });
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, ArrowRightCircle, Search, Trash2, FileDown, Link2, Copy, Eye, X } from 'lucide-react';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, SERVICE_TYPE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';

const emptyForm = {
  client_id: '', event_name: '', event_type: '', venue: '',
  start_date: '', end_date: '', sessions_count: 1, quoted_value: 0,
  status: 'recebido' as string, source_channel: '',
  attention_to: '', payment_terms: '', observations: '',
};

const emptyItem = { service_type: 'interprete_libras' as string, description: '', quantity: 1, unit: '', unit_value: 0, total_value: 0, is_recurring: false, notes: '' };

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
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [itemOpen, setItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [itemQuoteId, setItemQuoteId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pré-cadastros (intakes)
  const [intakes, setIntakes] = useState<any[]>([]);
  const [genOpen, setGenOpen] = useState(false);
  const [genClient, setGenClient] = useState('');
  const [genExpiryDays, setGenExpiryDays] = useState(30);
  const [genLink, setGenLink] = useState('');
  const [genExpiresAt, setGenExpiresAt] = useState<string>('');
  const [viewIntake, setViewIntake] = useState<any>(null);

  useEffect(() => { load(); loadClients(); loadIntakes(); }, []);

  const load = async () => {
    const { data } = await supabase.from('event_quotes').select('*, clients(name)').order('created_at', { ascending: false });
    setQuotes(data || []);
  };

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').eq('is_active', true).order('name');
    setClients(data || []);
  };

  const loadItems = async (quoteId: string) => {
    const { data } = await supabase.from('budget_items').select('*').eq('quote_id', quoteId).order('created_at');
    setBudgetItems(data || []);
  };

  const handleSave = async () => {
    if (!form.event_name) {
      toast({ title: 'Preencha o nome do evento', variant: 'destructive' }); return;
    }
    const payload = {
      client_id: form.client_id || null,
      event_name: form.event_name,
      event_type: form.event_type,
      venue: form.venue,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      sessions_count: Number(form.sessions_count),
      quoted_value: Number(form.quoted_value),
      status: form.status as QuoteStatus,
      source_channel: form.source_channel,
      notes: serializeNotes(form.attention_to, form.payment_terms, form.observations),
    };
    if (editing) {
      const { error } = await supabase.from('event_quotes').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('event_quotes').insert({ ...payload, created_by: user?.id } as any);
      if (error) { toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Orçamento atualizado' : 'Orçamento criado' });
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const openEdit = (q: any) => {
    const parsed = parseNotes(q.notes);
    setEditing(q);
    setForm({
      client_id: q.client_id || '', event_name: q.event_name, event_type: q.event_type || '',
      venue: q.venue || '', start_date: q.start_date || '', end_date: q.end_date || '',
      sessions_count: q.sessions_count || 1, quoted_value: q.quoted_value || 0,
      status: q.status, source_channel: q.source_channel || '',
      attention_to: parsed.ac, payment_terms: parsed.payment, observations: parsed.obs,
    });
    setOpen(true);
    loadItems(q.id);
  };

  const convertToEvent = async (q: any) => {
    const { error } = await supabase.from('events').insert({
      client_id: q.client_id || null, quote_id: q.id, event_name: q.event_name,
      venue: q.venue, contract_value: q.quoted_value, start_date: q.start_date,
      end_date: q.end_date, created_by: user?.id,
    });
    if (error) { toast({ title: 'Erro ao converter', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('event_quotes').update({ status: 'aprovado' as QuoteStatus }).eq('id', q.id);
    toast({ title: 'Evento criado a partir do orçamento!' });
    load();
  };

  const deleteQuote = async (id: string) => {
    await supabase.from('budget_items').delete().eq('quote_id', id);
    const { error } = await supabase.from('event_quotes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Orçamento excluído' });
      load();
    }
    setDeleteId(null);
  };

  const exportPDF = async (q: any) => {
    const { data: items } = await supabase.from('budget_items').select('*').eq('quote_id', q.id).order('created_at');
    const parsed = parseNotes(q.notes);
    const clientName = (q.clients as any)?.name || '';
    const ac = parsed.ac || '';
    const paymentTerms = parsed.payment || 'A combinar com o cliente, conforme nota fiscal emitida.';
    const observations = parsed.obs || '';

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PURPLE: [number, number, number] = [107, 63, 160];
    const TURQUOISE: [number, number, number] = [63, 184, 175];
    const TEXT: [number, number, number] = [51, 51, 51];
    const SUBTLE: [number, number, number] = [102, 102, 102];
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const contentW = pageW - marginX * 2;

    const drawChrome = () => {
      // top purple bar
      doc.setFillColor(...PURPLE);
      doc.rect(0, 0, pageW, 8, 'F');
      // bottom turquoise bar
      doc.setFillColor(...TURQUOISE);
      doc.rect(0, pageH - 8, pageW, 8, 'F');
      // footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SUBTLE);
      doc.text('Documento otimizado para impressão e acessibilidade.', pageW / 2, pageH - 11, { align: 'center' });
    };

    const ensureSpace = (needed: number, currentY: number): number => {
      if (currentY + needed > pageH - 18) {
        doc.addPage();
        drawChrome();
        return 22;
      }
      return currentY;
    };

    const addParagraph = (text: string, y: number, opts: { size?: number; color?: [number, number, number]; bold?: boolean; align?: 'left' | 'center' | 'justify' } = {}): number => {
      const size = opts.size ?? 10.5;
      const color = opts.color ?? TEXT;
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentW);
      const lineH = size * 0.45;
      let cy = y;
      for (const line of lines) {
        cy = ensureSpace(lineH + 1, cy);
        if (opts.align === 'center') {
          doc.text(line, pageW / 2, cy, { align: 'center' });
        } else {
          doc.text(line, marginX, cy);
        }
        cy += lineH + 1;
      }
      return cy + 1;
    };

    const addSection = (num: number, title: string, body: string, y: number): number => {
      let cy = ensureSpace(14, y) + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(...PURPLE);
      doc.text(`${num}. ${title}`, marginX, cy);
      cy += 6;
      if (body) cy = addParagraph(body, cy);
      return cy;
    };

    // === PAGE 1 ===
    drawChrome();

    // Logo centered
    try {
      const logoW = 45;
      const logoH = (128 / 226) * logoW;
      doc.addImage(logoNossoMundo, 'JPEG', (pageW - logoW) / 2, 14, logoW, logoH);
    } catch { /* ignore */ }

    let y = 14 + (128 / 226) * 45 + 8;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PURPLE);
    doc.text('Proposta Comercial', pageW / 2, y, { align: 'center' });
    y += 8;

    // Subtitle: A/C + cliente
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...SUBTLE);
    const subtitleParts: string[] = [];
    if (ac) subtitleParts.push(`A/C ${ac}`);
    if (clientName) subtitleParts.push(clientName);
    const subtitle = subtitleParts.join(' — ') || q.event_name;
    doc.text(subtitle, pageW / 2, y, { align: 'center' });
    y += 10;

    // Section 1 — Apresentação
    const apresentacao =
      'A Nosso Mundo - Diversidade e Inclusão é uma empresa especializada em acessibilidade comunicacional, ' +
      'oferecendo serviços de interpretação em Libras, audiodescrição, legendagem e consultoria em inclusão. ' +
      'Atuamos com profissionais qualificados e equipamentos próprios, garantindo qualidade técnica e ' +
      'humanização em cada projeto. Nossa missão é tornar eventos, conteúdos e ambientes verdadeiramente ' +
      'acessíveis para todas as pessoas.';
    y = addSection(1, 'Apresentação', apresentacao, y);

    // Section 2 — Escopo do Serviço
    const escopoLines: string[] = [];
    escopoLines.push(`Evento: ${q.event_name}`);
    if (q.event_type) escopoLines.push(`Tipo: ${q.event_type}`);
    if (q.venue) escopoLines.push(`Local: ${q.venue}`);
    if (q.sessions_count) escopoLines.push(`Quantidade de sessões: ${q.sessions_count}`);
    if (observations) escopoLines.push('', observations);
    y = addSection(2, 'Escopo do Serviço', escopoLines.join('\n'), y);

    // Section 3 — Cronograma
    let cronograma = 'A definir conforme alinhamento com o cliente.';
    if (q.start_date) {
      const ini = format(new Date(q.start_date + 'T12:00:00'), 'dd/MM/yyyy');
      const fim = q.end_date ? format(new Date(q.end_date + 'T12:00:00'), 'dd/MM/yyyy') : null;
      cronograma = fim && fim !== ini
        ? `Período de execução: ${ini} a ${fim}.`
        : `Data de execução: ${ini}.`;
    }
    y = addSection(3, 'Cronograma', cronograma, y);

    // Section 4 — Investimento
    y = ensureSpace(20, y) + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...PURPLE);
    doc.text('4. Investimento', marginX, y);
    y += 6;

    const totalItems = (items || []).reduce((s: number, i: any) => s + Number(i.total_value || 0), 0);
    const totalValor = totalItems > 0 ? totalItems : Number(q.quoted_value || 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT);
    doc.text(
      `Valor total: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      marginX, y
    );
    y += 6;

    if (items && items.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX, bottom: 18 },
        head: [['Serviço', 'Descrição', 'Qtd', 'Un.', 'Valor Unit.', 'Total']],
        body: items.map((i: any) => [
          SERVICE_TYPE_LABELS[i.service_type] || i.service_type,
          i.description || '',
          String(i.quantity),
          i.unit || '',
          `R$ ${Number(i.unit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${Number(i.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ]),
        foot: [['', '', '', '', 'Total:', `R$ ${totalItems.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
        headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: [240, 235, 248], textColor: PURPLE, fontStyle: 'bold' },
        didDrawPage: () => drawChrome(),
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Section 5 — Condições de Pagamento
    y = addSection(5, 'Condições de Pagamento', paymentTerms, y);

    // Section 6 — Validade da Proposta
    const validade = `Esta proposta tem validade de 15 (quinze) dias a partir de ${format(new Date(), 'dd/MM/yyyy')}.`;
    y = addSection(6, 'Validade da Proposta', validade, y);

    // Section 7 — Contato
    const contato =
      'Jefferson Rosa\n' +
      'Nosso Mundo — Diversidade e Inclusão\n' +
      'E-mail: contato@nossomundoinclusao.com.br';
    y = addSection(7, 'Informações de Contato', contato, y);

    doc.save(`proposta-${q.event_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const handleSaveItem = async () => {
    if (!itemQuoteId) return;
    const payload = {
      quote_id: itemQuoteId,
      service_type: itemForm.service_type as any,
      description: itemForm.description || null,
      quantity: Number(itemForm.quantity),
      unit: itemForm.unit || null,
      unit_value: Number(itemForm.unit_value),
      total_value: Number(itemForm.quantity) * Number(itemForm.unit_value),
      is_recurring: itemForm.is_recurring,
      notes: itemForm.notes || null,
    };
    const { error } = await supabase.from('budget_items').insert(payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Item adicionado' });
    setItemOpen(false); setItemForm(emptyItem); loadItems(itemQuoteId);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('budget_items').delete().eq('id', id);
    if (itemQuoteId) loadItems(itemQuoteId);
  };

  const filtered = quotes.filter(q => {
    const matchSearch = q.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      (q.clients as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const itemsTotal = budgetItems.reduce((s, i) => s + Number(i.total_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setBudgetItems([]); setOpen(true); }}>
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
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.event_name}</TableCell>
                  <TableCell>{(q.clients as any)?.name || '—'}</TableCell>
                  <TableCell>R$ {Number(q.quoted_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {q.start_date ? format(new Date(q.start_date + 'T12:00:00'), 'dd/MM/yy') : '—'}
                    {q.end_date ? ` - ${format(new Date(q.end_date + 'T12:00:00'), 'dd/MM/yy')}` : ''}
                  </TableCell>
                  <TableCell><Badge className={QUOTE_STATUS_COLORS[q.status]}>{QUOTE_STATUS_LABELS[q.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Exportar PDF" onClick={() => exportPDF(q)}><FileDown className="h-4 w-4" /></Button>
                      {(q.status === 'enviado' || q.status === 'aprovado') && (
                        <Button variant="ghost" size="icon" title="Converter em Evento" onClick={() => convertToEvent(q)}>
                          <ArrowRightCircle className="h-4 w-4 text-success" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteId(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento e todos os seus itens serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteQuote(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>A/C — Pessoa de contato</Label>
                <Input value={form.attention_to} onChange={e => setForm({ ...form, attention_to: e.target.value })} placeholder="Ex: Sr. João Silva" />
              </div>
              <div>
                <Label>Condições de Pagamento</Label>
                <Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="Ex: 50% antecipado, 50% após o evento" />
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} placeholder="Detalhes adicionais sobre o escopo do serviço" /></div>

            {editing && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itens do Orçamento</Label>
                  <Button size="sm" variant="outline" onClick={() => { setItemQuoteId(editing.id); setItemForm(emptyItem); setItemOpen(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Item
                  </Button>
                </div>
                {budgetItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {budgetItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded border text-sm">
                          <div>
                            <Badge variant="outline" className="mr-2">{SERVICE_TYPE_LABELS[item.service_type] || item.service_type}</Badge>
                            <span className="text-muted-foreground">{item.description || ''} • Qtd: {item.quantity} × R$ {Number(item.unit_value).toFixed(2)}</span>
                            {item.is_recurring && <Badge variant="secondary" className="ml-2 text-xs">Recorrente</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">R$ {Number(item.total_value || 0).toFixed(2)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-right">Total dos Itens: R$ {itemsTotal.toFixed(2)}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Tipo de Serviço</Label>
              <Select value={itemForm.service_type} onValueChange={v => setItemForm({ ...itemForm, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} /></div>
              <div><Label>Unidade</Label><Input value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="h, dia, un..." /></div>
              <div><Label>Valor Unitário</Label><Input type="number" step="0.01" value={itemForm.unit_value} onChange={e => setItemForm({ ...itemForm, unit_value: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={itemForm.is_recurring} onChange={e => setItemForm({ ...itemForm, is_recurring: e.target.checked })} />
              <Label>Cobrança recorrente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveItem}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
