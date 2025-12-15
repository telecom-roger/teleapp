import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    limparSvasOrfaos,
  } = useCartStore();

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

  // Função para abrir modal de upsell
  const handleIrParaCheckout = () => {
    // Limpar SVAs órfãos antes de verificar quais oferecer
    limparSvasOrfaos();

    // Coletar todos os SVAs únicos dos produtos no carrinho (baseado nos produtos principais)
    const svasIds = new Set<string>();
    let textosColetados: string[] = [];
    const planosNaoSvaIds = new Set<string>();

    items.forEach((item) => {
      // Coletar IDs dos planos principais (não SVA)
      if (item.categoria !== "sva") {
        planosNaoSvaIds.add(item.product.id);
      }

      if (item.svasUpsell && item.svasUpsell.length > 0) {
        item.svasUpsell.forEach((svaId: string) => svasIds.add(svaId));
        // Coletar todos os textos encontrados
        if (item.textosUpsell && item.textosUpsell.length > 0) {
          textosColetados = [...textosColetados, ...item.textosUpsell];
        }
      }
    });

    // Remover SVAs que já estão no carrinho E estão associados a planos que ainda existem
    const svasJaNoCarrinho = new Set(
      items
        .filter((item) => {
          // Só considerar SVA como "já no carrinho" se:
          // 1. É um SVA
          // 2. Está associado a um plano que ainda existe no carrinho
          return (
            item.categoria === "sva" &&
            item.planoPrincipalId &&
            planosNaoSvaIds.has(item.planoPrincipalId)
          );
        })
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

  const handleAdicionarSvas = (svaQuantidades: Map<string, number>) => {
    // Encontrar o primeiro plano principal (não SVA) no carrinho para associar os SVAs
    const planoPrincipal = items.find((item) => item.categoria !== "sva");

    if (!planoPrincipal) {
      // Não deveria acontecer, mas como fallback vai direto para checkout
      window.location.href = "/ecommerce/checkout";
      return;
    }

    // Adicionar SVAs selecionados ao carrinho com suas quantidades
    svaQuantidades.forEach((quantidade, svaId) => {
      const sva = todosOsProdutos.find((p) => p.id === svaId);
      if (sva && quantidade > 0) {
        addItem(sva, quantidade, planoPrincipal.product.id);
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
        <div
          className="flex items-center justify-between p-4"
          style={{
            borderBottom: "1px solid #E0E0E0",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div>
            <h3 className="font-black text-lg" style={{ color: "#111111" }}>
              Resumo da Contratação
            </h3>
            <p className="text-sm" style={{ color: "#555555" }}>
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
            className="transition-colors"
            style={{ color: "#555555" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#111111")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
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
                className="p-4 transition-all space-y-3"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const Icon = getCategoryIcon(item.product.categoria);
                        return (
                          <Icon
                            className="h-5 w-5 stroke-[1.5]"
                            style={{ color: "#1E90FF" }}
                          />
                        );
                      })()}
                      <h4
                        className="font-bold text-base"
                        style={{ color: "#111111" }}
                      >
                        {item.product.nome}
                      </h4>
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "#555555" }}
                    >
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
                    className="h-8 w-8 transition-colors"
                    style={{ color: "#555555" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#FF6B35";
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,107,53,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#555555";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => removeItem(item.product.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* GB Info */}
                {item.product.franquia && item.quantidade > 1 && (
                  <div
                    className="p-3"
                    style={{
                      backgroundColor: "#FAFAFA",
                      border: "1px solid #1E90FF",
                      borderRadius: "12px",
                    }}
                  >
                    <div className="text-xs space-y-1.5">
                      <div
                        className="flex justify-between"
                        style={{ color: "#1E90FF" }}
                      >
                        <span className="font-medium">GB por linha:</span>
                        <span className="font-semibold">
                          {item.product.franquia}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ color: "#111111" }}
                      >
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
                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: "1px solid #E0E0E0" }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#111111" }}
                  >
                    Quantidade
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-0 transition-all"
                      style={{
                        backgroundColor: "#FAFAFA",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1E90FF";
                        e.currentTarget.style.color = "#FFFFFF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FAFAFA";
                        e.currentTarget.style.color = "";
                      }}
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantidade - 1)
                      }
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span
                      className="w-10 text-center text-base font-bold"
                      style={{ color: "#111111" }}
                    >
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-0 transition-all"
                      style={{
                        backgroundColor: "#FAFAFA",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1E90FF";
                        e.currentTarget.style.color = "#FFFFFF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FAFAFA";
                        e.currentTarget.style.color = "";
                      }}
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantidade + 1)
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Item Total & Actions */}
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: "1px solid #E0E0E0" }}
                >
                  <div>
                    <p className="text-xs" style={{ color: "#555555" }}>
                      Subtotal
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: "#1E90FF" }}
                    >
                      {formatPrice(itemTotal)}
                      <span
                        className="text-sm font-normal"
                        style={{ color: "#555555" }}
                      >
                        /mês
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-0 transition-all"
                    style={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1E90FF";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FAFAFA";
                      e.currentTarget.style.color = "";
                    }}
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
        <div
          className="p-4"
          style={{ borderTop: "1px solid #E0E0E0", backgroundColor: "#FAFAFA" }}
        >
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium" style={{ color: "#555555" }}>
                Subtotal
              </span>
              <span className="font-bold" style={{ color: "#111111" }}>
                {formatPrice(subtotal)}
              </span>
            </div>

            {economia > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium" style={{ color: "#1E90FF" }}>
                  Economia estimada
                </span>
                <span className="font-bold" style={{ color: "#1E90FF" }}>
                  -{formatPrice(economia)}
                </span>
              </div>
            )}

            <div className="pt-3" style={{ borderTop: "1px solid #E0E0E0" }}>
              <div className="flex justify-between items-baseline mb-1">
                <span
                  className="text-base font-bold"
                  style={{ color: "#111111" }}
                >
                  Total Mensal
                </span>
                <div className="text-right">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#1E90FF" }}
                  >
                    {formatPrice(total)}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "#555555" }}>
                    /mês
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleIrParaCheckout();
                }}
                href="#"
                className="flex items-center justify-center w-full h-12 px-8 font-bold text-base transition-all shadow-lg cursor-pointer border-0"
                style={{
                  backgroundColor: "#1E90FF",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#00CFFF";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1E90FF";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Finalizar Contratação
                <ChevronRight className="w-5 h-5 ml-2" />
              </a>
              <button
                type="button"
                className="flex items-center justify-center w-full h-12 px-8 font-bold text-base transition-all shadow cursor-pointer border-0 bg-white text-[#1E90FF] border border-[#1E90FF] rounded-[12px] hover:bg-[#F0F8FF]"
                onClick={closeCart}
                style={{ marginTop: 4 }}
              >
                <span>Continuar contratando</span>
              </button>
            </div>

            <p className="text-xs text-center" style={{ color: "#555555" }}>
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
        quantidadeMaxima={items
          .filter((item) => item.categoria !== "sva")
          .reduce((sum, item) => sum + item.quantidade, 0)}
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
