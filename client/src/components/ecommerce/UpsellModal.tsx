import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface SVAProduct {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
}

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  svas: SVAProduct[];
  textosPersonalizados: string[] | null; // Array de textos para randomizar
  onAddToCart: (svaIds: string[]) => void;
}

// Função para processar variáveis dinâmicas no texto
function processarTexto(texto: string, svasProdutos: SVAProduct[]): string {
  // Se houver múltiplos SVAs, usar o primeiro para o exemplo
  if (svasProdutos.length === 0) return texto;

  const svaExemplo = svasProdutos[0];
  const preco = (svaExemplo.preco / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return texto
    .replace(/\[nome_servico\]/g, svaExemplo.nome)
    .replace(/\[preco\]/g, preco);
}

export function UpsellModal({
  isOpen,
  onClose,
  svas,
  textosPersonalizados,
  onAddToCart,
}: UpsellModalProps) {
  const [selectedSvas, setSelectedSvas] = useState<Set<string>>(new Set());
  const [textoSelecionado, setTextoSelecionado] = useState("");

  // Escolher texto APENAS quando o modal abrir (isOpen = true)
  useEffect(() => {
    if (isOpen) {
      if (textosPersonalizados && textosPersonalizados.length > 0) {
        const textoAleatorio =
          textosPersonalizados[
            Math.floor(Math.random() * textosPersonalizados.length)
          ];
        setTextoSelecionado(processarTexto(textoAleatorio, svas));
      } else {
        setTextoSelecionado(
          "Aproveite para adicionar serviços extras ao seu pedido!"
        );
      }
    }
  }, [isOpen]); // Só executa quando isOpen mudar

  if (!isOpen || svas.length === 0) return null;

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const toggleSva = (svaId: string) => {
    const newSelected = new Set(selectedSvas);
    if (newSelected.has(svaId)) {
      newSelected.delete(svaId);
    } else {
      newSelected.add(svaId);
    }
    setSelectedSvas(newSelected);
  };

  const handleConfirm = () => {
    onAddToCart(Array.from(selectedSvas));
    setSelectedSvas(new Set());
    onClose();
  };

  const handleSkip = () => {
    setSelectedSvas(new Set());
    onClose();
  };

  const totalSelecionado = svas
    .filter((sva) => selectedSvas.has(sva.id))
    .reduce((sum, sva) => sum + sva.preco, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
        }}
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-6"
            style={{
              backgroundColor: "#1E90FF",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  ✨ Complemente seu plano
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {textoSelecionado}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="transition-colors"
                style={{ color: "#FFFFFF" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {svas.map((sva) => {
              const isSelected = selectedSvas.has(sva.id);
              return (
                <div
                  key={sva.id}
                  onClick={() => toggleSva(sva.id)}
                  className="relative p-4 cursor-pointer transition-all duration-200"
                  style={{
                    border: isSelected
                      ? "2px solid #1E90FF"
                      : "2px solid #E0E0E0",
                    borderRadius: "12px",
                    backgroundColor: isSelected
                      ? "rgba(30,144,255,0.05)"
                      : "#FFFFFF",
                    boxShadow: isSelected
                      ? "0 4px 12px rgba(30,144,255,0.15)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#1E90FF";
                      e.currentTarget.style.backgroundColor =
                        "rgba(30,144,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#E0E0E0";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSva(sva.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className="font-bold text-lg mb-1"
                            style={{ color: "#111111" }}
                          >
                            {sva.nome}
                          </h3>
                          {sva.descricao && (
                            <p className="text-sm" style={{ color: "#555555" }}>
                              {sva.descricao}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className="text-xs mb-1"
                            style={{ color: "#555555" }}
                          >
                            +
                          </p>
                          <p
                            className="text-xl font-bold"
                            style={{ color: "#1E90FF" }}
                          >
                            {formatPrice(sva.preco)}
                          </p>
                          <p className="text-xs" style={{ color: "#555555" }}>
                            /mês
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="p-6 space-y-4"
            style={{
              backgroundColor: "#FAFAFA",
              borderTop: "1px solid #E0E0E0",
            }}
          >
            {selectedSvas.size > 0 && (
              <div
                className="p-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #1E90FF",
                  borderRadius: "12px",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#111111" }}
                    >
                      {selectedSvas.size}{" "}
                      {selectedSvas.size === 1
                        ? "serviço selecionado"
                        : "serviços selecionados"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#555555" }}>
                      Valor adicional por mês
                    </p>
                  </div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#1E90FF" }}
                  >
                    {formatPrice(totalSelecionado)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-12 font-semibold transition-all"
                style={{
                  border: "1px solid #E0E0E0",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1E90FF";
                  e.currentTarget.style.backgroundColor =
                    "rgba(30,144,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E0E0E0";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
              >
                Pular
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedSvas.size === 0}
                className="flex-1 h-12 font-bold shadow-lg border-0 transition-all duration-200"
                style={{
                  backgroundColor:
                    selectedSvas.size === 0 ? "#CCCCCC" : "#1E90FF",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                }}
                onMouseEnter={(e) => {
                  if (selectedSvas.size > 0) {
                    e.currentTarget.style.backgroundColor = "#00CFFF";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSvas.size > 0) {
                    e.currentTarget.style.backgroundColor = "#1E90FF";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {selectedSvas.size === 0
                  ? "Selecione serviços"
                  : `Adicionar (${selectedSvas.size})`}
              </Button>
            </div>

            <p className="text-xs text-center" style={{ color: "#555555" }}>
              Você pode gerenciar os serviços no carrinho antes de finalizar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
