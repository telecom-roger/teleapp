import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  useMultiLinhaStore,
  type AdicionalSelecionado,
} from "@/stores/multiLinhaStore";

interface ModalAdicionaisProps {
  linhaId: string;
  linhaNumero: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalAdicionais({
  linhaId,
  linhaNumero,
  isOpen,
  onClose,
}: ModalAdicionaisProps) {
  const { data: adicionais = [] } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/adicionais"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        "/api/ecommerce/public/adicionais",
        {}
      );
      return res.json();
    },
  });

  const addAdicional = useMultiLinhaStore((state) => state.addAdicional);
  const linha = useMultiLinhaStore((state) =>
    state.linhas.find((l) => l.id === linhaId)
  );

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  const handleAddAdicional = (adicional: any) => {
    const adicionalSelecionado: AdicionalSelecionado = {
      id: adicional.id,
      nome: adicional.nome,
      tipo: adicional.tipo,
      preco: adicional.preco,
      gbExtra:
        adicional.tipo === "gb-extra"
          ? parseInt(adicional.nome.match(/(\d+)\s*GB/i)?.[1] || "0")
          : undefined,
    };

    addAdicional(linhaId, adicionalSelecionado);
  };

  const jaAdicionado = (adicionalId: string) => {
    return linha?.adicionais.some((a) => a.id === adicionalId);
  };

  const adicionaisPorTipo = adicionais.reduce((acc: any, adicional: any) => {
    if (!acc[adicional.tipo]) acc[adicional.tipo] = [];
    acc[adicional.tipo].push(adicional);
    return acc;
  }, {});

  const tipoLabels: Record<string, string> = {
    "apps-ilimitados": "Apps Ilimitados",
    "gb-extra": "GB Extras",
    equipamento: "Equipamentos",
    licenca: "Licenças",
    servico: "Serviços",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar extras à Linha {linhaNumero}</DialogTitle>
          {linha && (
            <p className="text-sm text-slate-600 mt-2">
              Plano atual:{" "}
              <span className="font-semibold">{linha.plano.nome}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(adicionaisPorTipo).map(
            ([tipo, items]: [string, any]) => (
              <div key={tipo}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {tipoLabels[tipo] || tipo}
                  <Badge variant="outline">{(items as any[]).length}</Badge>
                </h3>

                <div className="grid md:grid-cols-2 gap-3">
                  {(items as any[]).map((adicional) => {
                    const adicionado = jaAdicionado(adicional.id);

                    return (
                      <Card
                        key={adicional.id}
                        className={`p-4 transition-all ${
                          adicionado
                            ? "border-2 border-green-500 bg-green-50"
                            : "hover:border-primary hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">
                              {adicional.nome}
                            </h4>
                            {adicional.descricao && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {adicional.descricao}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-base font-bold text-primary">
                              {formatPreco(adicional.preco)}
                            </div>
                            <div className="text-xs text-slate-500">/mês</div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={adicionado ? "secondary" : "default"}
                          className="w-full mt-2"
                          onClick={() => handleAddAdicional(adicional)}
                          disabled={adicionado}
                        >
                          {adicionado ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Adicionado
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar
                            </>
                          )}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
