import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, Link, useLocation, useNavigation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

export function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <Button asChild variant="ghost" size="icon" aria-label="Central de Ajuda">
              <Link to="/ajuda">
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            <div key={location.pathname} className="animate-page-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
