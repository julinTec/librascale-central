import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardGerencial() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const { toast } = useToast();

  const handleEmbed = () => {
    if (!embedUrl.trim()) {
      toast({ title: 'Informe a URL', description: 'Cole a URL de embed do Power BI.', variant: 'destructive' });
      return;
    }
    setShowEmbed(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Gerencial</h1>
        <p className="text-muted-foreground">Visualize seus relatórios Power BI diretamente no sistema.</p>
      </div>

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
    </div>
  );
}
