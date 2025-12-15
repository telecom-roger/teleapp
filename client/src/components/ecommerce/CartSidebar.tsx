import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus, Copy, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { UpsellModal } from "./UpsellModal";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    updateLinhas,
    duplicateItem,
    getTotal,
    getSubtotal,
    getItemCount,
    addItem,
  } = useCartStore();

  const [upsellModalAberto, setUpsellModalAberto] = useState(false);
  const [svasParaOferecer, setSvasParaOferecer] = useState<any[]>([]);
  const [textosUpsellAtuais, setTextosUpsellAtuais] = useState<string[] | null>(
    null
  );

  // Buscar todos os produtos para pegar os SVAs
  const { data: todosOsProdutos = [] } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/products"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce/public/products");
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      return res.json();
    },
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para abrir modal de upsell
  const handleIrParaCheckout = () => {
    // Coletar todos os SVAs únicos dos produtos no carrinho (baseado nos produtos principais)
    const svasIds = new Set<string>();
    let textosColetados: string[] = [];

    items.forEach((item) => {
      if (item.svasUpsell && item.svasUpsell.length > 0) {
        item.svasUpsell.forEach((svaId: string) => svasIds.add(svaId));
        // Coletar todos os textos encontrados
        if (item.textosUpsell && item.textosUpsell.length > 0) {
          textosColetados = [...textosColetados, ...item.textosUpsell];
        }
      }
    });

    // Remover SVAs que já estão no carrinho
    const svasJaNoCarrinho = new Set(
      items
        .filter((item) => item.categoria === "sva")
        .map((item) => item.product.id)
    );
    svasIds.forEach((id) => {
      if (svasJaNoCarrinho.has(id)) {
        svasIds.delete(id);
      }
    });

    // Buscar produtos dos SVAs (excluindo os que já estão no carrinho)
    const svasProdutos = todosOsProdutos.filter((p) => svasIds.has(p.id));

    if (svasProdutos.length > 0) {
      setSvasParaOferecer(svasProdutos);
      setTextosUpsellAtuais(
        textosColetados.length > 0 ? textosColetados : null
      );
      setUpsellModalAberto(true);
    } else {
      // Ir direto para checkout se não houver SVAs para oferecer
      window.location.href = "/ecommerce/checkout";
    }
  };

  const handleAdicionarSvas = (svaIds: string[]) => {
    // Adicionar SVAs selecionados ao carrinho
    svaIds.forEach((svaId) => {
      const sva = todosOsProdutos.find((p) => p.id === svaId);
      if (sva) {
        addItem(sva, 1);
      }
    });
    // Ir para checkout
    window.location.href = "/ecommerce/checkout";
  };

  const total = getTotal();
  const subtotal = getSubtotal();
  const economia = 0; // TODO: calcular baseado em comparação

  if (!isOpen || items.length === 0) return null;

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-full lg:w-[360px] bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-out",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Resumo da Contratação</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items List (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.map((item, index) => {
            const operadoraNames: Record<string, string> = {
              V: "VIVO",
              C: "CLARO",
              T: "TIM",
            };

            const operadoraColors = {
              V: "bg-purple-100 text-purple-700 border-purple-200",
              C: "bg-red-100 text-red-700 border-red-200",
              T: "bg-blue-100 text-blue-700 border-blue-200",
            };

            const itemTotal =
              item.product.preco * item.quantidade +
              (item.linhasAdicionais || 0) *
                (item.product.valorPorLinhaAdicional || 0);

            return (
              <Card
                key={`${item.product.id}-${index}`}
                className="p-3 space-y-2"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded border",
                          operadoraColors[
                            item.product
                              .operadora as keyof typeof operadoraColors
                          ] || "bg-gray-100"
                        )}
                      >
                        {operadoraNames[item.product.operadora] ||
                          item.product.operadora}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">
                      {item.product.nome}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.product.velocidade || item.product.franquia}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.product.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* GB Info */}
                {item.product.franquia &&
                  (item.quantidade > 1 || (item.linhasAdicionais || 0) > 0) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2">
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between text-blue-700">
                          <span className="font-medium">GB por linha:</span>
                          <span className="font-semibold">
                            {item.product.franquia}
                          </span>
                        </div>
                        <div className="flex justify-between text-blue-900">
                          <span className="font-bold">GB Total:</span>
                          <span className="font-bold">
                            {(() => {
                              const totalLinhas =
                                item.quantidade + (item.linhasAdicionais || 0);
                              const gbMatch =
                                item.product.franquia?.match(/(\d+)\s*GB/i);
                              if (gbMatch) {
                                const gbPorLinha = parseInt(gbMatch[1]);
                                const gbTotal = gbPorLinha * totalLinhas;
                                return item.product.franquia
                                  .toLowerCase()
                                  .includes("ilimitado")
                                  ? "Ilimitado"
                                  : `${gbTotal}GB`;
                              }
                              return item.product.franquia
                                ?.toLowerCase()
                                .includes("ilimitado")
                                ? "Ilimitado"
                                : item.product.franquia;
                            })()}
                          </span>
                        </div>
                        <div className="text-blue-600 text-[10px] mt-1">
                          {item.quantidade + (item.linhasAdicionais || 0)}{" "}
                          linha(s) × {item.product.franquia}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Quantidade
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantidade - 1)
                      }
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantidade + 1)
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Linhas Adicionais (para PJ) */}
                {item.product.tipoPessoa === "PJ" &&
                  item.product.valorPorLinhaAdicional > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Linhas Adicionais
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateLinhas(
                              item.product.id,
                              Math.max(0, (item.linhasAdicionais || 0) - 1)
                            )
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.linhasAdicionais || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateLinhas(
                              item.product.id,
                              (item.linhasAdicionais || 0) + 1
                            )
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Item Total & Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">
                    {formatPrice(itemTotal)}/mês
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => duplicateItem(item.product.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer - Totals */}
        <div className="border-t bg-muted/30 p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}/mês</span>
            </div>
            {economia > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Economia estimada</span>
                <span className="font-medium">-{formatPrice(economia)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}/mês</span>
            </div>
          </div>

          <a
            onClick={(e) => {
              e.preventDefault();
              handleIrParaCheckout();
            }}
            href="#"
            className="flex items-center justify-center w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 font-medium text-base transition-colors cursor-pointer"
          >
            Continuar Contratação
            <span className="ml-2 text-xs opacity-75">
              ({getItemCount()} {getItemCount() === 1 ? "item" : "itens"})
            </span>
          </a>

          <p className="text-xs text-center text-muted-foreground">
            Você será direcionado para o formulário de contratação
          </p>
        </div>
      </div>

      {/* Modal de Upsell */}
      <UpsellModal
        isOpen={upsellModalAberto}
        onClose={() => {
          setUpsellModalAberto(false);
          window.location.href = "/ecommerce/checkout";
        }}
        svas={svasParaOferecer}
        textosPersonalizados={textosUpsellAtuais}
        onAddToCart={handleAdicionarSvas}
      />
    </>
  );
}

// Mobile Bottom Bar (alternative view)
export function CartBottomBar() {
  const { items, isOpen, toggleCart, getTotal, getItemCount } = useCartStore();

  if (items.length === 0 || isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t shadow-lg z-30 p-4">
      <Button size="lg" className="w-full" onClick={toggleCart}>
        <ShoppingCart className="w-5 h-5 mr-2" />
        Ver Resumo ({getItemCount()}) •{" "}
        {(getTotal() / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
        /mês
      </Button>
    </div>
  );
}
