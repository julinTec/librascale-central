import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Apple, Share, Plus, CheckCircle2, Download } from 'lucide-react';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function Install() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instalar no celular</h1>
        <p className="text-muted-foreground mt-1">
          Adicione o Nosso Mundo à tela inicial e use como um aplicativo.
        </p>
      </div>

      {isStandalone || installed ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="font-medium">App já instalado neste dispositivo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" /> Android (Chrome / Edge)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deferred ? (
                <Button onClick={handleInstall} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Instalar app agora
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Toque no menu (⋮) do navegador e selecione{' '}
                  <strong>"Instalar app"</strong> ou{' '}
                  <strong>"Adicionar à tela inicial"</strong>.
                </p>
              )}
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Abra este site no Chrome do celular</li>
                <li>Toque no menu (⋮) no topo</li>
                <li>Escolha "Instalar app" ou "Adicionar à tela inicial"</li>
                <li>Confirme. O ícone aparecerá na tela do celular</li>
              </ol>
            </CardContent>
          </Card>

          <Card className={isIOS ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" /> iPhone / iPad (Safari)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-3 list-decimal list-inside">
                <li>Abra este site no <strong>Safari</strong> (não funciona em outros navegadores no iPhone)</li>
                <li className="flex items-start gap-2">
                  <span>Toque no botão <Share className="inline h-4 w-4 mx-1" /> <strong>Compartilhar</strong> na barra inferior</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>Role e toque em <Plus className="inline h-4 w-4 mx-1" /> <strong>"Adicionar à Tela de Início"</strong></span>
                </li>
                <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Os dados são os mesmos do PC?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Sim.</strong> O app instalado no celular usa exatamente o mesmo banco de dados que o sistema acessado pelo computador.
          </p>
          <p>
            Tudo o que você cadastrar, alterar ou excluir reflete em tempo real nos dois lados — orçamentos, eventos, agendas, financeiro e relatórios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
