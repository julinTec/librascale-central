import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const POWER_BI_URL =
  'https://app.powerbi.com/view?r=eyJrIjoiYTQ4YzUxY2QtMjA3ZS00YjZhLWI0MTMtYTYzY2M0MTI5MDZmIiwidCI6ImViYzMxZTJiLWE5OTYtNGQ4MS04NzIwLWRjNWNkYWQ4YzNmYyJ9';

export default function DashboardGerencial() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Gerencial</h1>
        <p className="text-muted-foreground">Relatórios e indicadores de gestão.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" /> Relatório Power BI
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            title="Power BI Report"
            src={POWER_BI_URL}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
            allowFullScreen
          />
        </CardContent>
      </Card>
    </div>
  );
}
