import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
    texto: string;
    momento: string;
  } | null;
  reason?: string;
}

export function UpsellCard({ orderId, momento }: UpsellCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [respondido, setRespondido] = useState(false);

  // Buscar próximo upsell disponível
  const { data, isLoading } = useQuery<UpsellData>({
    queryKey: [`/api/ecommerce/customer/orders/${orderId}/next-upsell`],
    enabled: !!orderId && !respondido,
  });

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
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Aproveite essa oferta!</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Oferta Especial
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Texto contextual */}
        <p className="text-sm text-slate-700 font-medium">
          {upsell.texto}
        </p>

        {/* Detalhes do serviço */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-base">{upsell.nome}</h4>
              {upsell.descricao && (
                <p className="text-sm text-slate-600 mt-1">{upsell.descricao}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {formatPreco(upsell.preco)}
              </p>
              <p className="text-xs text-slate-500">por mês</p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: false })}
            disabled={respostaMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Não, obrigado
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => respostaMutation.mutate({ svaId: upsell.id, accepted: true })}
            disabled={respostaMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Sim, adicionar ao pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
