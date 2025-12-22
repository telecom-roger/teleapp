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
  const { items, addItem } = useCartStore();
  const [svaToShow, setSvaToShow] = useState<any>(null);
  const [textoAleatorio, setTextoAleatorio] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Buscar todos os produtos disponíveis
  useEffect(() => {
    fetch("/api/app/public/products")
      .then((res) => res.json())
      .then((products) => {
        setAllProducts(products);
      })
      .catch((err) => {
        console.error("❌ [CART UPSELL] Erro ao carregar produtos:", err);
      });
  }, []);

  useEffect(() => {
    if (allProducts.length === 0 || items.length === 0) {
      return;
    }
    
    // Coletar todos os SVAs dos produtos no carrinho
    const allSvasIds = new Set<string>();
    
    items.forEach((item) => {
      const svasArray = item.svasUpsell || item.product.svasUpsell;
      
      if (svasArray && Array.isArray(svasArray) && svasArray.length > 0) {
        svasArray.forEach((svaId: string) => {
          allSvasIds.add(svaId);
        });
      }
    });

    // Remover SVAs que JÁ estão no carrinho
    const svasJaNoCarrinho = new Set(
      items
        .filter((item) => item.product.categoria === "sva")
        .map((item) => item.product.id)
    );

    allSvasIds.forEach((id) => {
      if (svasJaNoCarrinho.has(id)) {
        allSvasIds.delete(id);
      }
    });

    // RANDOMIZAR e pegar um SVA disponível
    if (allSvasIds.size > 0) {
      const svasArray = Array.from(allSvasIds);
      const randomizedSvas = svasArray.sort(() => Math.random() - 0.5);
      const selectedSvaId = randomizedSvas[0];
      
      const svaProduct = allProducts.find((p) => p.id === selectedSvaId);
      
      if (svaProduct) {
        setSvaToShow(svaProduct);
        const texto = getRandomUpsellText(
          svaProduct.nome,
          formatUpsellPrice(svaProduct.preco)
        );
        setTextoAleatorio(texto);
        
        // Salvar no localStorage que este SVA foi mostrado no checkout
        localStorage.setItem('lastShownUpsellCheckout', selectedSvaId);
      }
    } else {
      setSvaToShow(null);
    }
  }, [items, allProducts]);

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
              <h4 className="font-semibold text-sm text-slate-900">{svaToShow.nome}</h4>
              {svaToShow.descricao && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{svaToShow.descricao}</p>
              )}
            </div>
            <div className="text-right ml-3">
              <p className="text-lg font-semibold text-blue-700">
                {formatPreco(svaToShow.preco)}
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
            onClick={handleDecline}
          >
            Agora não
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAccept}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>
        
        <p className="text-xs text-slate-500 text-center mt-2">
          Pode ser removido depois sem custo
        </p>
      </CardContent>
    </Card>
  );
}
