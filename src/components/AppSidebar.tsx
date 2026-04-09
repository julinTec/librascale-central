import {
  LayoutDashboard, Users, Mic, FileText, Calendar, Layers,
  DollarSign, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Profissionais', url: '/interpretes', icon: Mic },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText },
  { title: 'Eventos', url: '/eventos', icon: Calendar },
  { title: 'Agenda', url: '/agenda', icon: Layers },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, role, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground">Nosso Mundo</h2>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Eventos</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
