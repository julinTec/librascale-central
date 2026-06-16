import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LifeBuoy, Loader2 } from 'lucide-react';

type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  status: string;
  thread: Array<{ de: string; mensagem: string; em: string }>;
  created_at: string;
};

export default function Suporte() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [enviando, setEnviando] = useState(false);

  const carregar = async () => {
    const { data, error } = await supabase
      .from('suporte_chamados' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setChamados((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const ch = supabase
      .channel(`suporte_chamados_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suporte_chamados' }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const enviar = async () => {
    if (titulo.trim().length < 3 || descricao.trim().length < 5) {
      toast.error('Preencha título (3+) e descrição (5+).');
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('suporte-abrir-chamado', {
        body: { titulo: titulo.trim(), descricao: descricao.trim(), prioridade },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTitulo(''); setDescricao(''); setPrioridade('media');
      toast.success('Chamado enviado ao suporte');
      carregar();
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao enviar chamado');
    } finally {
      setEnviando(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'resolvido' || s === 'fechado') return 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
    if (s === 'em_andamento') return 'bg-amber-500/15 text-amber-700 border-amber-300';
    return 'bg-sky-500/15 text-sky-700 border-sky-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>
          <p className="text-sm text-muted-foreground">
            Abra um chamado e acompanhe as respostas do nosso time.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Abrir chamado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <Textarea
            placeholder="Descreva o problema ou solicitação"
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={enviar} disabled={enviando}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {enviando ? 'Enviando...' : 'Enviar chamado'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Meus chamados</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && chamados.length === 0 && (
            <p className="text-sm text-muted-foreground">Você ainda não abriu chamados.</p>
          )}
          {chamados.map((c) => {
            const respostas = Array.isArray(c.thread) ? c.thread.length : 0;
            return (
              <Dialog key={c.id}>
                <DialogTrigger asChild>
                  <button className="w-full rounded-md border bg-card p-3 text-left hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-medium">{c.titulo}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{c.prioridade}</Badge>
                        <Badge variant="outline" className={statusColor(c.status)}>
                          {c.status.replace('_', ' ')}
                        </Badge>
                        {respostas > 0 && (
                          <Badge variant="secondary">
                            {respostas} resposta{respostas > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {c.descricao}
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{c.titulo}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                      {c.descricao}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Respostas do suporte
                      </div>
                      {respostas === 0 && (
                        <p className="text-sm text-muted-foreground">Aguardando atendimento.</p>
                      )}
                      {(c.thread ?? []).map((m, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{m.de}</span>
                            <span>{new Date(m.em).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{m.mensagem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
