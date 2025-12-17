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
import { useLocation } from "wouter";

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
                Envie e gerencie documentos dos seus pedidos
              </p>
            </div>

            {/* Seletor de Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Selecione um Pedido</CardTitle>
                <CardDescription>
                  Escolha o pedido para o qual deseja enviar documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <Skeleton className="h-20 w-full" />
                ) : ordersNeedingDocs.length > 0 ? (
                  <div className="grid gap-3">
                    {ordersNeedingDocs.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order.id)}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors text-left ${
                          selectedOrder === order.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            Pedido #{order.orderCode}
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
                          {order.etapa === "aguardando_documentos"
                            ? "Aguardando Docs"
                            : "Novo Pedido"}
                        </Badge>
                      </button>
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

            {/* Upload de Documentos */}
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Documentos</CardTitle>
                  <CardDescription>
                    Formatos aceitos: PDF, JPG, PNG (máx. 10MB por arquivo)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-700 mb-4">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadMutation.isPending}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadMutation.isPending}
                        asChild
                      >
                        <span>Selecionar Arquivos</span>
                      </Button>
                    </label>
                  </div>

                  {uploadingFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Arquivos selecionados ({uploadingFiles.length})
                      </p>
                      {uploadingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-5 w-5 text-gray-700 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-700">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            disabled={uploadMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending}
                        className="w-full"
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar {uploadingFiles.length} Arquivo(s)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documentos Enviados */}
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Enviados</CardTitle>
                  <CardDescription>
                    Documentos já enviados para este pedido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDocuments ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {doc.originalName}
                              </p>
                              <p className="text-xs text-gray-700">
                                {formatFileSize(doc.size)} • Enviado em{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={`/api/ecommerce/customer/documents/${selectedOrder}/${doc.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-700">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum documento enviado ainda</p>
                    </div>
                  )}
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
