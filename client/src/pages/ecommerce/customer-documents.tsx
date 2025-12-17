import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CustomerHeader,
  CustomerSidebar,
  CustomerMobileNav,
} from "@/components/ecommerce/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";
import { formatOrderStatus } from "@/lib/order-status-utils";

interface Order {
  id: string;
  clientId: string;
  etapa: string;
  total: number;
  createdAt: string;
}

interface Document {
  id: string;
  orderId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export default function CustomerDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const {
    data: customerData,
    isLoading: loadingAuth,
    isError,
  } = useQuery({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Proteção de rota
  useEffect(() => {
    if (!loadingAuth && (isError || !customerData?.client)) {
      setLocation("/ecommerce");
    }
  }, [loadingAuth, isError, customerData, setLocation]);


  const { data, isLoading: loadingOrders } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/ecommerce/customer/orders"],
    enabled: !!customerData?.client,
  });
  const orders = data?.orders ?? [];

  const { data: documents, isLoading: loadingDocuments } = useQuery<Document[]>(
    {
      queryKey: [`/api/ecommerce/customer/documents/${selectedOrder}`],
      enabled: !!selectedOrder,
    }
  );

  const uploadMutation = useMutation({
    mutationFn: async ({
      orderId,
      files,
    }: {
      orderId: string;
      files: File[];
    }) => {
      const formData = new FormData();
      // O backend espera apenas 1 arquivo por vez, campo 'file'
      // e os campos orderId e tipo
      formData.append("orderId", orderId);
      formData.append("tipo", "documento");
      if (files[0]) {
        formData.append("file", files[0]);
      }

      const res = await fetch(`/api/ecommerce/customer/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = "Erro ao enviar documentos";
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          // Se não for JSON, pega texto
          errorMsg = await res.text();
        }
        throw new Error(errorMsg);
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Documentos enviados!",
        description: "Seus documentos foram enviados com sucesso.",
      });
      setUploadingFiles([]);
      queryClient.invalidateQueries({
        queryKey: [`/api/ecommerce/customer/documents/${selectedOrder}`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingFiles([...uploadingFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!selectedOrder || uploadingFiles.length === 0) {
      toast({
        title: "Selecione arquivos",
        description: "Por favor, selecione os arquivos para enviar",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ orderId: selectedOrder, files: uploadingFiles });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const ordersNeedingDocs = orders.filter(
    (o) => o.etapa === "aguardando_documentos" || o.etapa === "novo_pedido"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      <div className="flex">
        <CustomerSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Documentos</h1>
              <p className="text-gray-700 mt-1">
                Pedidos que necessitam de documentos
              </p>
            </div>

            {/* Lista de Pedidos que Precisam de Documentos */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Aguardando Documentos</CardTitle>
                <CardDescription>
                  Clique em um pedido para abrir os detalhes e enviar os documentos necessários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <Skeleton className="h-20 w-full" />
                ) : ordersNeedingDocs.length > 0 ? (
                  <div className="grid gap-3">
                    {ordersNeedingDocs.map((order) => (
                      <Link
                        key={order.id}
                        href={`/ecommerce/painel/pedidos/${order.id}`}
                      >
                        <button
                          className="w-full flex items-center justify-between p-4 border rounded-lg transition-colors text-left border-gray-200 hover:border-primary hover:bg-primary/5"
                        >
                          <div>
                            <p className="font-medium">
                              Pedido #{order.orderCode || order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-700">
                              {new Date(order.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}{" "}
                              • R$ {(order.total / 100).toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              order.etapa === "aguardando_documentos"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {formatOrderStatus(order.etapa)}
                          </Badge>
                        </button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-700">
                    <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum pedido necessita de documentos no momento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CustomerMobileNav />
    </div>
  );
}
