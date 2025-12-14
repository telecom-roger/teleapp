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
          <div
            className="flex items-center justify-between p-4"
            style={{
              borderBottom: "1px solid #E0E0E0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div>
              <h2 className="text-lg font-black" style={{ color: "#111111" }}>
                Calculadora Múltiplas Linhas
              </h2>
              <p className="text-sm" style={{ color: "#555555" }}>
                Configure seu plano
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="transition-colors"
              style={{ color: "#555555" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#111111")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Produto Info */}
            <div
              className="p-4"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const Icon = getCategoryIcon(null);
                  return (
                    <Icon
                      className="h-5 w-5 stroke-[1.5]"
                      style={{ color: "#1E90FF" }}
                    />
                  );
                })()}
                <h3 className="font-bold" style={{ color: "#111111" }}>
                  {produto.nome}
                </h3>
              </div>
              <p className="text-sm" style={{ color: "#555555" }}>
                {produto.descricao}
              </p>
            </div>

            {/* Quantidade de Linhas */}
            <div className="space-y-3">
              <label
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: "#111111" }}
              >
                <Smartphone className="h-4 w-4" style={{ color: "#1E90FF" }} />
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
                  className="h-10 w-10 border-0 transition-all"
                  style={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
                  onMouseEnter={(e) => {
                    if (quantidade > 1) {
                      e.currentTarget.style.backgroundColor = "#1E90FF";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FAFAFA";
                    e.currentTarget.style.color = "";
                  }}
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
                  className="w-20 text-center text-xl font-bold py-2 outline-none"
                  style={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    color: "#111111",
                  }}
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
                  className="h-10 w-10 border-0 transition-all"
                  style={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
                  onMouseEnter={(e) => {
                    if (quantidade < 50) {
                      e.currentTarget.style.backgroundColor = "#1E90FF";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FAFAFA";
                    e.currentTarget.style.color = "";
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            {/* GB Calculation */}
            <div
              className="p-4 space-y-2"
              style={{
                backgroundColor: "#FAFAFA",
                border: "1px solid #1E90FF",
                borderRadius: "12px",
              }}
            >
              <div
                className="flex items-center gap-2 mb-3"
                style={{ color: "#1E90FF" }}
              >
                <Wifi className="h-5 w-5" />
                <h4 className="font-bold">Internet Total</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#555555" }}>Por linha:</span>
                  <span className="font-bold" style={{ color: "#111111" }}>
                    {formatarGB(gbPorLinha)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#555555" }}>Quantidade:</span>
                  <span className="font-bold" style={{ color: "#111111" }}>
                    {quantidade} {quantidade === 1 ? "linha" : "linhas"}
                  </span>
                </div>
                <div
                  className="pt-2"
                  style={{ borderTop: "1px solid #E0E0E0" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: "#111111" }}>
                      Total:
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "#1E90FF" }}
                    >
                      {formatarGB(gbTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preço Calculation */}
            <div
              className="p-4 space-y-2"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
              }}
            >
              <h4 className="font-bold mb-3" style={{ color: "#111111" }}>
                Valor Total
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#555555" }}>Valor por linha:</span>
                  <span className="font-bold" style={{ color: "#111111" }}>
                    R$ {(produto.preco / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#555555" }}>Quantidade:</span>
                  <span className="font-bold" style={{ color: "#111111" }}>
                    {quantidade}x
                  </span>
                </div>
                <div
                  className="pt-2"
                  style={{ borderTop: "1px solid #E0E0E0" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: "#111111" }}>
                      Total:
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "#1E90FF" }}
                    >
                      R$ {(precoTotal / 100).toFixed(2)}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1 text-right"
                    style={{ color: "#555555" }}
                  >
                    /mês
                  </p>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div
              className="p-3"
              style={{
                backgroundColor: "rgba(30,144,255,0.1)",
                border: "1px solid #1E90FF",
                borderRadius: "12px",
              }}
            >
              <p className="text-xs" style={{ color: "#1E90FF" }}>
                💡 <strong>Economia:</strong> Contratando {quantidade} linhas
                você economiza na gestão e tem melhor controle dos gastos.
              </p>
            </div>
          </div>

          {/* Footer - Botão Contratar */}
          <div
            className="p-4"
            style={{
              borderTop: "1px solid #E0E0E0",
              backgroundColor: "#FAFAFA",
            }}
          >
            <Button
              onClick={onContratar}
              className="w-full h-12 font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border-0"
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
              <ShoppingCart className="h-5 w-5" />
              Contratar Agora
            </Button>
            <p
              className="text-xs text-center mt-2"
              style={{ color: "#555555" }}
            >
              {quantidade} {quantidade === 1 ? "linha" : "linhas"} •{" "}
              {formatarGB(gbTotal)} • R$ {(precoTotal / 100).toFixed(2)}/mês
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
