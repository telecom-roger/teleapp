import { useMultiLinhaStore } from "@/stores/multiLinhaStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, ShoppingCart, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const OPERADORA_COLORS: Record<
  string,
  { bg: string; text: string; name: string }
> = {
  V: { bg: "bg-purple-500", text: "text-purple-700", name: "VIVO" },
  C: { bg: "bg-red-500", text: "text-red-700", name: "CLARO" },
  T: { bg: "bg-blue-500", text: "text-blue-700", name: "TIM" },
};

export default function ResumoMultiLinhaMobile() {
  const resumo = useMultiLinhaStore((state) => state.getResumoDetalhado());
  const removeLinha = useMultiLinhaStore((state) => state.removeLinha);
  const removeAdicional = useMultiLinhaStore((state) => state.removeAdicional);
  const linhas = useMultiLinhaStore((state) => state.linhas);
  const clearAll = useMultiLinhaStore((state) => state.clearAll);
  const isOpen = useMultiLinhaStore((state) => state.isResumoOpen);
  const toggleResumo = useMultiLinhaStore((state) => state.toggleResumo);

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  return (
    <>
      {/* Botão flutuante fixo no rodapé (mobile) */}
      {resumo.numeroLinhas > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-safe">
          <div className="max-w-md mx-auto px-4">
            <Button
              className="w-full shadow-xl border-2 border-primary/20"
              size="lg"
              onClick={toggleResumo}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs font-normal opacity-90">
                      {resumo.numeroLinhas}{" "}
                      {resumo.numeroLinhas === 1 ? "linha" : "linhas"}
                      {resumo.totalGB > 0 &&
                        ` • ${
                          resumo.totalGB >= 999999
                            ? "Ilimitado"
                            : `${resumo.totalGB}GB`
                        }`}
                    </div>
                    <div className="text-lg font-bold">
                      {formatPreco(resumo.totalPreco)}
                    </div>
                  </div>
                </div>
                <span className="text-sm">Ver resumo →</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Sheet/Drawer com detalhes */}
      <Sheet open={isOpen} onOpenChange={toggleResumo}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Resumo da Contratação
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs"
              >
                Limpar tudo
              </Button>
            </div>

            {resumo.numeroLinhas > 0 && (
              <Badge variant="secondary" className="w-fit">
                {resumo.numeroLinhas}{" "}
                {resumo.numeroLinhas === 1 ? "linha" : "linhas"}
              </Badge>
            )}
          </SheetHeader>

          {resumo.numeroLinhas === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Nenhum plano selecionado</p>
              <p className="text-xs mt-1">Adicione planos para ver o resumo</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(85vh-220px)]">
                <div className="space-y-4 pr-4">
                  {resumo.linhas.map((linha, index) => {
                    const linhaCompleta = linhas[index];
                    const operadoraConfig = OPERADORA_COLORS[
                      linha.operadora
                    ] || {
                      bg: "bg-slate-500",
                      text: "text-slate-700",
                      name: linha.operadora,
                    };

                    return (
                      <div
                        key={linhaCompleta.id}
                        className="border-2 rounded-xl p-4 bg-white shadow-sm"
                      >
                        {/* Header da linha */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                Linha {linha.numero}
                              </Badge>
                              <Badge
                                className={`${operadoraConfig.bg} text-white`}
                              >
                                {operadoraConfig.name}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-base">
                              {linha.plano}
                            </h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLinha(linhaCompleta.id)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* Detalhes do plano */}
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-slate-600">Plano base</span>
                          <div className="text-right font-medium">
                            <span>{formatPreco(linha.precoPlano)}</span>
                            {linha.gbPlano > 0 && (
                              <span className="text-slate-500 ml-2">
                                {linha.gbPlano}GB
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Adicionais */}
                        {linha.adicionais.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <p className="text-xs text-slate-500 font-medium mb-2">
                              Adicionais:
                            </p>
                            {linha.adicionais.map((adicional) => (
                              <div
                                key={adicional.nome}
                                className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <Plus className="w-4 h-4 text-primary" />
                                  <span className="text-slate-700 truncate">
                                    {adicional.nome}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-medium">
                                      {formatPreco(adicional.preco)}
                                    </span>
                                    {adicional.gb && (
                                      <span className="text-slate-500 text-xs ml-1">
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
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Subtotal da linha */}
                        <Separator className="my-3" />
                        <div className="flex justify-between font-semibold">
                          <span>Subtotal</span>
                          <div>
                            <span className="text-primary text-lg">
                              {formatPreco(linha.subtotalLinha)}
                            </span>
                            {linha.subtotalGB > 0 && (
                              <span className="text-slate-600 ml-2 text-sm">
                                •{" "}
                                {linha.subtotalGB >= 999999
                                  ? "Ilimitado"
                                  : `${linha.subtotalGB}GB`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Totais Gerais - Fixo no rodapé do sheet */}
              <div className="border-t-2 pt-4 mt-4 bg-white">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total de GB</span>
                    <span className="text-xl font-bold text-primary">
                      {resumo.totalGB >= 999999
                        ? "Ilimitado"
                        : `${resumo.totalGB}GB`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-base text-slate-600">
                      Valor Total
                    </span>
                    <span className="text-3xl font-bold text-primary">
                      {formatPreco(resumo.totalPreco)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Valor mensal para {resumo.numeroLinhas}{" "}
                    {resumo.numeroLinhas === 1 ? "linha" : "linhas"}
                  </p>
                </div>

                {/* Botão de ação */}
                <Button className="w-full mt-4" size="lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Contratar Agora
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
