import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper para mapear operadoras
const mapOperadora = (operadora: string | undefined): string => {
  if (!operadora) return "N/A";
  const map: Record<string, string> = {
    C: "CLARO",
    T: "TIM",
    V: "VIVO",
  };
  return map[operadora.toUpperCase()] || operadora;
};

// Helper para obter cores das operadoras
const getOperadoraColor = (operadora: string | undefined): string => {
  if (!operadora) return "text-gray-600";
  const colors: Record<string, string> = {
    C: "text-red-600",
    T: "text-blue-600",
    V: "text-purple-600",
  };
  return colors[operadora.toUpperCase()] || "text-gray-600";
};

interface Order {
  id: number;
  tipoPessoa: "PF" | "PJ";
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  status: string;
  createdAt: string;
  items?: Array<{
    id: number;
    quantidade: number;
    linhasAdicionais: number;
    productNome: string;
    productVelocidade: string;
    productOperadora: string;
    preco: number;
  }>;
}

interface Stage {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

export default function AdminKanban() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: stages = [] } = useQuery<Stage[]>({
    queryKey: ["/api/admin/app/stages"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/app/orders"],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    refetchOnWindowFocus: true, // Atualizar ao focar na janela
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      const response = await fetch(`/api/app/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app/orders"] });
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso",
      });
    },
  });

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  const formatData = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getOrdersByStage = (stageName: string) => {
    return orders.filter((order) => order.status === stageName);
  };

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
            Kanban E-commerce
          </h1>
          <p style={{ color: "#555555" }}>Gerencie seus pedidos visualmente</p>
        </div>
        <Badge
          variant="outline"
          className="text-lg px-3 py-1"
          style={{
            background: "rgba(30,144,255,0.1)",
            color: "#1E90FF",
            border: "1px solid #1E90FF",
            borderRadius: "6px",
          }}
        >
          {orders.length} pedidos
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageOrders = getOrdersByStage(stage.nome);

          return (
            <div key={stage.id} className="flex flex-col">
              <div
                className="p-3 rounded-t-lg text-white font-semibold flex justify-between items-center"
                style={{ backgroundColor: stage.cor }}
              >
                <span>{stage.nome}</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {stageOrders.length}
                </Badge>
              </div>

              <div
                className="p-2 space-y-2 rounded-b-lg min-h-[400px]"
                style={{ background: "#FAFAFA" }}
              >
                {stageOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer transition-shadow"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E0E0E0",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.05)";
                    }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: "#111111" }}
                        >
                          #{order.id}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            background: "rgba(30,144,255,0.1)",
                            color: "#1E90FF",
                            border: "1px solid #1E90FF",
                            borderRadius: "4px",
                          }}
                        >
                          {order.tipoPessoa}
                        </Badge>
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "#111111" }}
                      >
                        {order.nome}
                      </p>
                      <p className="text-xs mb-2" style={{ color: "#555555" }}>
                        {order.email}
                      </p>
                      <div
                        className="flex items-center text-xs"
                        style={{ color: "#555555" }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatData(order.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog de detalhes do pedido */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">Nome:</span>
                      <p className="font-semibold">{selectedOrder.nome}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Tipo:</span>
                      <Badge className="ml-2">{selectedOrder.tipoPessoa}</Badge>
                    </div>
                    <div>
                      <span className="text-slate-600">Documento:</span>
                      <p className="font-semibold">{selectedOrder.documento}</p>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-slate-600" />
                      <span className="text-xs">{selectedOrder.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-slate-600" />
                      <span className="text-xs">{selectedOrder.telefone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-semibold">
                      {selectedOrder.logradouro}, {selectedOrder.numero}
                    </p>
                    {selectedOrder.complemento && (
                      <p>{selectedOrder.complemento}</p>
                    )}
                    <p>{selectedOrder.bairro}</p>
                    <p>
                      {selectedOrder.cidade} - {selectedOrder.estado}
                    </p>
                    <p>CEP: {selectedOrder.cep}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start border-b pb-2"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {item.productNome}
                            </p>
                            <p
                              className={`text-xs font-medium ${getOperadoraColor(
                                item.productOperadora
                              )}`}
                            >
                              {item.productVelocidade} •{" "}
                              {mapOperadora(item.productOperadora)}
                            </p>
                            <p className="text-xs text-slate-600">
                              Quantidade: {item.quantidade}
                              {item.linhasAdicionais > 0 &&
                                ` (+${item.linhasAdicionais} linhas)`}
                            </p>
                          </div>
                          <div className="font-bold text-sm">
                            {formatPreco(item.preco * item.quantidade)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Nenhum produto encontrado
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alterar Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: value,
                      });
                      setSelectedOrder({ ...selectedOrder, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.nome}>
                          {stage.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {updateStatusMutation.isPending && (
                    <div className="flex items-center mt-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
