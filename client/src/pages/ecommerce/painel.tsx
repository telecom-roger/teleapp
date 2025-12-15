import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const { data, isLoading: loadingOrders } = useQuery<{ orders: any[] }>({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData,
  });
  const orders = data?.orders ?? [];

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
    novo_pedido: "bg-yellow-100 text-yellow-700",
    em_analise: "bg-indigo-100 text-indigo-700",
    aguardando_documentos: "bg-orange-100 text-orange-700",
    validando_documentos: "bg-amber-100 text-amber-700",
    contrato_enviado: "bg-blue-100 text-blue-700",
    contrato_assinado: "bg-cyan-100 text-cyan-700",
    analise_credito: "bg-violet-100 text-violet-700",
    aprovado: "bg-green-100 text-green-700",
    em_andamento: "bg-purple-100 text-purple-700",
    concluido: "bg-emerald-100 text-emerald-700",
    cancelado: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    novo_pedido: "Pedido recebido",
    em_analise: "Em análise",
    aguardando_documentos: "Aguardando documentos",
    validando_documentos: "Validando documentos",
    contrato_enviado: "Contrato enviado",
    contrato_assinado: "Contrato assinado",
    analise_credito: "Análise de crédito",
    aprovado: "Aprovado",
    em_andamento: "Em andamento",
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
      <div
        style={{
          minHeight: "100vh",
          background: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              height: "32px",
              width: "32px",
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              border: "4px solid #1E90FF",
              borderTopColor: "transparent",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: "#555555" }}>Carregando...</p>
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
    <div style={{ minHeight: "100vh", display: "flex", background: "#FAFAFA" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "#FFFFFF",
          borderRight: "1px solid #E0E0E0",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Logo/Header */}
          <div style={{ padding: "24px", borderBottom: "1px solid #E0E0E0" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1E90FF",
                marginBottom: "4px",
              }}
            >
              Minha Conta
            </h2>
            <p style={{ fontSize: "14px", color: "#555555" }}>
              {customerData.client.nome}
            </p>
          </div>

          {/* Menu */}
          <nav
            style={{
              flex: 1,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  fontWeight: 500,
                  fontSize: "15px",
                  transition: "all 0.2s ease",
                  background: item.active ? "#1E90FF" : "transparent",
                  color: item.active ? "#FFFFFF" : "#555555",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.setProperty(
                      "background",
                      "rgba(30,144,255,0.1)",
                      "important"
                    );
                    e.currentTarget.style.setProperty(
                      "color",
                      "#1E90FF",
                      "important"
                    );
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.setProperty(
                      "background",
                      "transparent",
                      "important"
                    );
                    e.currentTarget.style.setProperty(
                      "color",
                      "#555555",
                      "important"
                    );
                  }
                }}
              >
                <item.icon style={{ width: "20px", height: "20px" }} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Suporte WhatsApp */}
          <div style={{ padding: "16px", borderTop: "1px solid #E0E0E0" }}>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                fontWeight: 500,
                fontSize: "14px",
                transition: "all 0.2s ease",
                background: "transparent",
                color: "#1AD1C1",
                border: "2px solid #1AD1C1",
                borderRadius: "8px",
                cursor: "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.setProperty(
                  "background",
                  "#1AD1C1",
                  "important"
                );
                e.currentTarget.style.setProperty(
                  "color",
                  "#FFFFFF",
                  "important"
                );
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty(
                  "background",
                  "transparent",
                  "important"
                );
                e.currentTarget.style.setProperty(
                  "color",
                  "#1AD1C1",
                  "important"
                );
              }}
              onClick={() =>
                window.open("https://wa.me/5519999477404", "_blank")
              }
            >
              <MessageSquare style={{ width: "16px", height: "16px" }} />
              <span>Suporte WhatsApp</span>
            </button>
          </div>

          {/* Logout */}
          <div style={{ padding: "16px", borderTop: "1px solid #E0E0E0" }}>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                fontWeight: 500,
                fontSize: "14px",
                transition: "all 0.2s ease",
                background: "transparent",
                color: "#FF6B35",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.setProperty(
                  "background",
                  "rgba(255,107,53,0.1)",
                  "important"
                );
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty(
                  "background",
                  "transparent",
                  "important"
                );
              }}
              onClick={handleLogout}
            >
              <LogOut style={{ width: "16px", height: "16px" }} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
          className="lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1 }} className="lg:ml-64">
        {/* Top Bar (Mobile) */}
        <header
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E0E0E0",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
          className="lg:hidden"
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#1E90FF",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu style={{ width: "24px", height: "24px" }} />
          </button>
          <h1 style={{ fontWeight: 600, fontSize: "16px", color: "#111111" }}>
            Dashboard
          </h1>
          <div style={{ width: "40px" }} />
        </header>

        {/* Content */}
        <main
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Welcome */}
          <div
            style={{
              background: "linear-gradient(135deg, #1E90FF 0%, #00CFFF 100%)",
              color: "#FFFFFF",
              boxShadow: "0 8px 24px rgba(30,144,255,0.25)",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Olá, {customerData.client.nome.split(" ")[0]}! 👋
            </h1>
            <p style={{ fontSize: "16px", opacity: 0.95 }}>
              Bem-vindo ao seu painel. Aqui você pode acompanhar seus pedidos e
              gerenciar sua conta.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="p-6 transition-all duration-200"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,144,255,0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#1E90FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E0E0E0";
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm mb-2 font-medium"
                    style={{ color: "#555555" }}
                  >
                    Pedidos em Andamento
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: "#1E90FF" }}
                  >
                    {pendingOrders.length}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(30,144,255,0.15)" }}
                >
                  <Clock className="w-7 h-7" style={{ color: "#1E90FF" }} />
                </div>
              </div>
            </Card>

            <Card
              className="p-6 transition-all duration-200"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,144,255,0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#1E90FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E0E0E0";
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm mb-2 font-medium"
                    style={{ color: "#555555" }}
                  >
                    Total de Pedidos
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: "#111111" }}
                  >
                    {orders.length}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(30,144,255,0.15)" }}
                >
                  <Package className="w-7 h-7" style={{ color: "#1E90FF" }} />
                </div>
              </div>
            </Card>

            <Card
              className="p-6 transition-all duration-200"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(26,209,193,0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#1AD1C1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E0E0E0";
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm mb-2 font-medium"
                    style={{ color: "#555555" }}
                  >
                    Pedidos Concluídos
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: "#1AD1C1" }}
                  >
                    {orders.filter((o: any) => o.etapa === "concluido").length}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(26,209,193,0.15)" }}
                >
                  <CheckCircle2
                    className="w-7 h-7"
                    style={{ color: "#1AD1C1" }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Último Pedido */}
          {lastOrder && (
            <Card
              className="p-6 transition-all duration-200"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,144,255,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "#1E90FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E0E0E0";
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#111111" }}>
                  Último Pedido
                </h2>
                <Badge
                  style={{
                    background: "rgba(30,144,255,0.15)",
                    color: "#1E90FF",
                    border: "1px solid #1E90FF",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {statusLabels[lastOrder.etapa] || lastOrder.etapa}
                </Badge>
              </div>

              <div className="space-y-4">
                <div
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "#FAFAFA" }}
                >
                  <span className="font-medium" style={{ color: "#555555" }}>
                    Pedido:
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: "#111111" }}
                  >
                    #{lastOrder.id.slice(0, 8)}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "#FAFAFA" }}
                >
                  <span className="font-medium" style={{ color: "#555555" }}>
                    Data:
                  </span>
                  <span className="font-semibold" style={{ color: "#111111" }}>
                    {formatDate(lastOrder.createdAt)}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "rgba(30,144,255,0.08)" }}
                >
                  <span className="font-medium" style={{ color: "#555555" }}>
                    Total:
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "#1E90FF" }}
                  >
                    {formatPrice(lastOrder.total)}/mês
                  </span>
                </div>

                <button
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: "#1E90FF",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1E90FF";
                    e.currentTarget.style.background = "rgba(30,144,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E0E0E0";
                    e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => navigate("/ecommerce/painel/pedidos")}
                >
                  Ver Todos os Pedidos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card
            className="p-6"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: "#111111" }}>
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="flex items-center gap-3 px-5 py-4 font-medium transition-all duration-200"
                style={{
                  background: "transparent",
                  color: "#1E90FF",
                  border: "2px solid #1E90FF",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1E90FF";
                  e.currentTarget.style.color = "#FFFFFF";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(30,144,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1E90FF";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => navigate("/ecommerce/planos")}
              >
                <Package className="w-5 h-5" />
                <span>Contratar Novo Plano</span>
              </button>
              <button
                className="flex items-center gap-3 px-5 py-4 font-medium transition-all duration-200"
                style={{
                  background: "transparent",
                  color: "#1E90FF",
                  border: "2px solid #1E90FF",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1E90FF";
                  e.currentTarget.style.color = "#FFFFFF";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(30,144,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1E90FF";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => navigate("/ecommerce/painel/perfil")}
              >
                <User className="w-5 h-5" />
                <span>Editar Meu Perfil</span>
              </button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
