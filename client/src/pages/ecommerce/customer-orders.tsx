import { useQuery } from "@tanstack/react-query";
import { CustomerHeader, CustomerSidebar, CustomerMobileNav } from "@/components/ecommerce/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

interface Order {
  id: string;
  clientId: string;
  etapa: string;
  total: number;
  subtotal: number;
  taxaInstalacao: number;
  economia: number;
  observacoes: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productNome: string;
  productDescricao: string | null;
  quantidade: number;
  linhasAdicionais: number;
  precoUnitario: number;
  valorPorLinhaAdicional: number;
  subtotal: number;
}

export default function CustomerOrders() {
  const params = useParams();
  const orderId = params.orderId as string | undefined;
  const [, setLocation] = useLocation();

  const { data: customerData, isLoading: loadingAuth, isError } = useQuery({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Proteção de rota
  useEffect(() => {
    if (!loadingAuth && (isError || !customerData?.client)) {
      setLocation("/ecommerce");
    }
  }, [loadingAuth, isError, customerData, setLocation]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData?.client,
    refetchInterval: 5000, // Atualizar a cada 5 segundos para pegar novos pedidos
    refetchOnWindowFocus: true,
    // Atualização em tempo real via SSE
  });

  const { data: orderDetail, isLoading: loadingDetail } = useQuery<Order>({
    queryKey: [`/api/ecommerce/customer/orders/${orderId}`],
    enabled: !!orderId,
    // Atualização em tempo real via SSE
  });

  const getStatusInfo = (etapa: string) => {
    switch (etapa) {
      case "novo_pedido":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          badge: "secondary",
          label: "Novo Pedido",
        };
      case "aguardando_documentos":
        return {
          icon: FileText,
          color: "text-orange-600",
          bg: "bg-orange-50",
          badge: "warning",
          label: "Aguardando Documentos",
        };
      case "em_analise":
        return {
          icon: AlertCircle,
          color: "text-blue-600",
          bg: "bg-blue-50",
          badge: "default",
          label: "Em Análise",
        };
      case "aprovado":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          badge: "success",
          label: "Aprovado",
        };
      case "em_instalacao":
        return {
          icon: Package,
          color: "text-purple-600",
          bg: "bg-purple-50",
          badge: "default",
          label: "Em Instalação",
        };
      case "concluido":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          badge: "success",
          label: "Concluído",
        };
      case "cancelado":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          badge: "destructive",
          label: "Cancelado",
        };
      default:
        return {
          icon: Package,
          color: "text-gray-600",
          bg: "bg-gray-50",
          badge: "secondary",
          label: etapa,
        };
    }
  };

  // Visualização detalhada do pedido
  if (orderId) {
    const statusInfo = orderDetail ? getStatusInfo(orderDetail.etapa) : null;
    const StatusIcon = statusInfo?.icon;

    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        
        <div className="flex">
          <CustomerSidebar />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Link href="/ecommerce/painel/pedidos">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold">Detalhes do Pedido</h1>
              </div>

              {loadingDetail ? (
                <Card>
                  <CardContent className="p-8">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ) : orderDetail ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Pedido #{orderDetail.id.slice(0, 8)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Realizado em {new Date(orderDetail.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        {StatusIcon && (
                          <Badge variant={statusInfo?.badge as any} className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo?.label}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Data</p>
                            <p className="font-medium">
                              {new Date(orderDetail.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Valor Total</p>
                            <p className="font-medium text-lg">
                              R$ {(orderDetail.total / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Itens</p>
                            <p className="font-medium">{orderDetail.items.length}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Itens do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderDetail.items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{item.productNome}</h3>
                                {item.productDescricao && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.productDescricao}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">
                                R$ {(item.subtotal / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>Quantidade: {item.quantidade}</span>
                              {item.linhasAdicionais > 0 && (
                                <span>Linhas Adicionais: {item.linhasAdicionais}</span>
                              )}
                              <span>Preço Unitário: R$ {(item.precoUnitario / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t mt-6 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>R$ {(orderDetail.subtotal / 100).toFixed(2)}</span>
                        </div>
                        {orderDetail.economia > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Economia</span>
                            <span>-R$ {(orderDetail.economia / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {orderDetail.taxaInstalacao > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxa de Instalação</span>
                            <span>R$ {(orderDetail.taxaInstalacao / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total</span>
                          <span>R$ {(orderDetail.total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {orderDetail.etapa === "aguardando_documentos" && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="flex items-start gap-4 p-6">
                        <FileText className="h-6 w-6 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-900">
                            Documentos Pendentes
                          </h3>
                          <p className="text-sm text-orange-700 mt-1">
                            Por favor, envie os documentos necessários para dar continuidade ao seu pedido.
                          </p>
                          <Link href="/ecommerce/painel/documentos">
                            <Button variant="outline" size="sm" className="mt-3">
                              Enviar Documentos
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Pedido não encontrado
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

  // Lista de pedidos
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      
      <div className="flex">
        <CustomerSidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Meus Pedidos</h1>

            {isLoading ? (
              <Card>
                <CardContent className="p-8">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.etapa);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Link key={order.id} href={`/ecommerce/painel/pedidos/${order.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-3 rounded-lg ${statusInfo.bg}`}>
                                <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-semibold">
                                    Pedido #{order.id.slice(0, 8)}
                                  </h3>
                                  <Badge variant={statusInfo.badge as any}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                R$ {(order.total / 100).toFixed(2)}
                              </p>
                              <Button variant="ghost" size="sm" className="mt-2">
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Nenhum pedido encontrado
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Você ainda não realizou nenhum pedido.
                  </p>
                  <Link href="/ecommerce/planos">
                    <Button>Ver Planos Disponíveis</Button>
                  </Link>
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
