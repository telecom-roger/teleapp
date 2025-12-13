import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { ChatNotificationBell } from "@/components/chat-notification-bell";
import { LogoutButton } from "@/components/logout-button";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { EcommerceProtectedRoute } from "@/components/EcommerceProtectedRoute";
import { EcommerceOrderNotifications } from "@/components/ecommerce-order-notifications";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Clientes from "@/pages/clientes";
import ClienteForm from "@/pages/cliente-form";
import ClienteProfile from "@/pages/cliente-profile";
import Kanban from "@/pages/kanban";
import KanbanSettings from "@/pages/kanban-settings";
import Campanhas from "@/pages/campanhas";
import CampanhaNova from "@/pages/campanhas-nova";
import CampanhasWhatsApp from "@/pages/campanhas-whatsapp";
import Importacao from "@/pages/importacao";
import AdminUsuarios from "@/pages/admin-usuarios";
import AdminTemplates from "@/pages/admin-templates";
import AdminAutomacao from "@/pages/admin/automation-config";
import AdminAutomacaoAdvanced from "@/pages/admin/automation-config-advanced";
import ImportPartners from "@/pages/admin/import-partners";
import WhatsApp from "@/pages/whatsapp";
import WhatsAppBroadcast from "@/pages/whatsapp-broadcast";
import Chat from "@/pages/chat";
import ModelosMensagens from "@/pages/modelos-mensagens";
import CampanhasAgendadas from "@/pages/campanhas-agendadas";
import CampanhasEmExecucao from "@/pages/campanhas-em-execucao";
import CampanhasHistorico from "@/pages/campanhas-historico";
import CampanhaDetalhes from "@/pages/campanha-detalhes";
import QuickRepliesConfig from "@/pages/quick-replies-config";
import TagsConfig from "@/pages/tags-config";
import TestAutomation from "@/pages/test-automation";
import TestChat from "@/pages/test-chat";
import NotFound from "@/pages/not-found";

