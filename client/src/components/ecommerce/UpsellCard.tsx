import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getRandomUpsellText, formatUpsellPrice } from "@/lib/upsell-texts";

interface UpsellCardProps {
  orderId: string;
  momento: "checkout" | "pos-checkout" | "painel";
}

interface UpsellData {
  upsell: {
    id: string;
    nome: string;
    descricao: string;
    preco: number;
    momento: string;
  } | null;
  reason?: string;
}

export function UpsellCard({ orderId, momento }: UpsellCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [respondido, setRespondido] = useState(false);
  const [textoAleatorio, setTextoAleatorio] = useState<string>("");

  // Buscar próximo upsell disponível
  const { data, isLoading } = useQuery<UpsellData>({
    queryKey: [`/api/ecommerce/customer/orders/${orderId}/next-upsell`],
    enabled: !!orderId && !respondido,
  });

  // Gerar texto aleatório quando carregar o upsell
  useEffect(() => {
    if (data?.upsell) {
      const texto = getRandomUpsellText(
        data.upsell.nome,
        formatUpsellPrice(data.upsell.preco)
      );
      setTextoAleatorio(texto);
      console.log("🎯 [UPSELL] Dados recebidos:", data.upsell);
      console.log("📝 [UPSELL] Texto gerado:", texto);
    } else if (data) {
      console.log("⚠️ [UPSELL] Sem upsell disponível:", data);
    }
  }, [data]);

  // Log de estado do componente
  useEffect(() => {
    console.log("🔍 [UPSELL] Estado:", { orderId, momento, isLoading, hasData: !!data, respondido });
  }, [orderId, momento, isLoading, data, respondido]);

  // Registrar resposta (aceitar/recusar)
  const respostaMutation = useMutation({
    mutationFn: async ({ svaId, accepted }: { svaId: string; accepted: boolean }) => {
      const response = await fetch(`/api/ecommerce/customer/orders/${orderId}/upsell-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ svaId, accepted }),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar resposta");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setRespondido(true);
      
      if (variables.accepted) {
        toast({
          title: "Adicionado!",
          description: "O serviço foi adicionado ao seu pedido com sucesso.",
          variant: "default",
        });
      } else {
        toast({
          title: "Ok",
          description: "Você pode adicionar serviços extras posteriormente.",
          variant: "default",
        });
      }

      // Invalidar queries para atualizar dados do pedido
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/customer/orders"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const formatPreco = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  };

  // Não mostrar se não há upsell ou já respondeu
  if (isLoading || !data?.upsell || respondido) {
    return null;
  }

  const { upsell } = data;

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 shadow-lg">
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800 font-semibold">
                Serviço adicional disponível
              </CardTitle>
              <p className="text-slate-600 text-sm mt-1">
                Opcional para complementar seu plano
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-300 text-blue-700 font-medium">
            Opcional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {/* Card interno branco */}
        <div className="bg-white rounded-xl p-6 shadow-inner">
          {/* Texto contextual RANDOMIZADO */}
          <p className="text-base text-slate-700 leading-relaxed mb-4">
            {textoAleatorio}
          </p>

          {/* Detalhes do serviço */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-slate-900 mb-2">{upsell.nome}</h4>
                {upsell.descricao && (
                  <p className="text-sm text-slate-600 leading-relaxed">{upsell.descricao}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-xs text-slate-500 mb-1">Valor</p>
                <p className="text-2xl font-semibold text-blue-700">
                  {formatPreco(upsell.preco)}
                </p>
                <p className="text-xs text-slate-500 mt-1">por mês</p>
              </div>
            </div>
          </div>

          {/* Benefícios visuais */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-4">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-600" />
            <span>Pode ser adicionado agora ou removido depois, sem custo adicional</span>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-600"
              onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: false })}
              disabled={respostaMutation.isPending}
            >
              Agora não
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: true })}
              disabled={respostaMutation.isPending}
            >
              {respostaMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {momento === "checkout" && "Adicionar ao pedido"}
                  {momento === "pos-checkout" && "Incluir serviço"}
                  {momento === "painel" && "Adicionar ao plano"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
