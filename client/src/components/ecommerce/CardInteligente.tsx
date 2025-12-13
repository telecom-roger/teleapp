import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, Plus, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProdutoComScore } from "@/lib/recomendacao";
import { useMultiLinhaStore } from "@/stores/multiLinhaStore";

interface CardInteligenteProps {
  produto: ProdutoComScore;
  onAddToCart: (produto: any) => void;
  isRecomendado?: boolean;
  posicao?: number;
}

const OPERADORA_COLORS: Record<string, { name: string; badge: string }> = {
  V: {
    name: "VIVO",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  C: {
    name: "CLARO",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  T: {
    name: "TIM",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function CardInteligente({
  produto,
  onAddToCart,
  isRecomendado = false,
  posicao = 0,
}: CardInteligenteProps) {
  const colors = OPERADORA_COLORS[produto.operadora];
  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  const addLinha = useMultiLinhaStore((state) => state.addLinha);

  const handleAddLinha = () => {
    addLinha(produto);
  };

  // Definir estilo baseado na posição (top 3)
  const getCardStyle = () => {
    if (posicao === 0) {
      return "border border-slate-200 shadow-2xl scale-105"; // Melhor recomendação
    }
    if (posicao === 1 || posicao === 2) {
      return "border border-slate-200 shadow-xl"; // Segunda e terceira opções
    }
    return "border border-slate-200 shadow-lg";
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-white",
        getCardStyle()
      )}
    >

      {/* Badge de recomendação flutuante */}
      {produto.badgeRecomendacao && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white border-0 shadow-lg text-xs font-semibold px-3 py-1.5">
            {produto.badgeRecomendacao}
          </Badge>
        </div>
      )}

      {/* Badge "Recomendado" adicional para o top 1 */}
      {posicao === 0 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-[#8A4FFF] to-[#6A2FDF] text-white border-0 shadow-lg flex items-center gap-1 px-3 py-1.5">
            <Sparkles className="w-3 h-3" />
            Melhor Escolha
          </Badge>
        </div>
      )}

      <CardContent className="p-6 space-y-4 pt-8">
        {/* Header: Operadora + Nome */}
        <div>
          {colors && (
            <Badge variant="outline" className={cn("mb-3", colors.badge)}>
              {colors.name}
            </Badge>
          )}
          <h3 className="text-xl font-bold text-[#111111] mb-2 line-clamp-2 group-hover:text-[#0D1B2A] transition-colors">
            {produto.nome}
          </h3>
          <p className="text-sm text-[#555555] line-clamp-2">{produto.descricao}</p>
        </div>

        {/* Razão da recomendação (texto inteligente) */}
        {produto.razaoRecomendacao && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-900 font-medium flex items-start gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
              {produto.razaoRecomendacao}
            </p>
          </div>
        )}

        {/* Specs principais */}
        <div className="flex items-center gap-3 flex-wrap">
          {produto.velocidade && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-lg">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-slate-900">{produto.velocidade}</span>
            </div>
          )}
          {produto.franquia && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-lg">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-slate-900">{produto.franquia}</span>
            </div>
          )}
        </div>

        {/* Fidelidade */}
        {(produto.fidelidade ?? 0) > 0 ? (
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Fidelidade de {produto.fidelidade} meses
          </p>
        ) : (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Sem fidelidade
          </p>
        )}

        {/* Benefícios (top 3) */}
        {produto.beneficios && produto.beneficios.length > 0 && (
          <ul className="space-y-2">
            {produto.beneficios.slice(0, 3).map((beneficio: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#222222]">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{beneficio}</span>
              </li>
            ))}
          </ul>
        )}

        {/* SLA (para PJ) */}
        {produto.sla && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {produto.sla}
            </p>
          </div>
        )}

        {/* Preço */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-bold text-[#111111]">{formatPrice(produto.preco)}</span>
            <span className="text-sm text-[#666666]">/mês</span>
          </div>
          <div className="space-y-1">
            {(produto.precoInstalacao ?? 0) > 0 && (
              <p className="text-xs text-[#666666]">+ {formatPrice(produto.precoInstalacao!)} instalação</p>
            )}
            {(produto.linhasInclusas ?? 0) > 1 && (
              <p className="text-xs text-green-600 font-medium">✓ {produto.linhasInclusas} linhas inclusas</p>
            )}
          </div>
        </div>

        {/* Score (apenas para debug, remover em produção) */}
        {produto.scoreCalculado !== undefined && import.meta.env.DEV && (
          <p className="text-xs text-slate-400">Score: {produto.scoreCalculado.toFixed(1)}</p>
        )}

        {/* CTA - Duplo botão */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 h-12 border-2 hover:bg-slate-50"
            onClick={handleAddLinha}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm">Nova Linha</span>
          </Button>
          
          <Button
            size="lg"
            className={cn(
              "gap-2 h-12 shadow-md hover:shadow-xl transition-all duration-300 bg-[#007BFF] hover:bg-[#0056b3] text-white",
              posicao === 0 && "ring-2 ring-[#8A4FFF] ring-offset-2"
            )}
            onClick={() => onAddToCart(produto)}
          >
            <Check className="w-5 h-5" />
            <span className="text-sm font-semibold">Contratar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
