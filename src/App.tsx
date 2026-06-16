import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import PublicQuoteIntake from "./pages/PublicQuoteIntake";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes — each becomes its own chunk and only loads on demand.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Interpreters = lazy(() => import("./pages/Interpreters"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Events = lazy(() => import("./pages/Events"));
const Agenda = lazy(() => import("./pages/Sessions"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DashboardGerencial = lazy(() => import("./pages/DashboardGerencial"));
const Help = lazy(() => import("./pages/Help"));
const Install = lazy(() => import("./pages/Install"));
const Suporte = lazy(() => import("./pages/Suporte"));

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

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Carregando…
    </div>
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
