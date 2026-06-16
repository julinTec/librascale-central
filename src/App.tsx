import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import PublicQuoteIntake from "./pages/PublicQuoteIntake";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Interpreters from "./pages/Interpreters";
import Quotes from "./pages/Quotes";
import Events from "./pages/Events";
import Agenda from "./pages/Sessions";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import DashboardGerencial from "./pages/DashboardGerencial";
import Help from "./pages/Help";
import Install from "./pages/Install";
import Suporte from "./pages/Suporte";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/orcamento/preencher/:token" element={<PublicQuoteIntake />} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/inicio" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/interpretes" element={<Interpreters />} />
              <Route path="/orcamentos" element={<Quotes />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/financeiro" element={<Finance />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/dashboard-gerencial" element={<DashboardGerencial />} />
              <Route path="/ajuda" element={<Help />} />
              <Route path="/instalar" element={<Install />} />
              <Route path="/suporte" element={<Suporte />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
