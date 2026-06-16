import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Mic, FileText, Calendar, Layers,
  DollarSign, BarChart3, Settings, PieChart, HelpCircle, LifeBuoy,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const modules = [
  { title: 'Geral', desc: 'Visão geral e indicadores do negócio', url: '/dashboard', icon: LayoutDashboard, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-600' },
  { title: 'Clientes', desc: 'Cadastro e gestão de clientes', url: '/clientes', icon: Users, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600' },
  { title: 'Profissionais', desc: 'Equipe de talentos e intérpretes', url: '/interpretes', icon: Mic, color: 'from-purple-500/10 to-purple-500/5', iconColor: 'text-purple-600' },
  { title: 'Orçamentos', desc: 'Propostas e fechamentos', url: '/orcamentos', icon: FileText, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-600' },
  { title: 'Eventos', desc: 'Gestão completa de eventos', url: '/eventos', icon: Calendar, color: 'from-rose-500/10 to-rose-500/5', iconColor: 'text-rose-600' },
  { title: 'Agenda', desc: 'Sessões e alocações', url: '/agenda', icon: Layers, color: 'from-cyan-500/10 to-cyan-500/5', iconColor: 'text-cyan-600' },
  { title: 'Financeiro', desc: 'Contas a pagar e receber', url: '/financeiro', icon: DollarSign, color: 'from-green-500/10 to-green-500/5', iconColor: 'text-green-600' },
  { title: 'Relatórios', desc: 'Análises e exportações', url: '/relatorios', icon: BarChart3, color: 'from-indigo-500/10 to-indigo-500/5', iconColor: 'text-indigo-600' },
  { title: 'Dashboard Gerencial', desc: 'Power BI e visões estratégicas', url: '/dashboard-gerencial', icon: PieChart, color: 'from-fuchsia-500/10 to-fuchsia-500/5', iconColor: 'text-fuchsia-600' },
  { title: 'Ajuda', desc: 'Tutoriais e documentação', url: '/ajuda', icon: HelpCircle, color: 'from-sky-500/10 to-sky-500/5', iconColor: 'text-sky-600' },
  { title: 'Suporte', desc: 'Abra um chamado técnico', url: '/suporte', icon: LifeBuoy, color: 'from-orange-500/10 to-orange-500/5', iconColor: 'text-orange-600' },
  { title: 'Configurações', desc: 'Preferências do sistema', url: '/configuracoes', icon: Settings, color: 'from-slate-500/10 to-slate-500/5', iconColor: 'text-slate-600' },
];

export default function Home() {
  const { profile } = useAuth();
  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          {firstName ? `Olá, ${firstName}` : 'Bem-vindo'} 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Selecione um módulo para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {modules.map((m) => (
          <Link key={m.url} to={m.url} className="group">
            <Card className={`relative overflow-hidden p-6 h-full border bg-gradient-to-br ${m.color} hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-background/80 backdrop-blur shadow-soft ${m.iconColor} group-hover:scale-110 transition-transform`}>
                  <m.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
