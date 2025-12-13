import { useMultiLinhaStore } from "@/stores/multiLinhaStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Trash2, ShoppingCart, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import ModalAdicionais from "./ModalAdicionais";

const OPERADORA_COLORS: Record<
  string,
  { bg: string; text: string; name: string }
> = {
  V: { bg: "bg-purple-500", text: "text-purple-700", name: "VIVO" },
  C: { bg: "bg-red-500", text: "text-red-700", name: "CLARO" },
  T: { bg: "bg-blue-500", text: "text-blue-700", name: "TIM" },
};

export default function ResumoMultiLinhaDesktop() {
  const resumo = useMultiLinhaStore((state) => state.getResumoDetalhado());
  const removeLinha = useMultiLinhaStore((state) => state.removeLinha);
  const removeAdicional = useMultiLinhaStore((state) => state.removeAdicional);
  const linhas = useMultiLinhaStore((state) => state.linhas);
  const clearAll = useMultiLinhaStore((state) => state.clearAll);

  const [modalAberto, setModalAberto] = useState(false);
  const [linhaSelecionada, setLinhaSelecionada] = useState<{
    id: string;
    numero: number;
  } | null>(null);

  const abrirModalAdicionais = (linhaId: string, numeroLinha: number) => {
    setLinhaSelecionada({ id: linhaId, numero: numeroLinha });
    setModalAberto(true);
  };

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  if (resumo.numeroLinhas === 0) {
    return (
      <Card className="sticky top-4 h-fit">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Resumo da Contratação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum plano selecionado</p>
            <p className="text-xs mt-1">Adicione planos para ver o resumo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 h-fit shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Resumo da Contratação
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs"
          >
            Limpar tudo
          </Button>
        </div>

        {/* Badge com número de linhas */}
        <Badge variant="secondary" className="w-fit mt-2">
          {resumo.numeroLinhas} {resumo.numeroLinhas === 1 ? "linha" : "linhas"}
        </Badge>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {resumo.linhas.map((linha, index) => {
              const linhaCompleta = linhas[index];
              const operadoraConfig = OPERADORA_COLORS[linha.operadora] || {
                bg: "bg-slate-500",
                text: "text-slate-700",
                name: linha.operadora,
              };

              return (
                <div
                  key={linhaCompleta.id}
                  className="border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {/* Header da linha */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Linha {linha.numero}
                        </Badge>
                        <Badge
                          className={`${operadoraConfig.bg} text-white text-xs`}
                        >
                          {operadoraConfig.name}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{linha.plano}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLinha(linhaCompleta.id)}
                      className="h-6 w-6 p-0 text-slate-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Detalhes do plano */}
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-600">Plano base</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatPreco(linha.precoPlano)}
                      </span>
                      {linha.gbPlano > 0 && (
                        <span className="text-slate-500 ml-2">
                          {linha.gbPlano >= 999999
                            ? "Ilimitado"
                            : `${linha.gbPlano}GB`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Adicionais */}
                  {linha.adicionais.length > 0 && (
                    <div className="space-y-1 mt-2 pt-2 border-t">
                      {linha.adicionais.map((adicional) => (
                        <div
                          key={adicional.nome}
                          className="flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-1 flex-1">
                            <Plus className="w-3 h-3 text-primary" />
                            <span className="text-slate-600 truncate">
                              {adicional.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-medium">
                                {formatPreco(adicional.preco)}
                              </span>
                              {adicional.gb && (
                                <span className="text-slate-500 ml-1">
                                  +{adicional.gb}GB
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeAdicional(
                                  linhaCompleta.id,
                                  adicional.nome
                                )
                              }
                              className="h-5 w-5 p-0 text-slate-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subtotal da linha */}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Subtotal</span>
                    <div>
                      <span className="text-primary">
                        {formatPreco(linha.subtotalLinha)}
                      </span>
                      {linha.subtotalGB > 0 && (
                        <span className="text-slate-600 ml-2">
                          •{" "}
                          {linha.subtotalGB >= 999999
                            ? "Ilimitado"
                            : `${linha.subtotalGB}GB`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botão adicionar extras */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() =>
                      abrirModalAdicionais(linhaCompleta.id, linha.numero)
                    }
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar extras
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Totais Gerais */}
        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total de GB</span>
            <span className="text-lg font-bold text-primary">
              {resumo.totalGB >= 999999 ? "Ilimitado" : `${resumo.totalGB}GB`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Valor Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatPreco(resumo.totalPreco)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Valor mensal para {resumo.numeroLinhas}{" "}
            {resumo.numeroLinhas === 1 ? "linha" : "linhas"}
          </p>
        </div>

        {/* Botão de ação */}
        <Button className="w-full mt-4" size="lg">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Contratar Agora
        </Button>
      </CardContent>

      {/* Modal de Adicionais */}
      {linhaSelecionada && (
        <ModalAdicionais
          linhaId={linhaSelecionada.id}
          linhaNumero={linhaSelecionada.numero}
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setLinhaSelecionada(null);
          }}
        />
      )}
    </Card>
  );
}
