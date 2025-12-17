import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Sparkles } from "lucide-react";
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
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 shadow-2xl">
      {/* Efeito de brilho animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl text-white font-bold">
                🎁 Oferta Especial para Você!
              </CardTitle>
              <p className="text-blue-50 text-sm mt-1">
                Aproveite esta oportunidade única
              </p>
            </div>
          </div>
          <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold shadow-lg animate-bounce">
            🔥 OFERTA
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
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-5 border-2 border-blue-100 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-xl text-slate-900 mb-2">{upsell.nome}</h4>
                {upsell.descricao && (
                  <p className="text-sm text-slate-600 leading-relaxed">{upsell.descricao}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-xs text-slate-500 mb-1">Por apenas</p>
                <p className="text-3xl font-black text-blue-600">
                  {formatPreco(upsell.preco)}
                </p>
                <p className="text-xs text-slate-500 mt-1">por mês</p>
              </div>
            </div>
          </div>

          {/* Benefícios visuais */}
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Pode ser adicionado agora ou removido depois sem custo</span>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold"
              onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: false })}
              disabled={respostaMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Não, obrigado
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: true })}
              disabled={respostaMutation.isPending}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Sim, quero aproveitar!
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
