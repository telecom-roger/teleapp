import { useState, useEffect } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface OrderUpdate {
  id: string;
  etapa: string;
  total: number;
  updatedAt: string;
  itemsCount: number;
}

interface OrderUpdatesResponse {
  orders: OrderUpdate[];
  count: number;
}

export function CustomerOrderNotifications() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Conectar ao SSE para notificações em tempo real
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/sse");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE conectado para notificações");
          return;
        }

        // Nova notificação recebida
        if (data.tipo === "order_stage_change") {
          // Atualizar TODAS as queries relacionadas a pedidos para atualizar o dashboard em tempo real
          queryClient.invalidateQueries({
            queryKey: ["/api/ecommerce/customer/order-updates"],
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/ecommerce/customer/orders"],
          });

          // Se temos o orderId, também invalida a query específica desse pedido e documentos
          const orderId = data.orderId || data.metadata?.orderId;
          if (orderId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/ecommerce/customer/orders/${orderId}`],
            });
            // Invalida documentos do pedido caso a etapa tenha mudado para aguardando_documentos
            queryClient.invalidateQueries({
              queryKey: [`/api/ecommerce/customer/documents/${orderId}`],
            });
          }

          // Mostrar toast clicável
          toast({
            title: data.titulo,
            description: data.descricao,
            action: orderId ? (
              <button
                onClick={() => navigate(`/ecommerce/painel/pedidos/${orderId}`)}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Ver Pedido
              </button>
            ) : undefined,
          });
        }
      } catch (error) {
        console.error("Erro ao processar notificação SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Erro SSE:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, navigate, toast]);

  const { data = { orders: [], count: 0 } as OrderUpdatesResponse, isLoading } =
    useQuery<OrderUpdatesResponse>({
      queryKey: ["/api/ecommerce/customer/order-updates"],
    });

  const markAsReadMutation = useMutation<any, Error, string | undefined>({
    mutationFn: async (orderId?: string) => {
      const endpoint = orderId
        ? `/api/ecommerce/customer/orders/${orderId}/mark-viewed`
        : `/api/ecommerce/customer/orders/mark-all-viewed`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao marcar como lido");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/ecommerce/customer/order-updates"],
      });
    },
  });

  const updateCount = data.count || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getStatusLabel = (etapa: string) => {
    const labels: Record<string, string> = {
      novo_pedido: "Novo Pedido",
      aguardando_documentos: "Aguardando Documentos",
      em_analise: "Em Análise",
      aprovado: "Aprovado",
      em_instalacao: "Em Instalação",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return labels[etapa] || etapa;
  };

  const getStatusColor = (etapa: string) => {
    switch (etapa) {
      case "novo_pedido":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "aguardando_documentos":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "em_analise":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "aprovado":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "em_instalacao":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "concluido":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelado":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleViewOrder = (orderId: string) => {
    markAsReadMutation.mutate(orderId);
    navigate(`/ecommerce/painel/pedidos/${orderId}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-customer-order-notifications"
        >
          <Bell className="h-5 w-5" />
          {updateCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white flex items-center justify-center text-xs font-semibold rounded-full shadow-md"
              data-testid="badge-update-count"
            >
              {updateCount > 99 ? "99+" : updateCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="bg-background rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">
                  Atualizações de Pedidos
                </h3>
                {updateCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {updateCount} atualiza{updateCount > 1 ? "ções" : "ção"}
                  </p>
                )}
              </div>
              {updateCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAsReadMutation.mutate(undefined)}
                  disabled={markAsReadMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading && updateCount === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : updateCount === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Sem atualizações</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2 p-2">
                {data.orders?.map((order: OrderUpdate) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-md border border-slate-200 dark:border-slate-200/20 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    data-testid={`order-update-${order.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            Pedido #{order.id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.itemsCount}{" "}
                            {order.itemsCount === 1 ? "item" : "itens"}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(order.updatedAt), {
                            addSuffix: false,
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {formatCurrency(order.total)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            order.etapa
                          )}`}
                        >
                          {getStatusLabel(order.etapa)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewOrder(order.id)}
                      data-testid={`button-view-order-${order.id}`}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
