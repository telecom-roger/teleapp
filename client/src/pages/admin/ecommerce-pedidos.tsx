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
import AdminOrderLines from "@/components/ecommerce/AdminOrderLines";

interface EcommerceOrder {
  id: string;
  orderCode: string;
  clientId: string;
  tipoPessoa: string;
  tipoContratacao?: string;
  nomeCompleto?: string;
  razaoSocial?: string;
  email: string;
  telefone: string;
  etapa: string;
  execucaoTipo?:
    | "instalacao"
    | "entrega"
    | "ativacao_remota"
    | "provisionamento"
    | "outro";
  subtotal: number;
  total: number;
  observacoes?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
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
    value: "aguardando_dados_linhas",
    label: "Aguardando Dados Linhas",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "em_analise",
    label: "Em Análise",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  {
    value: "ajuste_solicitado",
    label: "Ajuste Solicitado",
    color: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    value: "aguardando_documentos",
    label: "Aguardando Docs",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    value: "validando_documentos",
    label: "Validando Docs",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "contrato_enviado",
    label: "Contrato Enviado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "contrato_assinado",
    label: "Contrato Assinado",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  {
    value: "analise_credito",
    label: "Análise de Crédito",
    color: "bg-violet-100 text-violet-800 border-violet-300",
  },
  {
    value: "aprovado",
    label: "Aprovado",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    value: "em_andamento",
    label: "Em Andamento",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    value: "concluido",
    label: "Concluído",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
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
    case "aguardando_dados_linhas":
      return Phone;
    case "em_analise":
      return AlertCircle;
    case "ajuste_solicitado":
      return AlertCircle;
    case "aguardando_documentos":
      return FileText;
    case "validando_documentos":
      return FileText;
    case "contrato_enviado":
      return FileText;
    case "contrato_assinado":
      return CheckCircle2;
    case "analise_credito":
      return AlertCircle;
    case "aprovado":
      return CheckCircle2;
    case "em_andamento":
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
  const [execucaoTipo, setExecucaoTipo] = useState<string>("");
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
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: orders } = useQuery<EcommerceOrder[]>({
    queryKey: ["/api/admin/ecommerce/orders"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
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

  // Inicializar campos quando o dialog é aberto com um pedido
  useEffect(() => {
    if (selectedOrder && detailsOpen) {
      setNovaEtapa(selectedOrder.etapa || "");
      setExecucaoTipo(selectedOrder.execucaoTipo || "");
      setObservacoes(""); // LIMPAR para enviar apenas nova mensagem
    }
  }, [selectedOrder, detailsOpen]);

  const { data: orderDetails } = useQuery<EcommerceOrder>({
    queryKey: [`/api/admin/ecommerce/orders/${selectedOrder?.id}`],
    enabled: !!selectedOrder,
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
  });
  
  // Log para debug
  // useEffect(() => {
  //   console.log('🔍 [DEBUG] selectedOrder mudou:', selectedOrder?.orderCode, selectedOrder?.id);
  // }, [selectedOrder]);
  
  // useEffect(() => {
  //   console.log('🔍 [DEBUG] orderDetails mudou:', orderDetails ? 'CARREGADO' : 'NULL');
  //   if (orderDetails) {
  //     console.log('📦 ORDER DETAILS:', orderDetails.orderCode, orderDetails.tipoContratacao);
  //   }
  // }, [orderDetails]);

  const { data: requestedDocuments } = useQuery<any[]>({
    queryKey: [
      `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
    ],
    enabled: !!selectedOrder,
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
  });

  const { data: uploadedDocuments } = useQuery<any[]>({
    queryKey: [
      `/api/admin/ecommerce/orders/${selectedOrder?.id}/uploaded-documents`,
    ],
    enabled: !!selectedOrder,
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
  });

  // Log quando documentos são carregados
  useEffect(() => {
    if (uploadedDocuments) {
      console.log("[ADMIN] 📄 Documentos carregados:", {
        count: uploadedDocuments.length,
        docs: uploadedDocuments.map((d) => ({
          id: d.id,
          tipo: d.tipo,
          nome: d.fileName,
        })),
      });
    }
  }, [uploadedDocuments]);

  const updateEtapaMutation = useMutation({
    mutationFn: async ({
      orderId,
      etapa,
      execucaoTipo,
      observacoes,
      orderCode,
    }: {
      orderId: string;
      etapa: string;
      execucaoTipo?: string;
      observacoes?: string;
      orderCode?: string;
    }) => {
      console.log("[ADMIN] 🔄 Tentando atualizar etapa:", { orderId, etapa, execucaoTipo, observacoes });
      const res = await fetch(`/api/admin/ecommerce/orders/${orderId}/etapa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, execucaoTipo, observacoes }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[ADMIN] ❌ Erro ao atualizar etapa:", {
          status: res.status,
          statusText: res.statusText,
          errorText
        });
        throw new Error(`Erro ao atualizar etapa: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log("[ADMIN] ✅ Etapa atualizada com sucesso:", data);
      return { ...data, orderCode, etapa };
    },
    onSuccess: (data) => {
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
      
      const etapaLabel = etapas.find(e => e.value === data.etapa)?.label || data.etapa;
      const orderCodeDisplay = data.orderCode || selectedOrder?.orderCode || "desconhecido";
      
      toast({
        title: "Etapa atualizada",
        description: `O pedido #${orderCodeDisplay} foi movido para "${etapaLabel}".`,
      });
      setNovaEtapa("");
      setExecucaoTipo("");
      setObservacoes("");
    },
    onError: (error: any) => {
      console.error("[ADMIN] ❌ ERRO NA MUTATION:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar a etapa",
        variant: "destructive",
      });
    },
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async ({
      orderId,
      documentId,
    }: {
      orderId: string;
      documentId: string;
    }) => {
      const res = await fetch(
        `/api/admin/ecommerce/orders/${orderId}/requested-documents/${documentId}/approve`,
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error("Erro ao aprovar documento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      queryClient.refetchQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      toast({
        title: "Documento aprovado",
        description: "O documento foi aprovado com sucesso",
      });
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({
      orderId,
      documentId,
      motivo,
    }: {
      orderId: string;
      documentId: string;
      motivo?: string;
    }) => {
      const res = await fetch(
        `/api/admin/ecommerce/orders/${orderId}/requested-documents/${documentId}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo }),
        }
      );
      if (!res.ok) throw new Error("Erro ao reprovar documento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      queryClient.refetchQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      toast({
        title: "Documento reprovado",
        description: "O documento foi reprovado",
      });
    },
  });

  const removeDocumentMutation = useMutation({
    mutationFn: async ({
      orderId,
      documentId,
    }: {
      orderId: string;
      documentId: string;
    }) => {
      const res = await fetch(
        `/api/admin/ecommerce/orders/${orderId}/requested-documents/${documentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao remover documento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      queryClient.refetchQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      toast({
        title: "Documento removido",
        description: "O documento foi removido da solicitação",
      });
    },
  });

  const loadDefaultDocsMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(
        `/api/admin/ecommerce/orders/${orderId}/load-default-documents`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao carregar documentos");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      toast({
        title: "Documentos carregados",
        description: "Documentos padrão foram solicitados ao cliente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCustomDocMutation = useMutation({
    mutationFn: async ({
      orderId,
      tipo,
      nome,
      obrigatorio,
    }: {
      orderId: string;
      tipo: string;
      nome: string;
      obrigatorio: boolean;
    }) => {
      const res = await fetch(
        `/api/admin/ecommerce/orders/${orderId}/requested-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, nome, obrigatorio }),
        }
      );
      if (!res.ok) throw new Error("Erro ao adicionar documento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/ecommerce/orders/${selectedOrder?.id}/requested-documents`,
        ],
      });
      toast({
        title: "Documento adicionado",
        description: "Novo documento foi solicitado",
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
          p.orderCode?.toLowerCase().includes(busca.toLowerCase()) ||
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
    
    console.log("========================================");
    console.log("🔄 ANTES DE ATUALIZAR ETAPA");
    console.log("OrderID:", selectedOrder.id);
    console.log("Order Code:", selectedOrder.orderCode);
    console.log("Etapa Atual:", selectedOrder.etapa);
    console.log("Nova Etapa:", novaEtapa);
    if (orderDetails?.items) {
      console.log("Total de Items ANTES:", orderDetails.items.length);
      orderDetails.items.forEach((item, i) => {
        console.log(`  Item ${i+1}: ${item.productName}, Quantidade: ${item.quantidade}`);
      });
    }
    console.log("========================================");
    
    updateEtapaMutation.mutate({
      orderId: selectedOrder.id,
      etapa: novaEtapa,
      execucaoTipo: novaEtapa === "em_andamento" ? execucaoTipo : undefined,
      observacoes,
      orderCode: selectedOrder.orderCode,
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
      orderCode: order.orderCode,
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
                  placeholder="Buscar por código, nome, email, telefone..."
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Pedido #{selectedOrder?.orderCode}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Criado em{" "}
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

          {!orderDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando detalhes...</p>
              </div>
            </div>
          )}
          
          {orderDetails && (
            <div className="space-y-6">
              {/* Cliente */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Nome
                    </p>
                    <p className="font-semibold text-slate-900">
                      {orderDetails.nomeCompleto || orderDetails.razaoSocial}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Tipo
                    </p>
                    <p className="font-semibold text-slate-900">
                      {orderDetails.tipoPessoa === "PF"
                        ? "Pessoa Física"
                        : "Pessoa Jurídica"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Email
                    </p>
                    <p className="font-semibold text-slate-900">
                      {orderDetails.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Telefone
                    </p>
                    <p className="font-semibold text-slate-900">
                      {orderDetails.telefone}
                    </p>
                  </div>
                  {(orderDetails.endereco || orderDetails.cidade) && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                        Endereço
                      </p>
                      <p className="font-semibold text-slate-900">
                        {orderDetails.endereco}
                        {orderDetails.numero ? `, ${orderDetails.numero}` : ""}
                        {orderDetails.complemento
                          ? ` - ${orderDetails.complemento}`
                          : ""}
                        <br />
                        {orderDetails.bairro ? `${orderDetails.bairro} - ` : ""}
                        {orderDetails.cidade}/{orderDetails.uf}
                        {orderDetails.cep ? ` - CEP: ${orderDetails.cep}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes da Contratação */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Detalhes da Contratação
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Tipo de Contratação
                    </p>
                    <Badge variant={orderDetails.tipoContratacao === "portabilidade" ? "default" : "secondary"}>
                      {orderDetails.tipoContratacao === "portabilidade" ? "📱 Portabilidade" : "🆕 Linha Nova"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                      Operadora
                    </p>
                    <p className="font-semibold text-slate-900">
                      {(() => {
                        const firstProduct = orderDetails.items?.find((item: any) => 
                          item.productCategoria === "movel" || item.productOperadora
                        );
                        const operadora = firstProduct?.productOperadora || firstProduct?.product?.operadora;
                        
                        if (operadora === "V") return "Vivo";
                        if (operadora === "T") return "Tim";
                        if (operadora === "C") return "Claro";
                        if (operadora === "O") return "Oi";
                        return "Não informado";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Itens do Pedido
                </h3>
                <div className="space-y-2">
                  {orderDetails.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.productNome}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantidade:{" "}
                          <span className="font-medium text-slate-700">
                            {item.quantidade}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          R$ {(item.subtotal / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          R$ {(item.precoUnitario / 100).toFixed(2)}/un
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                  <span className="font-semibold text-lg text-slate-700">
                    Total do Pedido
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    R$ {(orderDetails.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Linhas de Portabilidade */}
              {orderDetails.tipoContratacao === "portabilidade" && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    Linhas de Portabilidade
                  </h3>
                  <AdminOrderLines orderId={orderDetails.id} />
                </div>
              )}

              {/* Alterar Etapa */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Atualizar Etapa
                </h3>
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
                  {novaEtapa === "em_andamento" && (
                    <div>
                      <Label>Status da Execução</Label>
                      <Select
                        value={execucaoTipo}
                        onValueChange={setExecucaoTipo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_rota">🚗 Em Rota</SelectItem>
                          <SelectItem value="aguardando_instalacao">
                            ⏳ Aguardando Instalação
                          </SelectItem>
                          <SelectItem value="instalacao">
                            🔧 Em Instalação
                          </SelectItem>
                          <SelectItem value="entrega">🚚 Em Entrega</SelectItem>
                          <SelectItem value="personalizado">
                            ✏️ Status Personalizado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {novaEtapa === "em_andamento" &&
                  execucaoTipo === "personalizado" ? (
                    <div>
                      <Label>
                        Status Personalizado (visível para o cliente)
                      </Label>
                      <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Aguardando peças, Reagendado para amanhã..."
                      />
                    </div>
                  ) : novaEtapa === "em_andamento" ? (
                    <div>
                      <Label>Observações (visível para o cliente)</Label>
                      <Textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Técnico a caminho, previsão de chegada 14h..."
                        rows={3}
                      />
                    </div>
                  ) : orderDetails?.observacoes ? (
                    <div>
                      <Label>Observações (somente visualização)</Label>
                      <Textarea
                        value={orderDetails.observacoes}
                        readOnly
                        disabled
                        rows={3}
                        className="bg-slate-100"
                      />
                    </div>
                  ) : null}
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

              {/* Documentos */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Documentos Solicitados
                    </h3>
                    {requestedDocuments && requestedDocuments.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {requestedDocuments.filter(d => d.status === "enviado" || d.status === "aprovado").length}/{requestedDocuments.length} documentos enviados
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!selectedOrder) return;
                        loadDefaultDocsMutation.mutate(selectedOrder.id);
                      }}
                      disabled={
                        loadDefaultDocsMutation.isPending ||
                        selectedOrder?.etapa !== "aguardando_documentos"
                      }
                    >
                      {loadDefaultDocsMutation.isPending
                        ? "Carregando..."
                        : "Carregar Docs Padrão"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!selectedOrder) return;
                        const nome = prompt("Nome do documento:");
                        if (!nome) return;
                        const tipo = nome.toLowerCase().replace(/\s+/g, "_");
                        const obrigatorio = confirm(
                          "Este documento é obrigatório?"
                        );
                        addCustomDocMutation.mutate({
                          orderId: selectedOrder.id,
                          tipo,
                          nome,
                          obrigatorio,
                        });
                      }}
                      disabled={
                        selectedOrder?.etapa !== "aguardando_documentos"
                      }
                    >
                      + Adicionar Documento
                    </Button>
                  </div>
                </div>
                {requestedDocuments && requestedDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {requestedDocuments.map((doc) => {
                      const uploads =
                        uploadedDocuments?.filter((u) => u.tipo === doc.tipo) ||
                        [];
                      const hasUpload = uploads.length > 0;

                      // Debug: Log status do documento
                      console.log(`[DOC ADM] ${doc.nome} - Status: ${doc.status}, HasUpload: ${hasUpload}, Uploads:`, uploads.length);

                      // Cor de fundo baseada no status
                      const getBgColor = () => {
                        if (doc.status === "aprovado") return "bg-green-50";
                        if (doc.status === "reprovado") return "bg-red-50";
                        if (doc.status === "enviado") return "bg-blue-50";
                        return "bg-white";
                      };
                      
                      const getBorderColor = () => {
                        if (doc.status === "aprovado") return "border-green-200";
                        if (doc.status === "reprovado") return "border-red-200";
                        if (doc.status === "enviado") return "border-blue-200";
                        return "border-slate-200";
                      };

                      return (
                        <div
                          key={doc.id}
                          className={`p-4 ${getBgColor()} border ${getBorderColor()} rounded-lg space-y-2 hover:border-primary/50 transition-all duration-300`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-900">
                                  {doc.nome}
                                </p>
                                {doc.obrigatorio && (
                                  <p className="text-xs text-muted-foreground">
                                    Obrigatório
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  doc.status === "aprovado"
                                    ? "default"
                                    : doc.status === "reprovado"
                                    ? "destructive"
                                    : doc.status === "enviado"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {doc.status === "aprovado" && "✓ Aprovado"}
                                {doc.status === "reprovado" && "✗ Reprovado"}
                                {doc.status === "enviado" && "Enviado"}
                                {doc.status === "pendente" && "Pendente"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (!selectedOrder) return;
                                  if (
                                    confirm(
                                      `Tem certeza que deseja remover "${doc.nome}"?`
                                    )
                                  ) {
                                    removeDocumentMutation.mutate({
                                      orderId: selectedOrder.id,
                                      documentId: doc.id,
                                    });
                                  }
                                }}
                                title="Remover documento"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                          {hasUpload && (
                            <div className="space-y-1 pl-6">
                              {uploads.map((upload) => (
                                <div
                                  key={upload.id}
                                  className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded"
                                >
                                  <span className="text-muted-foreground">
                                    📎 {upload.fileName}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={() => {
                                        window.open(
                                          `/api/ecommerce/documents/${upload.id}`,
                                          "_blank"
                                        );
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Ver
                                    </Button>
                                    {/* Botões de aprovar/reprovar aparecem quando documento foi enviado */}
                                    {doc.status === "enviado" && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() => {
                                            if (!selectedOrder) return;
                                            approveDocumentMutation.mutate({
                                              orderId: selectedOrder.id,
                                              documentId: doc.id,
                                            });
                                          }}
                                        >
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Aprovar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            if (!selectedOrder) return;
                                            const motivo = prompt(
                                              "Motivo da reprovação (opcional):"
                                            );
                                            rejectDocumentMutation.mutate({
                                              orderId: selectedOrder.id,
                                              documentId: doc.id,
                                              motivo: motivo || undefined,
                                            });
                                          }}
                                        >
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Reprovar
                                        </Button>
                                      </>
                                    )}
                                    {/* Feedback quando já aprovado */}
                                    {doc.status === "aprovado" && (
                                      <span className="text-xs text-green-600 font-semibold">
                                        ✓ Aprovado
                                      </span>
                                    )}
                                    {/* Feedback quando reprovado */}
                                    {doc.status === "reprovado" && (
                                      <span className="text-xs text-red-600 font-semibold">
                                        ✗ Reprovado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {doc.observacoes && (
                            <p className="text-xs text-muted-foreground pl-6">
                              ⚠️ {doc.observacoes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-slate-50">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento solicitado ainda</p>
                    <p className="text-xs mt-1">
                      Clique em "Carregar Docs Padrão" para solicitar documentos
                      baseados no tipo de pessoa (PF/PJ)
                    </p>
                  </div>
                )}
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
