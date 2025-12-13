import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  FileText,
  User,
  LogOut,
  Menu,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function EcommercePainel() {
  const [_, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar dados do cliente
  const {
    data: customerData,
    isLoading: loadingCustomer,
    isError,
  } = useQuery({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Buscar pedidos
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ecommerce/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao fazer logout");
      return res.json();
    },
    onSuccess: () => {
      // Limpar todas as queries do cache
      queryClient.clear();
      navigate("/ecommerce/login");
    },
  });

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      logoutMutation.mutate();
    }
  };

  const statusColors: Record<string, string> = {
    novo_pedido: "bg-blue-100 text-blue-700",
    dados_recebidos: "bg-cyan-100 text-cyan-700",
    aguardando_documentos: "bg-yellow-100 text-yellow-700",
    em_analise: "bg-orange-100 text-orange-700",
    pronto_contrato: "bg-purple-100 text-purple-700",
    contrato_enviado: "bg-indigo-100 text-indigo-700",
    instalando: "bg-blue-100 text-blue-700",
    concluido: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    novo_pedido: "Novo Pedido",
    dados_recebidos: "Dados Recebidos",
    aguardando_documentos: "Aguardando Documentos",
    em_analise: "Em Análise",
    pronto_contrato: "Pronto para Contrato",
    contrato_enviado: "Contrato Enviado",
    instalando: "Instalando",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const menuItems = [
    {
      icon: Package,
      label: "Dashboard",
      path: "/ecommerce/painel",
      active: true,
    },
    {
      icon: FileText,
      label: "Meus Pedidos",
      path: "/ecommerce/painel/pedidos",
    },
    { icon: User, label: "Meu Perfil", path: "/ecommerce/painel/perfil" },
  ];

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!customerData || isError) {
    navigate("/ecommerce/login");
    return null;
  }

  const pendingOrders = orders.filter(
    (o: any) => !["concluido", "cancelado"].includes(o.etapa)
  );

  const lastOrder = orders[0];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary">Minha Conta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {customerData.client.nome}
            </p>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Suporte WhatsApp */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                window.open("https://wa.me/5519999477404", "_blank")
              }
            >
              <MessageSquare className="w-4 h-4" />
              Suporte WhatsApp
            </Button>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="font-semibold">Dashboard</h1>
          <div className="w-10" />
        </header>

        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">
              Olá, {customerData.client.nome.split(" ")[0]}! 👋
            </h1>
            <p className="text-white/90">
              Bem-vindo ao seu painel. Aqui você pode acompanhar seus pedidos e
              gerenciar sua conta.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pedidos em Andamento
                  </p>
                  <p className="text-3xl font-bold">{pendingOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total de Pedidos
                  </p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pedidos Concluídos
                  </p>
                  <p className="text-3xl font-bold">
                    {orders.filter((o: any) => o.etapa === "concluido").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Último Pedido */}
          {lastOrder && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Último Pedido</h2>
                <Badge
                  className={statusColors[lastOrder.etapa] || "bg-gray-100"}
                >
                  {statusLabels[lastOrder.etapa] || lastOrder.etapa}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pedido:</span>
                  <span className="font-mono">#{lastOrder.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{formatDate(lastOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">
                    {formatPrice(lastOrder.total)}/mês
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate("/ecommerce/painel/pedidos")}
                >
                  Ver Todos os Pedidos
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate("/ecommerce/planos")}
              >
                <Package className="w-4 h-4" />
                Contratar Novo Plano
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate("/ecommerce/painel/perfil")}
              >
                <User className="w-4 h-4" />
                Editar Meu Perfil
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
