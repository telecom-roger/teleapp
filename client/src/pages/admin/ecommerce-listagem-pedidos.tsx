import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  X,
  Mail,
  MessageSquare,
  UserCheck,
  Kanban,
  RefreshCw,
  User,
  MapPin,
  Package,
  DollarSign,
  FileText,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  if (!operadora) return "bg-gray-100 text-gray-800 border-gray-200";
  const colors: Record<string, string> = {
    C: "bg-red-100 text-red-800 border-red-200",
    T: "bg-blue-100 text-blue-800 border-blue-200",
    V: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return (
    colors[operadora.toUpperCase()] ||
    "bg-gray-100 text-gray-800 border-gray-200"
  );
};

interface Order {
  id: string;
  orderCode: string;
  clientId: string;
  tipoPessoa: string;
  nomeCompleto?: string;
  razaoSocial?: string;
  cpf?: string;
  cnpj?: string;
  email: string;
  telefone: string;
  etapa: string;
  subtotal: number;
  total: number;
  taxaInstalacao: number;
  economia: number;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  agentName?: string;
  items: OrderItem[];
  // Campos de endereço
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface OrderItem {
  id: string;
  productNome: string;
  productDescricao?: string;
  productCategoria?: string;
  productOperadora?: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface Filters {
  search: string;
  dataInicio: string;
  dataFim: string;
  etapa: string;
  tipoPessoa: string;
  operadora: string;
  categoria: string;
  valorMin: string;
  valorMax: string;
  agentId: string;
}

export default function EcommerceListagemPedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    dataInicio: "",
    dataFim: "",
    etapa: "",
    tipoPessoa: "",
    operadora: "",
    categoria: "",
    valorMin: "",
    valorMax: "",
    agentId: "",
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [observacao, setObservacao] = useState("");

  // Proteção de rota - redirecionar se não autenticado ou não for admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado como administrador",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading, user, toast]);

  // Query para buscar pedidos com filtros - Atualização automática a cada 5 segundos
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/ecommerce/orders/list", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // Ignorar valores vazios e "all"
        if (value && value !== "all" && value !== "none") {
          params.append(key, value);
        }
      });
      const res = await fetch(`/api/admin/ecommerce/orders/list?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar pedidos");
      return res.json();
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    refetchOnWindowFocus: true, // Atualizar ao focar na janela
    enabled: isAuthenticated && user?.role === "admin", // Só executar se autenticado e admin
  });

  // Abrir modal de detalhes automaticamente se houver parâmetro 'pedido' na URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pedidoId = searchParams.get("pedido");

    if (pedidoId && orders.length > 0 && !showDetailsDialog) {
      const order = orders.find((o) => o.id === pedidoId);
      if (order) {
        setSelectedOrder(order);
        setShowDetailsDialog(true);
        // Limpar o parâmetro da URL sem recarregar a página
        window.history.replaceState({}, "", "/admin/ecommerce-listagem");
      }
    }
  }, [orders, showDetailsDialog]);

  // Query para buscar agentes
  const { data: agents = [] } = useQuery<Array<{ id: string; nome: string }>>({
    queryKey: ["/api/users/agents"],
    queryFn: async () => {
      const res = await fetch("/api/users/agents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      etapa,
      obs,
    }: {
      orderId: string;
      etapa: string;
      obs: string;
    }) => {
      const res = await fetch(`/api/admin/ecommerce/orders/${orderId}/etapa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, observacao: obs }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/orders/list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/orders"],
      });
      toast({ title: "Status atualizado com sucesso!" });
      setShowStatusDialog(false);
      setSelectedOrder(null);
      setObservacao("");
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const assignAgentMutation = useMutation({
    mutationFn: async ({
      orderId,
      agentId,
    }: {
      orderId: string;
      agentId: string;
    }) => {
      const res = await fetch(`/api/admin/ecommerce/orders/${orderId}/agent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId === "none" ? null : agentId }),
      });
      if (!res.ok) throw new Error("Erro ao atribuir agente");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/orders/list"],
      });
      toast({ title: "Agente atribuído com sucesso!" });
      setShowAgentDialog(false);
      setSelectedOrder(null);
    },
    onError: () => {
      toast({ title: "Erro ao atribuir agente", variant: "destructive" });
    },
  });

  const getEtapaInfo = (etapa: string) => {
    const etapas: Record<
      string,
      { label: string; color: string; variant: any }
    > = {
      novo_pedido: {
        label: "Novo Pedido",
        color: "bg-yellow-100 text-yellow-800",
        variant: "secondary",
      },
      aguardando_documentos: {
        label: "Aguardando Docs",
        color: "bg-orange-100 text-orange-800",
        variant: "warning",
      },
      em_analise: {
        label: "Em Análise",
        color: "bg-blue-100 text-blue-800",
        variant: "default",
      },
      aprovado: {
        label: "Aprovado",
        color: "bg-green-100 text-green-800",
        variant: "success",
      },
      em_instalacao: {
        label: "Em Instalação",
        color: "bg-purple-100 text-purple-800",
        variant: "default",
      },
      concluido: {
        label: "Concluído",
        color: "bg-green-100 text-green-800",
        variant: "success",
      },
      cancelado: {
        label: "Cancelado",
        color: "bg-red-100 text-red-800",
        variant: "destructive",
      },
    };
    return (
      etapas[etapa] || {
        label: etapa,
        color: "bg-gray-100 text-gray-800",
        variant: "secondary",
      }
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      dataInicio: "",
      dataFim: "",
      etapa: "",
      tipoPessoa: "",
      operadora: "",
      categoria: "",
      valorMin: "",
      valorMax: "",
      agentId: "",
    });
  };

  const handleExportCSV = () => {
    // TODO: Implementar exportação CSV
    toast({
      title: "Exportando CSV...",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
            Listagem de Pedidos E-commerce
          </h1>
          <p style={{ color: "#555555" }}>
            Gerenciar, filtrar e auditar todos os pedidos do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            style={{
              borderColor: "#E0E0E0",
              color: "#555555",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1E90FF";
              e.currentTarget.style.color = "#1E90FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E0E0E0";
              e.currentTarget.style.color = "#555555";
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => (window.location.href = "/admin/ecommerce-pedidos")}
            style={{
              background: "#1E90FF",
              color: "#FFFFFF",
              borderRadius: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00CFFF";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1E90FF";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Kanban className="h-4 w-4 mr-2" />
            Ver Kanban
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card
        style={{
          background: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: "#111111" }}
          >
            <Filter className="h-5 w-5" style={{ color: "#1E90FF" }} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Busca (Cliente/CPF/CNPJ)</Label>
              <Input
                placeholder="Digite para buscar..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) =>
                  setFilters({ ...filters, dataInicio: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) =>
                  setFilters({ ...filters, dataFim: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Etapa</Label>
              <Select
                value={filters.etapa}
                onValueChange={(value) =>
                  setFilters({ ...filters, etapa: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="novo_pedido">Novo Pedido</SelectItem>
                  <SelectItem value="aguardando_documentos">
                    Aguardando Docs
                  </SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_instalacao">Em Instalação</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo Pessoa</Label>
              <Select
                value={filters.tipoPessoa}
                onValueChange={(value) =>
                  setFilters({ ...filters, tipoPessoa: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Operadora</Label>
              <Select
                value={filters.operadora}
                onValueChange={(value) =>
                  setFilters({ ...filters, operadora: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Vivo">Vivo</SelectItem>
                  <SelectItem value="Claro">Claro</SelectItem>
                  <SelectItem value="TIM">TIM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={filters.categoria}
                onValueChange={(value) =>
                  setFilters({ ...filters, categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Fibra">Fibra</SelectItem>
                  <SelectItem value="Móvel">Móvel</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="Combos">Combos</SelectItem>
                  <SelectItem value="Empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agente</Label>
              <Select
                value={filters.agentId}
                onValueChange={(value) =>
                  setFilters({ ...filters, agentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor Mínimo (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.valorMin}
                onChange={(e) =>
                  setFilters({ ...filters, valorMin: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Valor Máximo (R$)</Label>
              <Input
                type="number"
                placeholder="9999.99"
                value={filters.valorMax}
                onChange={(e) =>
                  setFilters({ ...filters, valorMax: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Planos</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const etapaInfo = getEtapaInfo(order.etapa);
                    const nomeCliente =
                      order.tipoPessoa === "PJ"
                        ? order.razaoSocial
                        : order.nomeCompleto;
                    const documento =
                      order.tipoPessoa === "PJ" ? order.cnpj : order.cpf;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.orderCode}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {nomeCliente || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {documento || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.tipoPessoa}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate">
                            {order.items.map((i) => i.productNome).join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {(order.total / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={etapaInfo.variant}
                            className={etapaInfo.color}
                          >
                            {etapaInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.agentName || (
                            <span className="text-muted-foreground text-xs">
                              Não atribuído
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/admin/ecommerce-pedidos`;
                                }}
                              >
                                <Kanban className="h-4 w-4 mr-2" />
                                Abrir no Kanban
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(order.etapa);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewAgentId(order.agentId || "");
                                  setShowAgentDialog(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Atribuir Agente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar E-mail
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Enviar WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus("cancelado");
                                  setObservacao(
                                    "Pedido cancelado pelo administrador"
                                  );
                                  setShowStatusDialog(true);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Pedido
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes Completo */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Pedido #{selectedOrder?.orderCode}</span>
              {selectedOrder && (
                <Badge
                  variant={getEtapaInfo(selectedOrder.etapa).variant}
                  className={getEtapaInfo(selectedOrder.etapa).color}
                >
                  {getEtapaInfo(selectedOrder.etapa).label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Realizado em{" "}
              {selectedOrder &&
                new Date(selectedOrder.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Nome/Razão Social
                    </Label>
                    <p className="font-medium">
                      {selectedOrder.tipoPessoa === "PJ"
                        ? selectedOrder.razaoSocial
                        : selectedOrder.nomeCompleto}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Tipo
                    </Label>
                    <p className="font-medium">
                      <Badge variant="outline">
                        {selectedOrder.tipoPessoa}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {selectedOrder.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}
                    </Label>
                    <p className="font-mono text-sm">
                      {selectedOrder.tipoPessoa === "PJ"
                        ? selectedOrder.cnpj
                        : selectedOrder.cpf}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      E-mail
                    </Label>
                    <p className="text-sm">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Telefone
                    </Label>
                    <p className="font-medium">{selectedOrder.telefone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Responsável
                    </Label>
                    <p className="font-medium">
                      {selectedOrder.agentName || "Não atribuído"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {(selectedOrder.endereco ||
                selectedOrder.numero ||
                selectedOrder.bairro ||
                selectedOrder.cidade ||
                selectedOrder.estado ||
                selectedOrder.cep) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Instalação
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedOrder.endereco && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Logradouro
                        </Label>
                        <p>
                          {selectedOrder.endereco}, {selectedOrder.numero}
                        </p>
                      </div>
                    )}
                    {selectedOrder.complemento && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Complemento
                        </Label>
                        <p>{selectedOrder.complemento}</p>
                      </div>
                    )}
                    {selectedOrder.bairro && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Bairro
                        </Label>
                        <p>{selectedOrder.bairro}</p>
                      </div>
                    )}
                    {selectedOrder.cidade && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Cidade
                        </Label>
                        <p>
                          {selectedOrder.cidade} - {selectedOrder.estado}
                        </p>
                      </div>
                    )}
                    {selectedOrder.cep && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          CEP
                        </Label>
                        <p>{selectedOrder.cep}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itens do Pedido */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Planos Contratados ({selectedOrder.items.length}{" "}
                  {selectedOrder.items.length === 1 ? "item" : "itens"})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="border-2 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Cabeçalho do Item */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={`text-xs font-semibold border ${getOperadoraColor(
                                  item.productOperadora
                                )}`}
                              >
                                {mapOperadora(item.productOperadora)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.productCategoria || "Categoria"}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">
                              {item.productNome}
                            </h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">
                            Subtotal
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            R$ {(item.subtotal / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Descrição do Produto */}
                      {item.productDescricao && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {item.productDescricao}
                          </p>
                        </div>
                      )}

                      {/* Detalhes do Item */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Quantidade
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {item.quantidade}x
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Preço Unitário
                          </span>
                          <span className="text-lg font-semibold text-slate-700">
                            R$ {(item.precoUnitario / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Operadora
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {mapOperadora(item.productOperadora)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">
                            Categoria
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {item.productCategoria || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Cálculo Visual */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-end gap-2 text-sm text-muted-foreground">
                        <span>
                          {item.quantidade} × R${" "}
                          {(item.precoUnitario / 100).toFixed(2)}
                        </span>
                        <span>=</span>
                        <span className="font-bold text-primary text-base">
                          R$ {(item.subtotal / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo de Categorias */}
                <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    Resumo por Categoria:
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(
                      selectedOrder.items.reduce((acc, item) => {
                        const cat = item.productCategoria || "Não especificado";
                        acc[cat] = (acc[cat] || 0) + item.quantidade;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([categoria, quantidade]) => (
                      <div
                        key={categoria}
                        className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border"
                      >
                        <Badge variant="outline" className="text-xs">
                          {categoria}
                        </Badge>
                        <span className="font-bold text-sm">{quantidade}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal dos Planos
                    </span>
                    <span className="font-medium">
                      R$ {(selectedOrder.subtotal / 100).toFixed(2)}
                    </span>
                  </div>
                  {selectedOrder.economia > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium">Desconto/Economia</span>
                      <span className="font-bold">
                        -R$ {(selectedOrder.economia / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedOrder.taxaInstalacao > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Taxa de Instalação
                      </span>
                      <span className="font-medium">
                        R$ {(selectedOrder.taxaInstalacao / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                    <span>Valor Total</span>
                    <span className="text-primary">
                      R$ {(selectedOrder.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.observacoes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </h3>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedOrder.observacoes}
                  </p>
                </div>
              )}

              {/* Ações Rápidas */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setSelectedOrder(selectedOrder);
                    setNewStatus(selectedOrder.etapa);
                    setShowStatusDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Alterar Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setSelectedOrder(selectedOrder);
                    setNewAgentId(selectedOrder.agentId || "");
                    setShowAgentDialog(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Atribuir Agente
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = `/admin/ecommerce-pedidos?pedido=${selectedOrder.id}`)
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Documentos
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = `/admin/ecommerce-pedidos`)
                  }
                >
                  <Kanban className="h-4 w-4 mr-2" />
                  Ver no Kanban
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterar Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status do Pedido</DialogTitle>
            <DialogDescription>
              Pedido: {selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Etapa</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo_pedido">Novo Pedido</SelectItem>
                  <SelectItem value="aguardando_documentos">
                    Aguardando Documentos
                  </SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_instalacao">Em Instalação</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Adicione uma observação sobre esta mudança..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  updateStatusMutation.mutate({
                    orderId: selectedOrder.id,
                    etapa: newStatus,
                    obs: observacao,
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atribuir Agente */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Agente ao Pedido</DialogTitle>
            <DialogDescription>
              Pedido: {selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione o Agente</Label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum agente</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  assignAgentMutation.mutate({
                    orderId: selectedOrder.id,
                    agentId: newAgentId,
                  });
                }
              }}
              disabled={assignAgentMutation.isPending}
            >
              {assignAgentMutation.isPending ? "Salvando..." : "Atribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