// E-commerce Pages
import EcommerceHome from "@/pages/ecommerce/home";
import EcommercePlanos from "@/pages/ecommerce/planos";
import EcommerceCategoria from "@/pages/ecommerce/categoria";
import EcommerceLogin from "@/pages/ecommerce/login";
import EcommercePainel from "@/pages/ecommerce/painel";
import CustomerLogin from "@/pages/ecommerce/customer-login";
import CustomerDashboard from "@/pages/ecommerce/customer-dashboard";
import CustomerOrders from "@/pages/ecommerce/customer-orders";
import CustomerProfile from "@/pages/ecommerce/customer-profile";
import CustomerDocuments from "@/pages/ecommerce/customer-documents";
import CheckoutTipoCliente from "@/pages/ecommerce/checkout/tipo-cliente";
import CheckoutDados from "@/pages/ecommerce/checkout/dados";
import CheckoutEndereco from "@/pages/ecommerce/checkout/endereco";
import CheckoutDocumentos from "@/pages/ecommerce/checkout/documentos";
import CheckoutConfirmacao from "@/pages/ecommerce/checkout/confirmacao";
import CheckoutObrigado from "@/pages/ecommerce/checkout/obrigado";
import AdminProdutos from "@/pages/admin/ecommerce-produtos";
import AdminCategorias from "@/pages/admin/ecommerce-categorias";
import AdminPedidos from "@/pages/admin/ecommerce-pedidos";
import AdminKanban from "@/pages/admin/ecommerce-kanban";
import AdminListagemPedidos from "@/pages/admin/ecommerce-listagem-pedidos";
import TestPage from "@/pages/ecommerce/test-page";

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes/novo" component={ClienteForm} />
      <Route path="/clientes/:id/editar" component={ClienteForm} />
      <Route path="/clientes/:id" component={ClienteProfile} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/clientes/editar/:id" component={ClienteForm} />
      <Route path="/oportunidades" component={Kanban} />
      <Route path="/kanban-settings" component={KanbanSettings} />
      <Route path="/campanhas" component={Campanhas} />
      <Route path="/campanhas/nova" component={CampanhaNova} />
      <Route path="/campanhas/whatsapp" component={CampanhasWhatsApp} />
      <Route path="/whatsapp" component={WhatsApp} />
      <Route path="/whatsapp/broadcast" component={WhatsAppBroadcast} />
      <Route path="/chat" component={Chat} />
      <Route path="/etiquetas" component={TagsConfig} />
      <Route path="/modelos-mensagens" component={ModelosMensagens} />
      <Route path="/campanhas-agendadas" component={CampanhasAgendadas} />
      <Route path="/campanhas-em-execucao" component={CampanhasEmExecucao} />
      <Route path="/campanhas-historico" component={CampanhasHistorico} />
      <Route path="/campanhas/:id/detalhes" component={CampanhaDetalhes} />
      <Route path="/mensagens-rapidas" component={QuickRepliesConfig} />
      <Route path="/importacao" component={Importacao} />
      <Route path="/admin/usuarios" component={AdminUsuarios} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/automacao" component={AdminAutomacao} />
      <Route path="/admin/automacao-avancado" component={AdminAutomacaoAdvanced} />
      <Route path="/admin/import-partners" component={ImportPartners} />
      <Route path="/admin/ecommerce-produtos" component={AdminProdutos} />
      <Route path="/admin/ecommerce-categorias" component={AdminCategorias} />
      <Route path="/admin/ecommerce-pedidos" component={AdminPedidos} />
      <Route path="/admin/ecommerce-kanban" component={AdminKanban} />
      <Route path="/admin/ecommerce-listagem" component={AdminListagemPedidos} />
      <Route path="/test/automation" component={TestAutomation} />
      <Route path="/test/chat" component={TestChat} />
      
      {/* E-commerce Routes */}
      <Route path="/ecommerce" component={EcommerceHome} />
      <Route path="/ecommerce/test" component={TestPage} />
      <Route path="/ecommerce/planos" component={EcommercePlanos} />
      <Route path="/ecommerce/login" component={CustomerLogin} />
      
      {/* E-commerce Checkout Routes (public) - ANTES do :slug */}
      <Route path="/ecommerce/checkout" component={CheckoutTipoCliente} />
      <Route path="/ecommerce/checkout/dados" component={CheckoutDados} />
      <Route path="/ecommerce/checkout/endereco" component={CheckoutEndereco} />
      <Route path="/ecommerce/checkout/documentos" component={CheckoutDocumentos} />
      <Route path="/ecommerce/checkout/confirmacao" component={CheckoutConfirmacao} />
      <Route path="/ecommerce/checkout/obrigado" component={CheckoutObrigado} />
      
      {/* E-commerce Protected Routes (require customer authentication) */}
      <Route path="/ecommerce/painel">
        {(params) => <EcommerceProtectedRoute component={CustomerDashboard} {...params} />}
      </Route>
      <Route path="/ecommerce/painel/pedidos/:orderId">
        {(params) => <EcommerceProtectedRoute component={CustomerOrders} {...params} />}
      </Route>
      <Route path="/ecommerce/painel/pedidos">
        {(params) => <EcommerceProtectedRoute component={CustomerOrders} {...params} />}
      </Route>
      <Route path="/ecommerce/painel/perfil">
        {(params) => <EcommerceProtectedRoute component={CustomerProfile} {...params} />}
      </Route>
      <Route path="/ecommerce/painel/documentos">
        {(params) => <EcommerceProtectedRoute component={CustomerDocuments} {...params} />}
      </Route>
      
      {/* Rota genérica :slug DEVE ser a ÚLTIMA */}
      <Route path="/ecommerce/:slug" component={EcommerceCategoria} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Sidebar width configuration - responsive
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  // Check if current route is an e-commerce page (public facing)
  const isEcommercePage = location.startsWith('/ecommerce');

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // E-commerce pages are full-screen without sidebar
  if (isEcommercePage) {
    return (
      <div className="flex flex-col h-screen w-full">
        <Router isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Router isAuthenticated={isAuthenticated} />
      </>
    );
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 gap-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1 md:gap-2">
              <EcommerceOrderNotifications />
              <ChatNotificationBell />
              <NotificationBell />
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router isAuthenticated={isAuthenticated} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CartProvider>
            <AppContent />
            <Toaster />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
