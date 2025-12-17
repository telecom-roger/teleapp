import { X, ShoppingCart, Smartphone, Wifi, Briefcase } from "lucide-react";
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

function getCategoryIcon(categoria: string | null) {
  if (!categoria) return Smartphone;
  const cat = categoria.toLowerCase();
  if (cat.includes("fibra") || cat.includes("link dedicado")) return Wifi;
  if (cat.includes("móvel") || cat.includes("movel")) return Smartphone;
  if (cat.includes("office") || cat.includes("365")) return Briefcase;
  return Smartphone;
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Calculadora Múltiplas Linhas
              </h2>
              <p className="text-sm text-gray-600">
                Configure seu plano
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="transition-colors text-gray-600 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Produto Info */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const Icon = getCategoryIcon(null);
                  return <Icon className="h-5 w-5 stroke-[1.5] text-blue-600" />;
                })()}
                <h3 className="font-bold text-gray-900">{produto.nome}</h3>
              </div>
              <p className="text-sm text-gray-600">{produto.descricao}</p>
            </div>

            {/* Quantidade de Linhas */}
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2 text-gray-900">
                <Smartphone className="h-4 w-4 text-blue-600" />
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
                  className="h-10 w-10 border-0 transition-all rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white"
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
                  className="w-20 text-center text-xl font-bold py-2 outline-none border border-gray-300 rounded-xl text-gray-900"
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
                  className="h-10 w-10 border-0 transition-all rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white"
                >
                  +
                </Button>
              </div>
            </div>

            {/* GB Calculation */}
            <div className="p-4 space-y-2 bg-blue-50 border border-blue-500 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <Wifi className="h-5 w-5" />
                <h4 className="font-bold">Internet Total</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Por linha:</span>
                  <span className="font-bold text-gray-900">{formatarGB(gbPorLinha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-bold text-gray-900">
                    {quantidade} {quantidade === 1 ? "linha" : "linhas"}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatarGB(gbTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preço Calculation */}
            <div className="p-4 space-y-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <h4 className="font-bold mb-3 text-gray-900">Valor Total</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor por linha:</span>
                  <span className="font-bold text-gray-900">
                    R$ {(produto.preco / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-bold text-gray-900">{quantidade}x</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      R$ {(precoTotal / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-right text-gray-500">/mês</p>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="p-3 bg-blue-50 border border-blue-500 rounded-xl">
              <p className="text-xs text-blue-700">
                💡 <strong>Mais linhas, menos complicação:</strong> Centralize {quantidade} linhas em uma única contratação e simplifique o dia a dia.
              </p>
            </div>
          </div>

          {/* Footer - Botão Contratar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={onContratar}
              className="w-full h-12 font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShoppingCart className="h-5 w-5" />
              Contratar Agora
            </Button>
            <p className="text-xs text-center mt-2 text-gray-600">
              {quantidade} {quantidade === 1 ? "linha" : "linhas"} •{" "}
              {formatarGB(gbTotal)} • R$ {(precoTotal / 100).toFixed(2)}/mês
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
