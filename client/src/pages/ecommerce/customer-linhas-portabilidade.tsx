import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  CustomerHeader,
  CustomerSidebar,
  CustomerMobileNav,
} from "@/components/ecommerce/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderLinesFill } from "@/components/ecommerce/OrderLinesFill";
import { AlertCircle, Phone, Package, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatOrderStatus } from "@/lib/order-status-utils";

export default function CustomerLinhasPortabilidade() {
  // ID do pedido selecionado
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const {
    data: customerData,
    isLoading: loadingAuth,
    isError,
  } = useQuery<{ client: any }>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery<{ orders: any[] }>({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      console.log('\n📦 [PÁGINA PORT] Pedidos recebidos:');
      console.log('   Total:', data?.orders?.length || 0);
      data?.orders?.forEach(o => {
        console.log(`   - ${o.orderCode}: tipo="${o.tipoContratacao}" etapa="${o.etapa}"`);
      });
      const port = data?.orders?.filter(o => o.tipoContratacao === "portabilidade") || [];
      console.log(`   ✅ Portabilidade: ${port.length}`);
      if (port.length === 0) {
        console.error('   ❌ NENHUM pedido de portabilidade!');
      }
    }
  });

  // Filtrar todos os pedidos de portabilidade
  const pedidosPortabilidade = ordersData?.orders?.filter(
    (order) => order.tipoContratacao === "portabilidade"
  ) || [];

  // Selecionar automaticamente o primeiro pedido aguardando dados, ou o primeiro disponível
  useEffect(() => {
    if (pedidosPortabilidade.length > 0 && !selectedOrderId) {
      // Priorizar pedido aguardando dados
      const aguardandoDados = pedidosPortabilidade.find(
        (order) => order.etapa === "aguardando_dados_linhas"
      );
      setSelectedOrderId(aguardandoDados?.id || pedidosPortabilidade[0].id);
    }
  }, [pedidosPortabilidade, selectedOrderId]);
  
  // Pedido selecionado atualmente
  const pedidoPortabilidade = pedidosPortabilidade.find(
    (order) => order.id === selectedOrderId
  );
  
  // Verifica se pode editar (aguardando_dados_linhas ou em_analise com permissão)
  const podeEditar = pedidoPortabilidade?.etapa === "aguardando_dados_linhas" || 
                     pedidoPortabilidade?.etapa === "em_analise";


  // Buscar informações do pedido se existir
  const { data: orderDetail } = useQuery<any>({
    queryKey: [`/api/ecommerce/customer/orders/${pedidoPortabilidade?.id}`],
    enabled: !!pedidoPortabilidade?.id,
  });

  // Buscar sumário de linhas
  const { data: linesSummary } = useQuery<any>({
    queryKey: [`/api/ecommerce/order-lines/${pedidoPortabilidade?.id}/summary`],
    enabled: !!pedidoPortabilidade?.id,
    refetchInterval: 5000,
  });

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="flex">
          <CustomerSidebar />
          <main className="flex-1 p-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p>Erro ao carregar informações. Faça login novamente.</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
        <CustomerMobileNav />
      </div>
    );
  }

  if (loadingAuth || loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="flex">
          <CustomerSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
        <CustomerMobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="flex">
        <CustomerSidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Linhas de Portabilidade
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-700">
                Preencha as informações de cada linha para continuar com seu pedido
              </p>
            </div>

            {/* Conteúdo */}
            {pedidosPortabilidade.length === 0 ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-16 w-16 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Nenhum pedido de portabilidade pendente
                    </h3>
                    <p className="text-blue-700 max-w-md">
                      Você não possui pedidos de portabilidade aguardando preenchimento
                      de linhas no momento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Seletor de Pedido - aparece apenas se houver mais de um */}
                {pedidosPortabilidade.length > 1 && (
                  <div className="md:static md:top-auto">
                    <div className="md:relative sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gray-50/95 backdrop-blur-sm md:bg-transparent md:px-0 md:py-0 border-b md:border-0 border-gray-200">
                      <Card className="shadow-md md:shadow-sm border md:border">
                        <CardContent className="p-3 sm:pt-6 sm:pb-4">
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-900">
                              Selecione o pedido:
                            </label>
                            <Select
                              value={selectedOrderId || ""}
                              onValueChange={setSelectedOrderId}
                            >
                              <SelectTrigger className="bg-white h-10 sm:h-11">
                                <SelectValue placeholder="Selecione um pedido" />
                              </SelectTrigger>
                              <SelectContent>
                                {pedidosPortabilidade.map((order) => (
                                  <SelectItem key={order.id} value={order.id}>
                                    Pedido #{order.orderCode} - {formatOrderStatus(order.etapa)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Info do Pedido */}
                {pedidoPortabilidade && (
                  <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg">
                          Pedido #{pedidoPortabilidade.orderCode}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                          {formatOrderStatus(pedidoPortabilidade.etapa)}
                        </Badge>
                      </div>
                    </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Total do Pedido</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          R$ {(pedidoPortabilidade.total / 100).toFixed(2)}
                        </p>
                      </div>
                      {linesSummary && (
                        <>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs sm:text-sm text-blue-600 mb-1.5">
                              Linhas Contratadas
                            </p>
                            <p className="text-base sm:text-lg font-bold text-blue-700">
                              {linesSummary.totalLinhasContratadas}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs sm:text-sm text-green-600 mb-1.5">
                              Linhas Preenchidas
                            </p>
                            <p className="text-base sm:text-lg font-bold text-green-700">
                              {linesSummary.totalLinhasPreenchidas}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {orderDetail?.items && orderDetail.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs sm:text-sm font-medium mb-2.5 text-gray-700">Itens do Pedido:</p>
                        <ul className="space-y-2">
                          {orderDetail.items.map((item: any) => (
                            <li
                              key={item.id}
                              className="text-xs sm:text-sm text-gray-700 flex justify-between gap-2 bg-gray-50 p-2 rounded"
                            >
                              <span className="flex-1 min-w-0 truncate">
                                {item.quantidade}x {item.productNome}
                              </span>
                              <span className="font-semibold whitespace-nowrap">
                                R$ {(item.subtotal / 100).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Alerta informativo */}
                {podeEditar ? (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-1">
                            Importante
                          </h3>
                          <p className="text-sm text-blue-700">
                            Para continuar com a portabilidade, precisamos que você
                            preencha as informações de cada linha contratada. Certifique-se
                            de informar os números corretos e a operadora atual de cada
                            linha.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 mb-1">
                            Dados Enviados para Análise
                          </h3>
                          <p className="text-sm text-amber-700">
                            Suas linhas já foram enviadas para análise pela nossa equipe.
                            Você não pode mais editar essas informações. Caso precise fazer
                            alguma alteração, entre em contato com nosso suporte.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Componente de preenchimento */}
                <Card>
                  <CardContent className="pt-6">
                    <OrderLinesFill orderId={pedidoPortabilidade.id} readOnly={!podeEditar} />
                  </CardContent>
                </Card>
                </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <CustomerMobileNav />
    </div>
  );
}
