import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Plus,
  Minus,
  Copy,
  ShoppingCart,
  ChevronRight,
  Wifi,
  Smartphone,
  Briefcase,
} from "lucide-react";
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
    duplicateItem,
    getTotal,
    getSubtotal,
    getItemCount,
    addItem,
    getTotalLinhas,
    getLinhasComSva,
    canAddMoreSva,
    getSvaCount,
  } = useCartStore();

  const { toast } = useToast();

  const getCategoryIcon = (categoria: string | null) => {
    if (!categoria) return Smartphone;
    const cat = categoria.toLowerCase();
    if (cat.includes("fibra") || cat.includes("link dedicado")) return Wifi;
    if (cat.includes("móvel") || cat.includes("movel")) return Smartphone;
    if (cat.includes("office") || cat.includes("365")) return Briefcase;
    return Smartphone;
  };

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

  // Função para abrir modal de upsell (versão inteligente - mostra apenas 1 SVA)
  const handleIrParaCheckout = () => {
    // Ir direto para checkout - o upsell será carregado lá via API
    window.location.href = "/ecommerce/checkout";
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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-full lg:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h3 className="font-black text-lg text-gray-900">
              Resumo da Contratação
            </h3>
            <p className="text-sm text-gray-600">
              {getItemCount()}{" "}
              {getItemCount() === 1
                ? "plano selecionado"
                : "planos selecionados"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="transition-colors text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items List (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item, index) => {
            const operadoraNames: Record<string, string> = {
              V: "VIVO",
              C: "CLARO",
              T: "TIM",
            };

            const itemTotal = item.product.preco * item.quantidade;

            return (
              <div
                key={`${item.product.id}-${index}`}
                className="p-4 transition-all space-y-3 bg-white border border-gray-200 rounded-2xl shadow-sm"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const Icon = getCategoryIcon(item.product.categoria);
                        return <Icon className="h-5 w-5 stroke-[1.5] text-blue-600" />;
                      })()}
                      <h4 className="font-bold text-base text-gray-900">
                        {item.product.nome}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {item.product.operadora && (
                        <span className="font-semibold">
                          {operadoraNames[item.product.operadora] ||
                            item.product.operadora}
                        </span>
                      )}
                      {item.product.categoria && (
                        <>
                          <span>•</span>
                          <span>{item.product.categoria}</span>
                        </>
                      )}
                    </div>
                    {item.product.velocidade && (
                      <p className="text-xs text-slate-500 mt-1">
                        {item.product.velocidade}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-colors text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => removeItem(item.product.id, item.cartItemId)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* SVA Info - mostrar quantos podem ser adicionados ainda */}
                {item.categoria?.toLowerCase().includes('sva') && (
                  <div className="p-3 mb-2 bg-blue-50 border border-blue-500 rounded-xl">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          SVAs deste tipo no carrinho:
                        </span>
                        <span className="font-semibold text-blue-600">
                          {getSvaCount(item.product.id)} de {getTotalLinhas()}
                        </span>
                      </div>
                      {canAddMoreSva(item.product.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => addItem(item.product, 1)}
                          style={{
                            borderColor: "#1E90FF",
                            color: "#1E90FF",
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar mais um
                        </Button>
                      )}
                      {!canAddMoreSva(item.product.id) && (
                        <p className="text-[10px] text-orange-600 mt-1">
                          Limite atingido (1 SVA por linha contratada)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* GB Info */}
                {item.product.franquia && item.quantidade > 1 && (
                  <div className="p-3 bg-gray-50 border border-blue-500 rounded-xl">
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between text-blue-600">
                        <span className="font-medium">GB por linha:</span>
                        <span className="font-semibold">
                          {item.product.franquia}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-900">
                        <span className="font-bold">GB Total:</span>
                        <span className="font-bold text-base">
                          {(() => {
                            const gbMatch =
                              item.product.franquia?.match(/(\d+)\s*GB/i);
                            if (gbMatch) {
                              const gbPorLinha = parseInt(gbMatch[1]);
                              const gbTotal = gbPorLinha * item.quantidade;
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
                      <div
                        className="text-[10px] mt-1"
                        style={{ color: "#555555" }}
                      >
                        {item.quantidade} linha(s) × {item.product.franquia}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity Control */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">
                    Quantidade
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-0 transition-all rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantidade - 1, item.cartItemId)
                      }
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-10 text-center text-base font-bold text-gray-900">
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-0 transition-all rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white"
                      onClick={() => {
                        // Se for SVA, validar máximo baseado em linhas (1 por linha para cada tipo)
                        if (item.categoria === "sva") {
                          const linhasComSva = getLinhasComSva();
                          const svasDesteItem = getSvaCount(item.product.id);
                          
                          // Verificar se há linhas que suportam SVA
                          if (linhasComSva === 0) {
                            toast({
                              title: "Nenhum produto suporta SVA",
                              description: "Adicione um produto que aceite SVAs para poder incluir este serviço.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Só permite adicionar se não ultrapassar o limite para ESTE tipo de SVA
                          if (svasDesteItem < linhasComSva) {
                            updateQuantity(item.product.id, item.quantidade + 1, item.cartItemId);
                          } else {
                            toast({
                              title: "Limite atingido",
                              description: `Você já possui ${linhasComSva} unidade(s) deste SVA baseado nas ${linhasComSva} linha(s) que aceitam SVA.`,
                              variant: "destructive",
                            });
                          }
                        } else {
                          updateQuantity(item.product.id, item.quantidade + 1, item.cartItemId);
                        }
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Item Total & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Subtotal</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatPrice(itemTotal)}
                      <span className="text-sm font-normal text-gray-500">/mês</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-0 transition-all rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white"
                    onClick={() => duplicateItem(item.product.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Totals */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Subtotal</span>
              <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
            </div>

            {economia > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-600">Economia estimada</span>
                <span className="font-bold text-blue-600">-{formatPrice(economia)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-base font-bold text-gray-900">
                  Total Mensal
                </span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(total)}
                  </span>
                  <span className="text-sm ml-1 text-gray-500">/mês</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={closeCart}
                variant="outline"
                className="w-full h-12 font-medium border-2 border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Continuar Contratando
              </Button>
              
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleIrParaCheckout();
                }}
                href="#"
                className="flex items-center justify-center w-full h-12 px-8 font-semibold text-base transition-all shadow-sm hover:shadow-md cursor-pointer border-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Finalizar Contratação
                <ChevronRight className="w-5 h-5 ml-2" />
              </a>
            </div>

            <p className="text-xs text-center text-gray-600">
              {getItemCount()}{" "}
              {getItemCount() === 1
                ? "plano selecionado"
                : "planos selecionados"}
            </p>
          </div>
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
