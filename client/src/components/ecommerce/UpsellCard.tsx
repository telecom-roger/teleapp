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
  const [textoAleatorio, setTextoAleatorio] = useState<string>("");
  
  // Chave única para controlar se já respondeu neste momento/página
  const storageKey = `upsell-responded-${orderId}-${momento}`;
  const [jaRespondeu, setJaRespondeu] = useState(() => {
    // Inicializar do sessionStorage
    return sessionStorage.getItem(storageKey) === 'true';
  });

  // Buscar próximo upsell disponível
  const { data, isLoading } = useQuery<UpsellData>({
    queryKey: [`/api/ecommerce/customer/orders/${orderId}/next-upsell`],
    enabled: !!orderId && !jaRespondeu,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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

      // REGISTRAR VISUALIZAÇÃO no backend (apenas para tracking)
      fetch(`/api/ecommerce/customer/orders/${orderId}/upsell-viewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ svaId: data.upsell.id }),
      })
        .then(res => res.json())
        .then(result => {
          console.log("👁️ [UPSELL] Visualização registrada no backend:", result);
        })
        .catch(err => {
          console.error("❌ [UPSELL] Erro ao registrar visualização:", err);
        });
    } else if (data) {
      console.log("⚠️ [UPSELL] Sem upsell disponível:", data);
    }
  }, [data, orderId]);

  // Log de estado do componente
  useEffect(() => {
    console.log("🔍 [UPSELL] Estado:", { orderId, momento, isLoading, hasData: !!data });
  }, [orderId, momento, isLoading, data]);

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
      console.log(`✅ [UPSELL] Resposta processada:`, { accepted: variables.accepted, svaId: variables.svaId });
      
      // Marcar como respondido no sessionStorage (AGORA SIM)
      sessionStorage.setItem(storageKey, 'true');
      setJaRespondeu(true);
      console.log(`✅ [UPSELL] Marcado como respondido no sessionStorage: ${storageKey}`);
      
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

      // Invalidar queries específicas para recarregar
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/customer/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/customer/orders/${orderId}/next-upsell`] });
      console.log(`🔄 [UPSELL] Queries invalidadas, mas não vai buscar novamente nesta página`);
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

  // Não mostrar se não há upsell ou se já respondeu
  if (isLoading || !data?.upsell || jaRespondeu) {
    return null;
  }

  const { upsell } = data;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base text-slate-800 font-semibold">
              Serviço adicional disponível
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
            Opcional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {/* Texto contextual compacto */}
        <p className="text-sm text-slate-600 mb-3">
          {textoAleatorio}
        </p>

        {/* Detalhes do serviço compactos */}
        <div className="bg-white rounded-lg p-3 border border-slate-200 mb-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-slate-900">{upsell.nome}</h4>
              {upsell.descricao && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{upsell.descricao}</p>
              )}
            </div>
            <div className="text-right ml-3">
              <p className="text-lg font-semibold text-blue-700">
                {formatPreco(upsell.preco)}
              </p>
              <p className="text-xs text-slate-500">por mês</p>
            </div>
          </div>
        </div>

        {/* Botões de ação compactos */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-slate-600"
            onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: false })}
            disabled={respostaMutation.isPending}
          >
            Agora não
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: true })}
            disabled={respostaMutation.isPending}
          >
            {respostaMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                {momento === "checkout" && "Adicionar ao pedido"}
                {momento === "pos-checkout" && "Incluir serviço"}
                {momento === "painel" && "Adicionar ao plano"}
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-slate-500 text-center mt-2">
          Pode ser removido depois sem custo
        </p>
      </CardContent>
    </Card>
  );
}
