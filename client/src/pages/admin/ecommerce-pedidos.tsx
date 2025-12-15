import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  Edit,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EcommerceOrder {
  id: string;
  clientId: string;
  tipoPessoa: string;
  nomeCompleto?: string;
  razaoSocial?: string;
  email: string;
  telefone: string;
  etapa: string;
  subtotal: number;
  total: number;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  responsavelId?: string;
  client?: {
    id: string;
    nome: string;
    email: string;
    celular: string;
  };
  items?: Array<{
    id: string;
    productNome: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }>;
  itemsCount?: number;
}

interface EcommerceStats {
  porEtapa: Array<{
    etapa: string;
    count: number;
    total: number;
  }>;
  totalPedidos: number;
  pedidosHoje: number;
  totalReceita: number;
}

const etapas = [
  {
    value: "novo_pedido",
    label: "Novo Pedido",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    value: "aguardando_documentos",
    label: "Aguardando Docs",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    value: "em_analise",
    label: "Em Análise",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "aprovado",
    label: "Aprovado",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    value: "em_instalacao",
    label: "Em Instalação",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    value: "concluido",
    label: "Concluído",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-300",
  },
];

const getEtapaIcon = (etapa: string) => {
  switch (etapa) {
    case "novo_pedido":
      return Clock;
    case "aguardando_documentos":
      return FileText;
    case "em_analise":
      return AlertCircle;
    case "aprovado":
      return CheckCircle2;
    case "em_instalacao":
      return Package;
    case "concluido":
      return CheckCircle2;
    default:
      return Package;
  }
};

