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
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  Building,
  CreditCard,
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
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");

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
    queryKey: ["/api/admin/app/orders/list", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // Ignorar valores vazios e "all"
        if (value && value !== "all" && value !== "none") {
          params.append(key, value);
        }
      });
      const res = await fetch(`/api/admin/app/orders/list?${params}`);
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
        window.history.replaceState({}, "", "/admin/app-listagem");
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
      const res = await fetch(`/api/admin/app/orders/${orderId}/etapa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, observacao: obs }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/orders/list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/orders"],
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
      const res = await fetch(`/api/admin/app/orders/${orderId}/agent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId === "none" ? null : agentId }),
      });
      if (!res.ok) throw new Error("Erro ao atribuir agente");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/orders/list"],
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
            onClick={() => setShowInsertDialog(true)}
            style={{
              background: "#10B981",
              color: "#FFFFFF",
              borderRadius: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10B981";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
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
            onClick={() => (window.location.href = "/admin/app-pedidos")}
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
                                  window.location.href = `/admin/app-pedidos`;
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
                    (window.location.href = `/admin/app-pedidos?pedido=${selectedOrder.id}`)
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Documentos
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = `/admin/app-pedidos`)
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

      {/* Dialog Premium de Inserir Pedido */}
      <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Header Fixo */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Criar Novo Pedido
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Preencha os dados do cliente e produtos
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInsertDialog(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Stepper */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {[
                { num: 1, label: "Tipo" },
                { num: 2, label: "Dados" },
                { num: 3, label: "Produtos" },
                { num: 4, label: "Resumo" },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                      etapaAtual >= idx
                        ? "bg-white text-blue-600 font-bold"
                        : "bg-blue-400 text-white"
                    }`}
                  >
                    {etapaAtual > idx ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="ml-2 text-sm text-white hidden sm:inline">
                    {step.label}
                  </span>
                  {idx < 3 && (
                    <ChevronRight className="h-4 w-4 mx-2 text-blue-200" />
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Etapa 0: Tipo de Pessoa */}
            {etapaAtual === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Selecione o tipo de cliente
                  </h3>
                  <p className="text-slate-600">
                    Escolha se o pedido é para pessoa física ou jurídica
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoPessoa("PF")}
                    className={`p-8 rounded-xl border-2 transition-all hover:shadow-lg ${
                      tipoPessoa === "PF"
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <User
                      className={`h-12 w-12 mx-auto mb-4 ${
                        tipoPessoa === "PF"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    />
                    <h4 className="font-bold text-lg mb-2">Pessoa Física</h4>
                    <p className="text-sm text-slate-600">
                      CPF, nome completo
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPessoa("PJ")}
                    className={`p-8 rounded-xl border-2 transition-all hover:shadow-lg ${
                      tipoPessoa === "PJ"
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <Building
                      className={`h-12 w-12 mx-auto mb-4 ${
                        tipoPessoa === "PJ"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    />
                    <h4 className="font-bold text-lg mb-2">Pessoa Jurídica</h4>
                    <p className="text-sm text-slate-600">
                      CNPJ, razão social
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 1: Dados do Cliente */}
            {etapaAtual === 1 && (
              <form className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tipo:</strong>{" "}
                    {tipoPessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tipoPessoa === "PF" ? (
                    <>
                      <div className="sm:col-span-2">
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome Completo *
                        </Label>
                        <Input
                          placeholder="João Silva"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          CPF *
                        </Label>
                        <Input
                          placeholder="000.000.000-00"
                          required
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm:col-span-2">
                        <Label className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Razão Social *
                        </Label>
                        <Input
                          placeholder="Empresa LTDA"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          CNPJ *
                        </Label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          required
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail *
                    </Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label>Logradouro *</Label>
                      <Input placeholder="Rua, Avenida..." className="mt-1" />
                    </div>
                    <div>
                      <Label>Número *</Label>
                      <Input placeholder="123" className="mt-1" />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input placeholder="Apto 45" className="mt-1" />
                    </div>
                    <div>
                      <Label>Bairro *</Label>
                      <Input placeholder="Centro" className="mt-1" />
                    </div>
                    <div>
                      <Label>Cidade *</Label>
                      <Input placeholder="São Paulo" className="mt-1" />
                    </div>
                    <div>
                      <Label>Estado *</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CEP *</Label>
                      <Input placeholder="00000-000" className="mt-1" />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Etapa 2: Produtos */}
            {etapaAtual === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Adicionar Produtos
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Selecione os produtos para este pedido
                  </p>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">
                    Funcionalidade em desenvolvimento
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 3: Resumo */}
            {etapaAtual === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Resumo do Pedido
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Revise os dados antes de criar o pedido
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <Check className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h4 className="font-bold text-lg mb-2">Tudo pronto!</h4>
                  <p className="text-slate-600">
                    Clique em "Criar Pedido" para finalizar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Fixo */}
          <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
            <div className="flex justify-between w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (etapaAtual > 0) {
                    setEtapaAtual(etapaAtual - 1);
                  } else {
                    setShowInsertDialog(false);
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {etapaAtual === 0 ? "Cancelar" : "Voltar"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (etapaAtual < 3) {
                    setEtapaAtual(etapaAtual + 1);
                  } else {
                    toast({
                      title: "Pedido criado!",
                      description: "O pedido foi registrado com sucesso.",
                    });
                    setShowInsertDialog(false);
                    setEtapaAtual(0);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {etapaAtual === 3 ? "Criar Pedido" : "Próximo"}
                {etapaAtual < 3 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
