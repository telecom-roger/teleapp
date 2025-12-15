import { X, ShoppingCart, Smartphone, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  franquia: string | null;
  velocidade: string | null;
}

interface CalculadoraMultiLinhasSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Product | null;
  quantidade: number;
  onQuantidadeChange: (value: number) => void;
  onContratar: () => void;
}

function extrairGB(franquia: string | null): number {
  if (!franquia) return 0;
  if (franquia.toLowerCase().includes("ilimitado")) return 999999;
  const match = franquia.match(/(\d+)\s*GB/i);
  return match ? parseInt(match[1]) : 0;
}

export function CalculadoraMultiLinhasSidebar({
  isOpen,
  onClose,
  produto,
  quantidade,
  onQuantidadeChange,
  onContratar,
}: CalculadoraMultiLinhasSidebarProps) {
  if (!isOpen || !produto) return null;

  const gbPorLinha = extrairGB(produto.franquia);
  const gbTotal = gbPorLinha * quantidade;
  const precoTotal = produto.preco * quantidade;

  const formatarGB = (gb: number) => {
    if (gb >= 999999) return "Ilimitado";
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)}TB`;
    return `${gb}GB`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Calculadora Múltiplas Linhas
              </h2>
              <p className="text-sm text-gray-600">Configure seu plano</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-white/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Produto Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
              <h3 className="font-semibold text-gray-900 mb-1">
                {produto.nome}
              </h3>
              <p className="text-sm text-gray-600">{produto.descricao}</p>
            </div>

            {/* Quantidade de Linhas */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                Quantidade de Linhas
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    onQuantidadeChange(Math.max(1, quantidade - 1))
                  }
                  disabled={quantidade <= 1}
                  className="h-10 w-10 rounded-lg border-2 hover:border-indigo-500 hover:text-indigo-600"
                >
                  -
                </Button>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    onQuantidadeChange(Math.max(1, Math.min(50, val)));
                  }}
                  className="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  min="1"
                  max="50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    onQuantidadeChange(Math.min(50, quantidade + 1))
                  }
                  disabled={quantidade >= 50}
                  className="h-10 w-10 rounded-lg border-2 hover:border-indigo-500 hover:text-indigo-600"
                >
                  +
                </Button>
              </div>
            </div>

            {/* GB Calculation */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800 mb-3">
                <Wifi className="h-5 w-5" />
                <h4 className="font-semibold">Internet Total</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Por linha:</span>
                  <span className="font-semibold text-gray-900">
                    {formatarGB(gbPorLinha)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-semibold text-gray-900">
                    {quantidade} {quantidade === 1 ? "linha" : "linhas"}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatarGB(gbTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preço Calculation */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 space-y-2 border border-emerald-200">
              <h4 className="font-semibold text-emerald-800 mb-3">
                Valor Total
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor por linha:</span>
                  <span className="font-semibold text-gray-900">
                    R$ {produto.preco.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-semibold text-gray-900">
                    {quantidade}x
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total:</span>
                    <span className="text-3xl font-bold text-emerald-600">
                      R$ {precoTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">/mês</p>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                💡 <strong>Economia:</strong> Contratando {quantidade} linhas
                você economiza na gestão e tem melhor controle dos gastos.
              </p>
            </div>
          </div>

          {/* Footer - Botão Contratar */}
          <div className="p-4 border-t bg-gray-50">
            <Button
              onClick={onContratar}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Contratar Agora
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              {quantidade} {quantidade === 1 ? "linha" : "linhas"} •{" "}
              {formatarGB(gbTotal)} • R$ {precoTotal.toFixed(2)}/mês
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
