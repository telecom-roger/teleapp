import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

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

  // Escolher um texto aleatório do array ou usar padrão
  const textoSelecionado =
    textosPersonalizados && textosPersonalizados.length > 0
      ? processarTexto(
          textosPersonalizados[
            Math.floor(Math.random() * textosPersonalizados.length)
          ],
          svas
        )
      : "Aproveite para adicionar serviços extras ao seu pedido!";

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  ✨ Complemente seu plano
                </h2>
                <p className="text-white/90 text-sm">{textoSelecionado}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="hover:bg-white/20 text-white"
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
                  className={`
                    relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "border-[#6366F1] bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md"
                        : "border-gray-200 hover:border-[#6366F1]/50 hover:shadow-sm"
                    }
                  `}
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
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {sva.nome}
                          </h3>
                          {sva.descricao && (
                            <p className="text-sm text-gray-600">
                              {sva.descricao}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500 mb-1">+</p>
                          <p className="text-xl font-bold text-[#6366F1]">
                            {formatPrice(sva.preco)}
                          </p>
                          <p className="text-xs text-gray-500">/mês</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50 space-y-4">
            {selectedSvas.size > 0 && (
              <div className="bg-white rounded-lg p-4 border-2 border-[#6366F1]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {selectedSvas.size}{" "}
                      {selectedSvas.size === 1
                        ? "serviço selecionado"
                        : "serviços selecionados"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Valor adicional por mês
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-[#6366F1]">
                    {formatPrice(totalSelecionado)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-12"
              >
                Pular
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedSvas.size === 0}
                className="flex-1 h-12 bg-gradient-to-r from-[#6366F1] to-[#A855F7] hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {selectedSvas.size === 0
                  ? "Selecione serviços"
                  : `Adicionar (${selectedSvas.size})`}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Você pode gerenciar os serviços no carrinho antes de finalizar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
