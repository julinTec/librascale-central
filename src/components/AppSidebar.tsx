import {
  LayoutDashboard, Users, Mic, FileText, Calendar, Layers,
  DollarSign, BarChart3, Settings, LogOut, PieChart, HelpCircle, LifeBuoy,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Profissionais', url: '/interpretes', icon: Mic },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText },
  { title: 'Eventos', url: '/eventos', icon: Calendar },
  { title: 'Agenda', url: '/agenda', icon: Layers },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Dashboard Gerencial', url: '/dashboard-gerencial', icon: PieChart },
  { title: 'Ajuda', url: '/ajuda', icon: HelpCircle },
  { title: 'Suporte', url: '/suporte', icon: LifeBuoy },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const [intakeCount, setIntakeCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const { count } = await supabase
        .from('quote_intakes' as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'recebido');
      setIntakeCount(count || 0);
    };
    loadCount();
    const ch = supabase.channel('sidebar_intakes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_intakes' }, loadCount)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden ring-2 ring-accent/60">
              <img src={logo} alt="Nosso Mundo Talentos" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground tracking-tight">Nosso Mundo</h2>
              <p className="text-xs text-sidebar-foreground/60">Talentos</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden ring-2 ring-accent/60">
              <img src={logo} alt="Nosso Mundo Talentos" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const showBadge = item.url === '/orcamentos' && intakeCount > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {showBadge && (
                          <Badge className="ml-auto bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-[10px]">
                            {intakeCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{role}</p>
          </div>
        )}
        <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} onClick={signOut}
          className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
