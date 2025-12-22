import { useState } from "react";
import { DollarSign, Loader2, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface EcommerceOrder {
  id: string;
  clientId: string;
  nomeCompleto?: string;
  razaoSocial?: string;
  email: string;
  total: number;
  etapa: string;
  createdAt: string;
}

interface NewOrdersResponse {
  orders: EcommerceOrder[];
  count: number;
}

export function EcommerceOrderNotifications() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data = { orders: [], count: 0 } as NewOrdersResponse, isLoading } =
    useQuery<NewOrdersResponse>({
      queryKey: ["/api/admin/app/notifications/new-orders"],
      refetchInterval: 5000, // Atualiza a cada 5 segundos
    });

  const markAsReadMutation = useMutation<any, Error, string | undefined>({
    mutationFn: async (orderId?: string) => {
      const endpoint = orderId
        ? `/api/admin/app/orders/${orderId}/mark-viewed`
        : `/api/admin/app/orders/mark-all-viewed`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao marcar como lido");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/notifications/new-orders"],
      });
    },
  });

  const orderCount = data.count || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getStatusLabel = (etapa: string) => {
    const labels: Record<string, string> = {
      novo_pedido: "Novo Pedido",
      aguardando_documentos: "Aguardando Docs",
      em_analise: "Em Análise",
      aprovado: "Aprovado",
      em_instalacao: "Em Instalação",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return labels[etapa] || etapa;
  };

  const handleViewOrder = (orderId: string) => {
    markAsReadMutation.mutate(orderId);
    navigate(`/admin/app-pedidos?pedido=${orderId}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-ecommerce-notifications"
        >
          <DollarSign className="h-5 w-5" />
          {orderCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-5 bg-green-600 text-white flex items-center justify-center text-xs font-semibold rounded-full shadow-md"
              data-testid="badge-order-count"
            >
              {orderCount > 99 ? "99+" : orderCount}
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
                <h3 className="font-semibold text-sm">Pedidos E-commerce</h3>
                {orderCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {orderCount} novo{orderCount > 1 ? "s" : ""} pedido
                    {orderCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              {orderCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAsReadMutation.mutate(undefined)}
                  disabled={markAsReadMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todos
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading && orderCount === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : orderCount === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Sem novos pedidos</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2 p-2">
                {data.orders?.map((order: EcommerceOrder) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-md border border-slate-200 dark:border-slate-200/20 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    data-testid={`order-notification-${order.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {order.nomeCompleto ||
                              order.razaoSocial ||
                              order.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.email}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: false,
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(order.total)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {getStatusLabel(order.etapa)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewOrder(order.id)}
                      data-testid={`button-view-order-${order.id}`}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Ver Pedido
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
