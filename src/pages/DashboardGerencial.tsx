import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

const TABLES = [
  'clients', 'interpreters', 'events', 'event_sessions', 'event_assignments',
  'event_services', 'event_quotes', 'budget_items', 'event_receivables',
  'event_payables', 'event_expenses', 'schedules', 'execution_logs',
  'incidents', 'contract_hours', 'period_closings', 'tax_settings',
];

export default function DashboardGerencial() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEmbed = () => {
    if (!embedUrl.trim()) {
      toast({ title: 'Informe a URL', description: 'Cole a URL de embed do Power BI.', variant: 'destructive' });
      return;
    }
    setShowEmbed(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copiado!', description: `URL de ${label} copiada.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Gerencial</h1>
        <p className="text-muted-foreground">Conecte seu Power BI aos dados do sistema via API pública.</p>
      </div>

      {/* Power BI Embed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" /> Relatório Power BI
          </CardTitle>
          <CardDescription>Cole abaixo a URL de embed do seu relatório Power BI para visualizá-lo aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
              value={embedUrl}
              onChange={(e) => { setEmbedUrl(e.target.value); setShowEmbed(false); }}
              className="flex-1"
            />
            <Button onClick={handleEmbed}>Carregar</Button>
          </div>
          {showEmbed && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border" style={{ height: '70vh' }}>
              <iframe
                title="Power BI Report"
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
    </div>
  );
}
