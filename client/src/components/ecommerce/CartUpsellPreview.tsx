import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { getRandomUpsellText, formatUpsellPrice } from "@/lib/upsell-texts";

interface CartUpsellPreviewProps {
  onAccept?: (svaId: string) => void;
}

/**
 * Preview de upsell no checkout (antes de criar o pedido)
 * Mostra o primeiro SVA disponível dos produtos no carrinho
 */
export function CartUpsellPreview({ onAccept }: CartUpsellPreviewProps) {
  const { items, addItem, todosOsProdutos } = useCartStore();
  const [svaToShow, setSvaToShow] = useState<any>(null);
  const [textoAleatorio, setTextoAleatorio] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Coletar todos os SVAs dos produtos no carrinho
    const allSvasIds = new Set<string>();
    
    items.forEach((item) => {
      if (item.svasUpsell && Array.isArray(item.svasUpsell) && item.svasUpsell.length > 0) {
        item.svasUpsell.forEach((svaId: string) => allSvasIds.add(svaId));
      }
    });

    // Remover SVAs que JÁ estão no carrinho
    const svasJaNoCarrinho = new Set(
      items
        .filter((item) => item.categoria === "sva")
        .map((item) => item.product.id)
    );

    allSvasIds.forEach((id) => {
      if (svasJaNoCarrinho.has(id)) {
        allSvasIds.delete(id);
      }
    });

    // Pegar o primeiro SVA disponível
    if (allSvasIds.size > 0) {
      const firstSvaId = Array.from(allSvasIds)[0];
      const svaProduct = todosOsProdutos.find((p) => p.id === firstSvaId);
      
      if (svaProduct) {
        setSvaToShow(svaProduct);
        const texto = getRandomUpsellText(
          svaProduct.nome,
          formatUpsellPrice(svaProduct.preco)
        );
        setTextoAleatorio(texto);
      }
    }
  }, [items, todosOsProdutos]);

  const handleAccept = () => {
    if (svaToShow) {
      addItem(svaToShow, 1);
      if (onAccept) onAccept(svaToShow.id);
      setDismissed(true);
    }
  };

  const handleDecline = () => {
    setDismissed(true);
  };

  const formatPreco = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  };

  // Não mostrar se não há SVA ou já foi dispensado
  if (!svaToShow || dismissed) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 shadow-lg mb-6">
      
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
                Opcional para complementar seu pedido
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
                <h4 className="font-semibold text-lg text-slate-900 mb-2">{svaToShow.nome}</h4>
                {svaToShow.descricao && (
                  <p className="text-sm text-slate-600 leading-relaxed">{svaToShow.descricao}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-xs text-slate-500 mb-1">Valor</p>
                <p className="text-2xl font-semibold text-blue-700">
                  {formatPreco(svaToShow.preco)}
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
              onClick={handleDecline}
            >
              Agora não
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              onClick={handleAccept}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Adicionar ao pedido
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
