import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CustomerHeader,
  CustomerSidebar,
  CustomerMobileNav,
} from "@/components/ecommerce/CustomerLayout";
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
  Upload,
  Eye,
  Download,
  Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { UpsellCard } from "@/components/ecommerce/UpsellCard";

interface Order {
  id: string;
  orderCode?: string;
  clientId: string;
  etapa: string;
  execucaoTipo?:
    | "em_rota"
    | "aguardando_instalacao"
    | "instalacao"
    | "entrega"
    | "personalizado";
  execucaoObservacoes?: string | null;
  total: number;
  subtotal: number;
  taxaInstalacao: number;
  economia: number;
  observacoes: string | null;
  // Campos de endereço
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
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

interface RequestedDocument {
  id: string;
  orderId: string;
  tipo: string;
  nome: string;
  obrigatorio: boolean;
  status: "pendente" | "enviado" | "aprovado" | "reprovado";
  observacoes: string | null;
  hasUpload: boolean;
  uploads: any[];
}

export default function CustomerOrders() {
  const params = useParams();
  const orderId = params.orderId as string | undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const {
    data: customerData,
    isLoading: loadingAuth,
    isError,
  } = useQuery<{ client: any }>({
    queryKey: ["/api/app/auth/customer"],
    retry: false,
  });

  // Proteção de rota
  useEffect(() => {
    if (!loadingAuth && (isError || !customerData?.client)) {
      setLocation("/app");
    }
  }, [loadingAuth, isError, customerData, setLocation]);

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/app/customer/orders"],
    enabled: !!customerData?.client,
    refetchInterval: 5000, // Atualizar a cada 5 segundos para pegar novos pedidos
    refetchOnWindowFocus: true,
    // Atualização em tempo real via SSE
  });
  const orders = data?.orders ?? [];

  const { data: orderDetail, isLoading: loadingDetail } = useQuery<Order>({
    queryKey: [`/api/app/customer/orders/${orderId}`],
    enabled: !!orderId,
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
  });

  const { data: requestedDocuments, isLoading: loadingDocs } = useQuery<
    RequestedDocument[]
  >({
    queryKey: [
      `/api/app/customer/orders/${orderId}/requested-documents`,
    ],
    enabled: !!orderId,
    refetchInterval: 1000, // Atualizar a cada 1 segundo para tempo real
    refetchOnWindowFocus: true,
  });

  // Buscar resumo das linhas de portabilidade
  const { data: linesSummary } = useQuery<any>({
    queryKey: [`/api/app/order-lines/${orderId}/summary`],
    enabled: !!orderId && orderDetail?.etapa === "aguardando_dados_linhas",
    refetchInterval: 5000,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      orderId,
      tipo,
      file,
    }: {
      orderId: string;
      tipo: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      formData.append("tipo", tipo);

      const res = await fetch("/api/app/customer/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao enviar documento");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/app/customer/orders/${orderId}/requested-documents`,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/app/customer/orders/${orderId}`],
      });
      setUploadingDoc(null);
      toast({
        title: "Documento enviado",
        description:
          "Seu documento foi enviado com sucesso e está sendo analisado.",
      });
    },
    onError: (error: Error) => {
      setUploadingDoc(null);
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (
    docId: string,
    tipo: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !orderDetail) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos PDF, JPG e PNG são permitidos.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingDoc(docId);
    uploadDocumentMutation.mutate({ orderId: orderDetail.id, tipo, file });
  };

  const getStatusInfo = (etapa: string, execucaoTipo?: string) => {
    switch (etapa) {
      case "novo_pedido":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          badge: "secondary",
          label: "Pedido recebido",
          description:
            "Recebemos seu pedido e ele já está em nossa fila de processamento.",
        };
      case "aguardando_dados_linhas":
        return {
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-50",
          badge: "default",
          label: "Aguardando dados das linhas",
          description:
            "Para continuar com a portabilidade, precisamos que você preencha as informações de cada linha contratada.",
        };
      case "em_analise":
        return {
          icon: AlertCircle,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          badge: "default",
          label: "Pedido em análise",
          description:
            "Estamos avaliando as informações iniciais do seu pedido. Caso seja necessário, poderemos solicitar documentos para continuar.",
        };
      case "aguardando_documentos":
        return {
          icon: FileText,
          color: "text-orange-600",
          bg: "bg-orange-50",
          badge: "warning",
          label: "Envio de documentos necessário",
          description:
            "Para dar continuidade ao seu pedido, precisamos que você envie os documentos solicitados abaixo.",
        };
      case "validando_documentos":
        return {
          icon: FileText,
          color: "text-amber-600",
          bg: "bg-amber-50",
          badge: "default",
          label: "Documentos em validação",
          description:
            "Recebemos seus documentos e estamos conferindo as informações enviadas. Esse processo pode levar um curto período.",
        };
      case "contrato_enviado":
        return {
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-50",
          badge: "default",
          label: "Contrato enviado para assinatura",
          description:
            "O contrato foi enviado para você assinar. Assim que a assinatura for confirmada, seu pedido seguirá para a próxima etapa.",
        };
      case "contrato_assinado":
        return {
          icon: CheckCircle2,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
          badge: "default",
          label: "Contrato assinado",
          description:
            "Recebemos sua assinatura. Agora seguimos com as validações finais do seu pedido.",
        };
      case "analise_credito":
        return {
          icon: AlertCircle,
          color: "text-violet-600",
          bg: "bg-violet-50",
          badge: "default",
          label: "Análise de crédito em andamento",
          description:
            "Estamos realizando a análise de crédito junto à operadora. Essa etapa é necessária para a aprovação do serviço.",
        };
      case "aprovado":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          badge: "success",
          label: "Pedido aprovado",
          description:
            "Tudo certo! Seu pedido foi aprovado e seguirá para a etapa de ativação.",
        };
      case "em_andamento":
        // Texto dinâmico baseado no tipo de execução
        const substatusTexts = {
          em_rota: {
            label: "Técnico a caminho",
            description:
              "Nosso técnico já está em rota para realizar a instalação no endereço informado.",
          },
          aguardando_instalacao: {
            label: "Aguardando instalação",
            description:
              "Seu pedido está pronto. Em breve agendaremos a instalação com você.",
          },
          instalacao: {
            label: "Instalação em andamento",
            description:
              "Nosso técnico está realizando a instalação no seu endereço. Em breve estará concluído.",
          },
          entrega: {
            label: "Entrega em andamento",
            description:
              "Seu chip ou equipamento já está em rota de entrega. Em breve ele chegará ao endereço informado.",
          },
          personalizado: {
            label: "Em andamento",
            description:
              "Seu pedido está em execução. Em breve você receberá atualizações.",
          },
        };
        const substatus = substatusTexts[
          execucaoTipo as keyof typeof substatusTexts
        ] || {
          label: "Em andamento",
          description:
            "Seu pedido está em execução. Em breve você receberá atualizações.",
        };
        return {
          icon: Package,
          color: "text-purple-600",
          bg: "bg-purple-50",
          badge: "default",
          label: substatus.label,
          description: substatus.description,
        };
      case "concluido":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          badge: "success",
          label: "Pedido concluído",
          description:
            "Seu serviço foi ativado com sucesso. Se precisar de algo, estamos à disposição.",
        };
      case "cancelado":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          badge: "destructive",
          label: "Pedido cancelado",
          description:
            "Este pedido foi encerrado. Caso tenha dúvidas ou queira mais informações, entre em contato com nosso suporte.",
        };
      default:
        return {
          icon: Package,
          color: "text-gray-600",
          bg: "bg-gray-50",
          badge: "secondary",
          label: etapa,
          description: "",
        };
    }
  };

  // Visualização detalhada do pedido
  if (orderId) {
    const statusInfo = orderDetail
      ? getStatusInfo(orderDetail.etapa, orderDetail.execucaoTipo)
      : null;
    const StatusIcon = statusInfo?.icon;

    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />

        <div className="flex">
          <CustomerSidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/app/painel/pedidos">
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                  </Button>
                </Link>
                <h1 className="text-lg sm:text-xl font-semibold truncate">Detalhes do Pedido</h1>
              </div>

              {loadingDetail ? (
                <Card>
                  <CardContent className="p-8">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ) : orderDetail ? (
                <>
                  {/* Card de Upsell - Mostrar primeiro para chamar atenção */}
                  <UpsellCard orderId={orderDetail.id} momento="painel" />

                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg">
                            Pedido #{orderDetail.orderCode || orderDetail.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-700 mt-1">
                            Realizado em{" "}
                            {new Date(orderDetail.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        {StatusIcon && (
                          <Badge
                            variant={statusInfo?.badge as any}
                            className="flex items-center gap-2 text-xs self-start flex-shrink-0"
                          >
                            <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            {statusInfo?.label}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {statusInfo?.description && (
                        <div
                          className={`p-4 rounded-lg ${statusInfo.bg} border border-gray-200`}
                        >
                          <p
                            className={`text-sm ${statusInfo.color} leading-relaxed`}
                          >
                            {statusInfo.description}
                          </p>
                        </div>
                      )}
                      {orderDetail.observacoes && (
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                Status do Pedido
                              </p>
                              <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-line">
                                {orderDetail.observacoes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {orderDetail.etapa === "em_andamento" && orderDetail.execucaoObservacoes && (
                        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-start gap-3">
                            <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-purple-900 mb-1">
                                Informações da Execução
                              </p>
                              <p className="text-sm text-purple-700 leading-relaxed whitespace-pre-line">
                                {orderDetail.execucaoObservacoes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="text-sm text-gray-700">
                              Data
                            </p>
                            <p className="font-medium">
                              {new Date(
                                orderDetail.createdAt
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="text-sm text-gray-700">
                              Valor Total
                            </p>
                            <p className="font-semibold text-base">
                              R$ {(orderDetail.total / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="text-sm text-gray-700">
                              Itens
                            </p>
                            <p className="font-medium">
                              {orderDetail.items.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Endereço de Entrega/Instalação */}
                      {(orderDetail.endereco || orderDetail.cidade) && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-sm text-gray-700 mb-2 font-medium">
                            Endereço de Entrega/Instalação
                          </p>
                          <p className="text-sm text-slate-900">
                            {orderDetail.endereco}
                            {orderDetail.numero
                              ? `, ${orderDetail.numero}`
                              : ""}
                            {orderDetail.complemento
                              ? ` - ${orderDetail.complemento}`
                              : ""}
                            <br />
                            {orderDetail.bairro
                              ? `${orderDetail.bairro} - `
                              : ""}
                            {orderDetail.cidade}/{orderDetail.uf}
                            {orderDetail.cep
                              ? ` - CEP: ${orderDetail.cep}`
                              : ""}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Itens do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderDetail.items.map((item) => (
                          <div
                            key={item.id}
                            className="border rounded-lg p-3 sm:p-4 space-y-2"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm sm:text-base">
                                  {item.productNome}
                                </h3>
                                {item.productDescricao && (
                                  <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                                    {item.productDescricao}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold text-sm sm:text-base flex-shrink-0">
                                R$ {(item.subtotal / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
                              <span>Quantidade: {item.quantidade}</span>
                              {item.linhasAdicionais > 0 && (
                                <span>
                                  Linhas Adicionais: {item.linhasAdicionais}
                                </span>
                              )}
                              <span>
                                Preço Unitário: R${" "}
                                {(item.precoUnitario / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t mt-6 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            Subtotal
                          </span>
                          <span>
                            R$ {(orderDetail.subtotal / 100).toFixed(2)}
                          </span>
                        </div>
                        {orderDetail.economia > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Economia</span>
                            <span>
                              -R$ {(orderDetail.economia / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {orderDetail.taxaInstalacao > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              Taxa de Instalação
                            </span>
                            <span>
                              R$ {(orderDetail.taxaInstalacao / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-semibold border-t pt-2">
                          <span>Total</span>
                          <span>R$ {(orderDetail.total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documentos - Mostrar sempre que houver documentos solicitados */}
                  {requestedDocuments && requestedDocuments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documentos Solicitados
                        </CardTitle>
                        <p className="text-sm text-gray-700">
                          {orderDetail.etapa === "aguardando_documentos"
                            ? "Envie todos os documentos solicitados. Assim que o envio estiver completo, seu pedido seguirá automaticamente para validação."
                            : "Documentos solicitados para este pedido. Envie os pendentes o quanto antes."}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {loadingDocs ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-20 w-full" />
                            ))}
                          </div>
                        ) : requestedDocuments &&
                          requestedDocuments.length > 0 ? (
                          <div className="space-y-3">
                            {requestedDocuments.map((doc) => {
                              const getDocStatusInfo = () => {
                                switch (doc.status) {
                                  case "pendente":
                                    return {
                                      icon: Clock,
                                      color: "text-orange-600",
                                      bg: "bg-white",
                                      borderColor: "border-gray-200",
                                      label: "Pendente",
                                      badgeVariant: "secondary" as const,
                                    };
                                  case "enviado":
                                    return {
                                      icon: FileText,
                                      color: "text-blue-600",
                                      bg: "bg-white",
                                      borderColor: "border-gray-200",
                                      label: "Recebido",
                                      badgeVariant: "default" as const,
                                    };
                                  case "aprovado":
                                    return {
                                      icon: CheckCircle2,
                                      color: "text-green-600",
                                      bg: "bg-white",
                                      borderColor: "border-gray-200",
                                      label: "Aprovado",
                                      badgeVariant: "default" as const,
                                    };
                                  case "reprovado":
                                    return {
                                      icon: AlertCircle,
                                      color: "text-red-600",
                                      bg: "bg-white",
                                      borderColor: "border-gray-200",
                                      label: "Reprovado",
                                      badgeVariant: "destructive" as const,
                                    };
                                }
                              };

                              const statusInfo = getDocStatusInfo();
                              const StatusIcon = statusInfo.icon;

                              return (
                                <div
                                  key={doc.id}
                                  className={`p-3 sm:p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bg} transition-all duration-300`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                      <StatusIcon
                                        className={`h-4 w-4 sm:h-5 sm:w-5 ${statusInfo.color} mt-0.5 flex-shrink-0`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-sm sm:text-base">
                                            {doc.nome}
                                          </span>
                                          {doc.obrigatorio && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Obrigatório
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant={statusInfo.badgeVariant} className="text-xs self-start sm:self-auto flex-shrink-0">
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                  {/* Arquivos enviados */}
                                  {doc.uploads && doc.uploads.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-xs font-medium text-gray-700 mb-2">
                                        Arquivo(s) enviado(s):
                                      </p>
                                      {doc.uploads.map((upload: any) => (
                                        <div
                                          key={upload.id}
                                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-slate-50 rounded mb-2"
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                            <span className="text-xs sm:text-sm truncate">
                                              {upload.fileName}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 self-start sm:self-auto">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                window.open(
                                                  `/api/app/documents/${upload.id}`,
                                                  "_blank"
                                                )
                                              }
                                              className="flex-shrink-0"
                                            >
                                              <Eye className="h-3 w-3 mr-1" />
                                              Ver
                                            </Button>
                                            {/* Permitir remover até validando_documentos, bloquear apenas se aprovado */}
                                            {doc.status !== "aprovado" &&
                                              (orderDetail.etapa === "aguardando_documentos" ||
                                                orderDetail.etapa === "validando_documentos") && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                                  onClick={async () => {
                                                    if (
                                                      confirm(
                                                        "Tem certeza que deseja excluir este documento?"
                                                      )
                                                    ) {
                                                      try {
                                                        const res = await fetch(
                                                          `/api/app/customer/documents/${upload.id}`,
                                                          {
                                                            method: "DELETE",
                                                          }
                                                        );
                                                        if (res.ok) {
                                                          // Invalidar queries para atualizar em tempo real
                                                          queryClient.invalidateQueries({
                                                            queryKey: [
                                                              `/api/app/customer/orders/${orderId}/requested-documents`,
                                                            ],
                                                          });
                                                          queryClient.invalidateQueries({
                                                            queryKey: [
                                                              `/api/app/customer/orders/${orderId}`,
                                                            ],
                                                          });
                                                          toast({
                                                            title: "Documento excluído",
                                                            description:
                                                              "O documento foi removido com sucesso.",
                                                          });
                                                        } else {
                                                          throw new Error(
                                                            "Erro ao excluir"
                                                          );
                                                        }
                                                      } catch (error) {
                                                        toast({
                                                          title: "Erro",
                                                          description:
                                                            "Não foi possível excluir o documento",
                                                          variant: "destructive",
                                                        });
                                                      }
                                                    }
                                                  }}
                                                >
                                                  ✕
                                                </Button>
                                              )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Botão de upload */}
                                  {(doc.status === "pendente" ||
                                    doc.status === "reprovado") && (
                                    <div className="mt-3">
                                      <input
                                        ref={(el) =>
                                          (fileInputRefs.current[doc.id] = el)
                                        }
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleFileSelect(doc.id, doc.tipo, e)
                                        }
                                        disabled={uploadingDoc === doc.id}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={doc.status === "reprovado" ? "border-red-500 text-red-600 hover:bg-red-50 w-full" : "w-full"}
                                        onClick={() =>
                                          fileInputRefs.current[doc.id]?.click()
                                        }
                                        disabled={uploadingDoc === doc.id}
                                      >
                                        {uploadingDoc === doc.id ? (
                                          <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Enviando...
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {doc.status === "reprovado"
                                              ? "Enviar Novo Documento"
                                              : "Enviar documento"}
                                          </>
                                        )}
                                      </Button>
                                      <p className="text-xs text-gray-700 mt-1 text-center">
                                        PDF, JPG ou PNG • Máx 5MB
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Mensagem de observações abaixo do card */}
                                  {doc.observacoes && doc.status === "reprovado" && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <p className="text-sm text-red-600">
                                        {doc.observacoes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Barra de progresso */}
                            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  Progresso dos Documentos
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                  {
                                    requestedDocuments.filter(
                                      (d) =>
                                        d.status === "enviado" ||
                                        d.status === "aprovado"
                                    ).length
                                  }{" "}
                                  / {requestedDocuments.length}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${
                                      (requestedDocuments.filter(
                                        (d) =>
                                          d.status === "enviado" ||
                                          d.status === "aprovado"
                                      ).length /
                                        requestedDocuments.length) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 text-center py-4">
                            Nenhum documento solicitado no momento.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-700">
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
                  const statusInfo = getStatusInfo(
                    order.etapa,
                    order.execucaoTipo
                  );
                  const StatusIcon = statusInfo.icon;

                  return (
                    <Link
                      key={order.id}
                      href={`/app/painel/pedidos/${order.id}`}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`p-2.5 sm:p-3 rounded-lg ${statusInfo.bg} flex-shrink-0`}>
                              <StatusIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${statusInfo.color}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm sm:text-base mb-1.5">
                                    Pedido #{order.orderCode || order.id.slice(0, 8)}
                                  </h3>
                                  <Badge variant={statusInfo.badge as any} className="text-xs">
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                                <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">
                                  R$ {(order.total / 100).toFixed(2)}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 mt-3">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm">
                                  Ver Detalhes
                                </Button>
                              </div>
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
                  <Package className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum pedido encontrado
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Você ainda não realizou nenhum pedido.
                  </p>
                  <Link href="/app/planos">
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