export default function AdminEcommercePedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [draggedOrder, setDraggedOrder] = useState<{
    id: string;
    fromEtapa: string;
  } | null>(null);
  const [dragOverEtapa, setDragOverEtapa] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todos");
  const [filtroTipoPessoa, setFiltroTipoPessoa] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const { data: stats } = useQuery<EcommerceStats>({
    queryKey: ["/api/admin/ecommerce/stats"],
  });

  const { data: orders } = useQuery<EcommerceOrder[]>({
    queryKey: ["/api/admin/ecommerce/orders"],
  });

  // Check URL for pedido parameter to auto-open order details
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedido");
    if (pedidoId && orders) {
      const order = orders.find((o) => o.id === pedidoId);
      if (order) {
        setSelectedOrder(order);
        setDetailsOpen(true);
        // Remove parameter from URL without reloading
        window.history.replaceState({}, "", "/admin/ecommerce-pedidos");
      }
    }
  }, [orders]);

  const { data: orderDetails } = useQuery<EcommerceOrder>({
    queryKey: [`/api/admin/ecommerce/orders/${selectedOrder?.id}`],
    enabled: !!selectedOrder,
  });

  const updateEtapaMutation = useMutation({
    mutationFn: async ({
      orderId,
      etapa,
      observacoes,
    }: {
      orderId: string;
      etapa: string;
      observacoes?: string;
    }) => {
      const res = await fetch(`/api/admin/ecommerce/orders/${orderId}/etapa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, observacoes }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar etapa");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/stats"],
      });
      if (selectedOrder) {
        queryClient.invalidateQueries({
          queryKey: [`/api/admin/ecommerce/orders/${selectedOrder.id}`],
        });
      }
      toast({
        title: "Etapa atualizada",
        description: "A etapa do pedido foi atualizada com sucesso",
      });
      setNovaEtapa("");
      setObservacoes("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a etapa",
        variant: "destructive",
      });
    },
  });

  // Pedidos filtrados
  const pedidosFiltrados = useMemo(() => {
    let resultado = orders || [];

    // Busca
    if (busca) {
      resultado = resultado.filter(
        (p) =>
          p.nomeCompleto?.toLowerCase().includes(busca.toLowerCase()) ||
          p.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
          p.email.toLowerCase().includes(busca.toLowerCase()) ||
          p.telefone.includes(busca) ||
          p.id.includes(busca)
      );
    }

    // Filtro por etapa
    if (filtroEtapa !== "todos") {
      resultado = resultado.filter((p) => p.etapa === filtroEtapa);
    }

    // Filtro por tipo pessoa
    if (filtroTipoPessoa !== "todos") {
      resultado = resultado.filter((p) => p.tipoPessoa === filtroTipoPessoa);
    }

    // Filtro por período
    if (filtroPeriodo !== "todos") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      resultado = resultado.filter((p) => {
        const dataPedido = new Date(p.createdAt);
        dataPedido.setHours(0, 0, 0, 0);

        if (filtroPeriodo === "hoje") {
          return dataPedido.getTime() === hoje.getTime();
        } else if (filtroPeriodo === "semana") {
          const umaSemanaAtras = new Date(hoje);
          umaSemanaAtras.setDate(hoje.getDate() - 7);
          return dataPedido >= umaSemanaAtras;
        } else if (filtroPeriodo === "mes") {
          const umMesAtras = new Date(hoje);
          umMesAtras.setMonth(hoje.getMonth() - 1);
          return dataPedido >= umMesAtras;
        }
        return true;
      });
    }

    return resultado.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, busca, filtroEtapa, filtroTipoPessoa, filtroPeriodo]);

  // Agrupar pedidos filtrados por etapa
  const groupedOrders = useMemo(() => {
    return etapas.reduce((acc, etapa) => {
      acc[etapa.value] = pedidosFiltrados.filter(
        (o) => o.etapa === etapa.value
      );
      return acc;
    }, {} as Record<string, EcommerceOrder[]>);
  }, [pedidosFiltrados]);

  // Paginação
  const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indexInicio, indexFim);
  const resetPagina = () => setPaginaAtual(1);

  const handleOrderClick = (order: EcommerceOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleUpdateEtapa = () => {
    if (!selectedOrder || !novaEtapa) return;
    updateEtapaMutation.mutate({
      orderId: selectedOrder.id,
      etapa: novaEtapa,
      observacoes,
    });
  };

  const handleDragStart = (orderId: string, fromEtapa: string) => {
    setDraggedOrder({ id: orderId, fromEtapa });
  };

  const handleDragOver = (e: React.DragEvent, etapa: string) => {
    e.preventDefault();
    setDragOverEtapa(etapa);
  };

  const handleDragLeave = () => {
    setDragOverEtapa(null);
  };

  const handleDrop = (toEtapa: string) => {
    if (!draggedOrder) return;

    const order = orders?.find((o) => o.id === draggedOrder.id);
    if (!order || draggedOrder.fromEtapa === toEtapa) {
      setDraggedOrder(null);
      setDragOverEtapa(null);
      return;
    }

    const fromEtapaLabel = etapas.find(
      (e) => e.value === draggedOrder.fromEtapa
    )?.label;
    const toEtapaLabel = etapas.find((e) => e.value === toEtapa)?.label;

    updateEtapaMutation.mutate({
      orderId: draggedOrder.id,
      etapa: toEtapa,
      observacoes: `Movido de "${fromEtapaLabel}" para "${toEtapaLabel}" via drag & drop`,
    });

    setDraggedOrder(null);
    setDragOverEtapa(null);
  };

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
          Pedidos E-commerce
        </h1>
        <p style={{ color: "#555555" }}>
          Gerencie os pedidos recebidos através do site
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium"
              style={{ color: "#555555" }}
            >
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4" style={{ color: "#1E90FF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#111111" }}>
              {stats?.totalPedidos || 0}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium"
              style={{ color: "#555555" }}
            >
              Pedidos Hoje
            </CardTitle>
            <Clock className="h-4 w-4" style={{ color: "#1E90FF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#111111" }}>
              {stats?.pedidosHoje || 0}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium"
              style={{ color: "#555555" }}
            >
              Receita Total
            </CardTitle>
            <Package className="h-4 w-4" style={{ color: "#1AD1C1" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#111111" }}>
              R$ {((stats?.totalReceita || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium"
              style={{ color: "#555555" }}
            >
              Aguardando Docs
            </CardTitle>
            <FileText className="h-4 w-4" style={{ color: "#FF6B35" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#111111" }}>
              {stats?.porEtapa.find((e) => e.etapa === "aguardando_documentos")
                ?.count || 0}
            </div>
          </CardContent>
        </Card>
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
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" style={{ color: "#1E90FF" }} />
            <h3 className="font-semibold" style={{ color: "#111111" }}>
              Filtros
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, email, telefone..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    resetPagina();
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Select
                value={filtroEtapa}
                onValueChange={(v) => {
                  setFiltroEtapa(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Etapas</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.value} value={etapa.value}>
                      {etapa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filtroTipoPessoa}
                onValueChange={(v) => {
                  setFiltroTipoPessoa(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filtroPeriodo}
                onValueChange={(v) => {
                  setFiltroPeriodo(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold">{pedidosFiltrados.length}</span>{" "}
              de <span className="font-semibold">{orders?.length || 0}</span>{" "}
              pedidos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Kanban / Tabela */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban">
            <Package className="h-4 w-4 mr-2" />
            Visualização Kanban
          </TabsTrigger>
          <TabsTrigger value="table">
            <Eye className="h-4 w-4 mr-2" />
            Visualização Tabela
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {etapas.map((etapa) => {
              const Icon = getEtapaIcon(etapa.value);
              const ordersInEtapa = groupedOrders[etapa.value] || [];

              return (
                <Card
                  key={etapa.value}
                  className={`flex-shrink-0 w-80 transition-all ${
                    dragOverEtapa === etapa.value
                      ? "ring-2 ring-blue-500 bg-blue-50/50"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-sm">{etapa.label}</CardTitle>
                      </div>
                      <Badge variant="secondary">{ordersInEtapa.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent
                    className={`space-y-2 min-h-[200px] ${
                      dragOverEtapa === etapa.value
                        ? "bg-blue-50/30 border-2 border-dashed border-blue-400 rounded-lg"
                        : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, etapa.value)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(etapa.value)}
                  >
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {ordersInEtapa.length === 0 &&
                        dragOverEtapa === etapa.value && (
                          <div className="flex items-center justify-center py-8 text-sm text-blue-600">
                            <div className="text-center">
                              <div className="text-2xl mb-2">↓</div>
                              Solte aqui
                            </div>
                          </div>
                        )}
                      {ordersInEtapa.map((order) => (
                        <Card
                          key={order.id}
                          className={`group relative cursor-move hover:shadow-lg transition-all ${
                            draggedOrder?.id === order.id
                              ? "opacity-30 scale-95 rotate-2"
                              : "opacity-100 hover:scale-[1.02]"
                          }`}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(order.id, etapa.value);
                          }}
                          onDragEnd={() => {
                            setDraggedOrder(null);
                            setDragOverEtapa(null);
                          }}
                        >
                          {/* Indicador de Drag */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            </div>
                          </div>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {order.nomeCompleto || order.razaoSocial}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  #{order.orderCode}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {order.itemsCount || 0} itens
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(order);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{order.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{order.telefone}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-lg font-bold text-primary">
                                R$ {(order.total / 100).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosPaginados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-slate-500 py-8"
                      >
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    pedidosPaginados.map((order) => {
                      const etapa = etapas.find((e) => e.value === order.etapa);
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <span className="font-mono text-xs">
                              #{order.orderCode}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {order.nomeCompleto ||
                                  order.razaoSocial ||
                                  "N/A"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {order.itemsCount || 0}{" "}
                                {order.itemsCount === 1 ? "item" : "itens"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {order.tipoPessoa}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1 text-slate-600">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">
                                  {order.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600">
                                <Phone className="h-3 w-3" />
                                <span>{order.telefone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={etapa?.color}>
                              {etapa?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              R$ {(order.total / 100).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(order.createdAt).toLocaleTimeString(
                                "pt-BR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOrderClick(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-600">
                      Mostrando{" "}
                      <span className="font-semibold">{indexInicio + 1}</span> -{" "}
                      <span className="font-semibold">
                        {Math.min(indexFim, pedidosFiltrados.length)}
                      </span>{" "}
                      de{" "}
                      <span className="font-semibold">
                        {pedidosFiltrados.length}
                      </span>
                    </p>

                    <Select
                      value={itensPorPagina.toString()}
                      onValueChange={(v) => {
                        setItensPorPagina(Number(v));
                        resetPagina();
                      }}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPaginaAtual(1)}
                      disabled={paginaAtual === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-slate-600 px-4">
                      Página {paginaAtual} de {totalPaginas}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                      }
                      disabled={paginaAtual === totalPaginas}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      disabled={paginaAtual === totalPaginas}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder?.orderCode}
            </DialogTitle>
            <DialogDescription>
              Pedido recebido em{" "}
              {selectedOrder &&
                new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}
            </DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">
                      {orderDetails.nomeCompleto || orderDetails.razaoSocial}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {orderDetails.tipoPessoa === "PF"
                        ? "Pessoa Física"
                        : "Pessoa Jurídica"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{orderDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{orderDetails.telefone}</p>
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h3>
                <div className="space-y-2">
                  {orderDetails.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.productNome}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {(item.subtotal / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          R$ {(item.precoUnitario / 100).toFixed(2)}/un
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {(orderDetails.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Alterar Etapa */}
              <div className="space-y-4">
                <h3 className="font-semibold">Atualizar Etapa</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Nova Etapa</Label>
                    <Select value={novaEtapa} onValueChange={setNovaEtapa}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapas.map((etapa) => (
                          <SelectItem key={etapa.value} value={etapa.value}>
                            {etapa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Adicione observações sobre esta atualização..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleUpdateEtapa}
                    disabled={!novaEtapa || updateEtapaMutation.isPending}
                    className="w-full"
                  >
                    {updateEtapaMutation.isPending
                      ? "Atualizando..."
                      : "Atualizar Etapa"}
                  </Button>
                </div>
              </div>

              {orderDetails.observacoes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {orderDetails.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
