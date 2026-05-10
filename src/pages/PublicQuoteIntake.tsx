import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import logoNossoMundo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const SERVICE_OPTIONS: Record<string, string> = {
  interprete_libras: 'Intérprete de Libras',
  audiodescritor: 'Audiodescritor',
  consultor: 'Consultor',
  locutor: 'Locutor',
  assistente: 'Assistente',
  outro: 'Outro',
};

const MODALITY_OPTIONS: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

type State = 'loading' | 'ready' | 'submitted' | 'expired' | 'invalid' | 'sending' | 'sent';

export default function PublicQuoteIntake() {
  const { token = '' } = useParams();
  const { toast } = useToast();
  const [state, setState] = useState<State>('loading');
  const [form, setForm] = useState({
    requester_name: '', requester_email: '', requester_phone: '', company_name: '',
    event_name: '', service_types: [] as string[], modality: 'presencial', venue: '',
    start_date: '', end_date: '', sessions_count: 1,
    description: '', observations: '', referral_source: '',
    website: '', // honeypot
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/quote-intake-get?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON },
        });
        const j = await r.json();
        setState(j.state === 'ready' ? 'ready' : j.state || 'invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  const submit = async () => {
    setState('sending');
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/quote-intake-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
        body: JSON.stringify({ token, payload: form }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast({ title: 'Não foi possível enviar', description: j.error || 'Verifique os campos.', variant: 'destructive' });
        setState('ready');
        return;
      }
      setState('sent');
    } catch {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
      setState('ready');
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img src={logoNossoMundo} alt="Nosso Mundo" className="h-16 mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Pré-cadastro de Orçamento</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Preencha as informações abaixo para que possamos preparar seu orçamento.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {state === 'loading' && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                Carregando...
              </div>
            )}

            {(state === 'invalid' || state === 'expired' || state === 'submitted') && (
              <div className="flex flex-col items-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  {state === 'expired' && 'Link expirado'}
                  {state === 'invalid' && 'Link inválido'}
                  {state === 'submitted' && 'Pré-cadastro já enviado'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  {state === 'expired' && 'Este link de pré-cadastro não está mais válido. Entre em contato com a equipe para receber um novo link.'}
                  {state === 'invalid' && 'O link informado não existe ou foi cancelado.'}
                  {state === 'submitted' && 'As informações deste pré-cadastro já foram recebidas. Em breve nossa equipe entrará em contato.'}
                </p>
              </div>
            )}

            {state === 'sent' && (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Recebemos suas informações!</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Em breve nossa equipe analisará seu pedido e enviará o orçamento. Obrigado!
                </p>
              </div>
            )}

            {(state === 'ready' || state === 'sending') && (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
                {/* Honeypot */}
                <input type="text" name="website" autoComplete="off" tabIndex={-1}
                  value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="hidden" aria-hidden />

                <section className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Dados do Solicitante</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Nome completo *</Label><Input value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} required /></div>
                    <div><Label>Empresa / Instituição</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                    <div><Label>E-mail *</Label><Input type="email" value={form.requester_email} onChange={(e) => setForm({ ...form, requester_email: e.target.value })} required /></div>
                    <div><Label>Telefone / WhatsApp *</Label><Input value={form.requester_phone} onChange={(e) => setForm({ ...form, requester_phone: e.target.value })} required /></div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Sobre o Evento</h3>
                  <div><Label>Nome do evento *</Label><Input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} required /></div>

                  <div>
                    <Label>Tipo de serviço * (selecione um ou mais)</Label>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2 p-3 rounded-md border">
                      {Object.entries(SERVICE_OPTIONS).map(([k, v]) => {
                        const checked = form.service_types.includes(k);
                        return (
                          <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox checked={checked} onCheckedChange={(c) => setForm({
                              ...form,
                              service_types: c ? [...form.service_types, k] : form.service_types.filter(s => s !== k),
                            })} />
                            <span>{v}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Modalidade *</Label>
                      <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(MODALITY_OPTIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantidade estimada de sessões</Label>
                      <Input type="number" min={1} value={form.sessions_count} onChange={(e) => setForm({ ...form, sessions_count: Number(e.target.value) })} />
                    </div>
                  </div>

                  {(form.modality === 'presencial' || form.modality === 'hibrido') && (
                    <div><Label>Local / Endereço *</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required /></div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Data início *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
                    <div><Label>Data fim</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                  </div>

                  <div><Label>Descrição / objetivo do evento</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </section>

                <section className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Outros</h3>
                  <div><Label>Observações adicionais</Label><Textarea rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></div>
                  <div><Label>Como nos conheceu?</Label><Input value={form.referral_source} onChange={(e) => setForm({ ...form, referral_source: e.target.value })} /></div>
                </section>

                <Button type="submit" className="w-full" disabled={state === 'sending'}>
                  {state === 'sending' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Enviar pré-cadastro'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Os dados informados serão usados exclusivamente para elaboração do orçamento, conforme a LGPD.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
