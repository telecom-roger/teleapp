import { useQuery } from "@tanstack/react-query";
import {
  CustomerHeader,
  CustomerSidebar,
  CustomerMobileNav,
} from "@/components/ecommerce/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag,
  FileText,
  User,
  MessageCircle,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

interface CustomerData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  client: {
    id: string;
    nome: string;
    cnpj?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  } | null;
}

interface Order {
  id: string;
  orderCode: string;
  clientId: string;
  etapa: string;
  execucaoTipo?:
    | "instalacao"
    | "entrega"
    | "ativacao_remota"
    | "provisionamento"
    | "outro";
  total: number;
  subtotal: number;
  createdAt: string;
  items?: Array<{
    id: string;
    productNome: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }>;
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();

  const {
    data: customerData,
    isLoading: loadingCustomer,
    isError,
  } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Proteção de rota - redirecionar se não autenticado
  useEffect(() => {
    if (!loadingCustomer && (isError || !customerData?.client)) {
      setLocation("/ecommerce");
    }
  }, [loadingCustomer, isError, customerData, setLocation]);

  const { data, isLoading: loadingOrders } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData?.client?.id,
    // Removido polling - agora usa SSE em tempo real via CustomerOrderNotifications
  });
  const orders = data?.orders ?? [];

  const getStatusInfo = (etapa: string, execucaoTipo?: string) => {
    switch (etapa) {
      case "novo_pedido":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          label: "Pedido recebido",
        };
      case "em_analise":
        return {
          icon: AlertCircle,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          label: "Em análise",
        };
      case "aguardando_documentos":
        return {
          icon: FileText,
          color: "text-orange-600",
          bg: "bg-orange-50",
          label: "Aguardando documentos",
        };
      case "validando_documentos":
        return {
          icon: FileText,
          color: "text-amber-600",
          bg: "bg-amber-50",
          label: "Validando documentos",
        };
      case "contrato_enviado":
        return {
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "Contrato enviado",
        };
      case "contrato_assinado":
        return {
          icon: CheckCircle2,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
          label: "Contrato assinado",
        };
      case "analise_credito":
        return {
          icon: AlertCircle,
          color: "text-violet-600",
          bg: "bg-violet-50",
          label: "Análise de crédito",
        };
      case "aprovado":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          label: "Aprovado",
        };
      case "em_andamento":
        const labels = {
          instalacao: "Instalação",
          entrega: "Entrega",
          ativacao_remota: "Ativação",
          provisionamento: "Provisionamento",
          outro: "Em andamento",
        };
        return {
          icon: Package,
          color: "text-purple-600",
          bg: "bg-purple-50",
          label: labels[execucaoTipo as keyof typeof labels] || labels.outro,
        };
      case "concluido":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          label: "Concluído",
        };
      default:
        return {
          icon: Package,
          color: "text-gray-600",
          bg: "bg-gray-50",
          label: etapa,
        };
    }
  };

  const lastOrder = orders?.[0];
  const statusInfo = lastOrder
    ? getStatusInfo(lastOrder.etapa, lastOrder.execucaoTipo)
    : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      <div className="flex">
        <CustomerSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Boas-vindas */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Olá,{" "}
                {loadingCustomer ? (
                  <Skeleton className="inline-block w-32 h-8" />
                ) : (
                  customerData?.client?.nome || "Cliente"
                )}
                !
              </h1>
              <p className="text-muted-foreground mt-1">
                Bem-vindo ao seu painel. Aqui você pode acompanhar seus pedidos
                e serviços.
              </p>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Pedidos
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {orders?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Último Pedido
                  </CardTitle>
                  {StatusIcon && (
                    <StatusIcon className={`h-4 w-4 ${statusInfo?.color}`} />
                  )}
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <Skeleton className="h-8 w-24" />
                  ) : lastOrder ? (
                    <>
                      <div className="text-2xl font-bold">
                        R$ {(lastOrder.total / 100).toFixed(2)}
                      </div>
                      <p className={`text-xs ${statusInfo?.color} mt-1`}>
                        {statusInfo?.label}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Nenhum pedido ainda
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Documentos Pendentes
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {orders?.filter(
                        (o) => o.etapa === "aguardando_documentos"
                      ).length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Serviços Ativos
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {orders?.filter((o) => o.etapa === "concluido").length ||
                        0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesse rapidamente as funcionalidades mais utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/ecommerce/planos">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-6 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Search className="h-6 w-6" />
                    <span className="text-sm font-medium">Ver Planos</span>
                  </Button>
                </Link>

                <Link href="/ecommerce/painel/pedidos">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-6"
                  >
                    <ShoppingBag className="h-6 w-6" />
                    <span className="text-sm">Meus Pedidos</span>
                  </Button>
                </Link>

                <Link href="/ecommerce/painel/documentos">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-6"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Enviar Documentos</span>
                  </Button>
                </Link>

                <Link href="/ecommerce/painel/perfil">
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-6"
                  >
                    <User className="h-6 w-6" />
                    <span className="text-sm">Meu Perfil</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Últimos Pedidos */}
            {orders && orders.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Últimos Pedidos</CardTitle>
                      <CardDescription>
                        Acompanhe o status dos seus pedidos recentes
                      </CardDescription>
                    </div>
                    <Link href="/ecommerce/painel/pedidos">
                      <Button variant="ghost" size="sm">
                        Ver todos
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => {
                      const info = getStatusInfo(
                        order.etapa,
                        order.execucaoTipo
                      );
                      const Icon = info.icon;

                      return (
                        <Link
                          key={order.id}
                          href={`/ecommerce/painel/pedidos/${order.id}`}
                        >
                          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${info.bg}`}>
                                <Icon className={`h-5 w-5 ${info.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">
                                  Pedido #{order.orderCode || order.id.slice(0, 8)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                R$ {(order.total / 100).toFixed(2)}
                              </p>
                              <p className={`text-sm ${info.color}`}>
                                {info.label}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <CustomerMobileNav />
    </div>
  );
}
