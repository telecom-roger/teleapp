import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type TipoPessoa = "PF" | "PJ";
type Modalidade = "novo" | "portabilidade";

interface SeletorRapidoProps {
  categorias: any[];
  onSearch?: (filtros: {
    tipoPessoa: TipoPessoa;
    modalidade: Modalidade | null;
    quantidadeLinhas: string | null;
    categoria: string | null;
    operadora: string | null;
  }) => void;
}

export default function SeletorRapido({
  categorias,
  onSearch,
}: SeletorRapidoProps) {
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("PF");
  const [modalidade, setModalidade] = useState<Modalidade | null>(null);
  const [quantidadeLinhas, setQuantidadeLinhas] = useState<string | null>(null);
  const [quantidadeCustom, setQuantidadeCustom] = useState<string>("");
  const [mostrarInputCustom, setMostrarInputCustom] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    string | null
  >(null);
  const [operadoraSelecionada, setOperadoraSelecionada] = useState<
    string | null
  >(null);

  // Limpar categorias incompatíveis quando mudar tipo de pessoa
  useEffect(() => {
    const categoriasExclusivasPJ = ["office", "pabx", "internet-dedicada"];
    if (
      tipoPessoa === "PF" &&
      categoriaSelecionada &&
      categoriasExclusivasPJ.includes(categoriaSelecionada)
    ) {
      setCategoriaSelecionada(null);
    }
  }, [tipoPessoa]);

  // Limpar quantidade de linhas quando mudar modalidade ou tipo de pessoa
  useEffect(() => {
    // Se não for portabilidade nem PJ, limpa a seleção de linhas
    if (modalidade !== "portabilidade" && tipoPessoa !== "PJ") {
      setQuantidadeLinhas(null);
      setMostrarInputCustom(false);
      setQuantidadeCustom("");
    }
  }, [modalidade, tipoPessoa]);

  const operadoras = [
    { value: "V", label: "VIVO" },
    { value: "C", label: "CLARO" },
    { value: "T", label: "TIM" },
  ];

  const handleBuscar = () => {
    if (onSearch) {
      onSearch({
        tipoPessoa,
        modalidade,
        quantidadeLinhas,
        categoria: categoriaSelecionada,
        operadora: operadoraSelecionada,
      });
    }
  };

  // Opções de quantidade de linhas baseadas no tipo de pessoa
  const opcoesLinhas =
    tipoPessoa === "PF"
      ? [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "5", label: "5" },
          { value: "6", label: "6" },
          { value: "7", label: "7" },
          { value: "custom", label: "Outro..." },
        ]
      : [
          { value: "2", label: "2" },
          { value: "5", label: "5" },
          { value: "10", label: "10" },
          { value: "15", label: "15" },
          { value: "20", label: "20" },
          { value: "30", label: "30" },
          { value: "50", label: "50" },
          { value: "custom", label: "Outro..." },
        ];

  const handleQuantidadeClick = (value: string) => {
    if (value === "custom") {
      setMostrarInputCustom(true);
      setQuantidadeLinhas(null);
    } else {
      setQuantidadeLinhas(value);
      setMostrarInputCustom(false);
      setQuantidadeCustom("");
    }
  };

  const handleCustomSubmit = () => {
    const num = parseInt(quantidadeCustom);
    if (num > 0 && num <= 999) {
      setQuantidadeLinhas(quantidadeCustom);
      setMostrarInputCustom(false);
    }
  };

  // Construir URL com parâmetros (SEM linhas - calculadora será na página)
  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    params.set("tipo", tipoPessoa);
    if (modalidade) params.set("modalidade", modalidade);
    // Removido: linhas - agora será calculado na própria página
    if (categoriaSelecionada) params.set("categoria", categoriaSelecionada);
    if (operadoraSelecionada) params.set("operadora", operadoraSelecionada);

    return `/app/planos?${params.toString()}`;
  };

  return (
    <Card className="border-0 shadow-2xl bg-white overflow-hidden">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* 1. Tipo de Cliente */}
        <div className="space-y-3">
          <label className="text-base font-bold block text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white text-sm font-bold">
              1
            </span>
            Para quem é o plano?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTipoPessoa("PF")}
              className={cn(
                "group relative h-auto py-6 px-4 flex flex-col items-center gap-3 rounded-xl border-2 transition-all duration-300",
                tipoPessoa === "PF"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1]/5 to-[#A855F7]/5 shadow-lg"
                  : "border-slate-200 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  tipoPessoa === "PF"
                    ? "bg-gradient-to-br from-[#6366F1] to-[#A855F7] shadow-lg"
                    : "bg-slate-100 group-hover:bg-slate-200"
                )}
              >
                <User
                  className={cn(
                    "w-6 h-6",
                    tipoPessoa === "PF" ? "text-white" : "text-slate-600"
                  )}
                />
              </div>
              <div className="text-center">
                <span className="font-bold text-base block text-slate-900">
                  Pessoa Física
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Para você e sua família
                </span>
              </div>
              {tipoPessoa === "PF" && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={() => setTipoPessoa("PJ")}
              className={cn(
                "group relative h-auto py-6 px-4 flex flex-col items-center gap-3 rounded-xl border-2 transition-all duration-300",
                tipoPessoa === "PJ"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1]/5 to-[#A855F7]/5 shadow-lg"
                  : "border-slate-200 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  tipoPessoa === "PJ"
                    ? "bg-gradient-to-br from-[#6366F1] to-[#A855F7] shadow-lg"
                    : "bg-slate-100 group-hover:bg-slate-200"
                )}
              >
                <Briefcase
                  className={cn(
                    "w-6 h-6",
                    tipoPessoa === "PJ" ? "text-white" : "text-slate-600"
                  )}
                />
              </div>
              <div className="text-center">
                <span className="font-bold text-base block text-slate-900">
                  Empresa
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Para sua equipe
                </span>
              </div>
              {tipoPessoa === "PJ" && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 2. Modalidade (Novo/Portabilidade) */}
        <div className="space-y-3">
          <label className="text-base font-bold block text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white text-sm font-bold">
              2
            </span>
            Como deseja contratar?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setModalidade("novo")}
              className={cn(
                "h-14 px-4 rounded-xl font-semibold border-2 transition-all duration-300",
                modalidade === "novo"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Novo número
            </button>
            <button
              onClick={() => setModalidade("portabilidade")}
              className={cn(
                "h-14 px-4 rounded-xl font-semibold border-2 transition-all duration-300",
                modalidade === "portabilidade"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Portabilidade
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 2.5. Quantidade de Linhas */}
        {(modalidade === "portabilidade" || tipoPessoa === "PJ") && (
          <div className="space-y-3">
            <label className="text-base font-bold block text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white text-sm font-bold">
                3
              </span>
              Quantas linhas você{" "}
              {modalidade === "portabilidade" ? "deseja portar" : "precisa"}?
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {opcoesLinhas.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => handleQuantidadeClick(opcao.value)}
                  className={cn(
                    "h-12 px-4 rounded-xl font-semibold border-2 transition-all duration-300",
                    quantidadeLinhas === opcao.value ||
                      (mostrarInputCustom && opcao.value === "custom")
                      ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                      : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {/* Input customizado */}
            {mostrarInputCustom && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <label className="text-sm font-bold text-blue-900 whitespace-nowrap">
                  Digite a quantidade:
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quantidadeCustom}
                  onChange={(e) => setQuantidadeCustom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  placeholder="Ex: 8"
                  className="flex-1 h-10 px-4 rounded-lg border-2 border-blue-300 focus:outline-none focus:border-[#6366F1] font-semibold text-slate-900"
                  autoFocus
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={
                    !quantidadeCustom || parseInt(quantidadeCustom) <= 0
                  }
                  className="h-10 px-6 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  OK
                </button>
              </div>
            )}

            {/* Badge mostrando quantidade custom selecionada */}
            {quantidadeLinhas &&
              !opcoesLinhas.some((o) => o.value === quantidadeLinhas) && (
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0 px-4 py-2">
                    ✓ {quantidadeLinhas} linhas selecionadas
                  </Badge>
                </div>
              )}

            <div className="flex items-start gap-3 text-xs text-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <p>
                <span className="font-bold">Importante:</span> Esta informação
                ajuda a calcular o valor total, GB acumulado e recomendar os
                melhores planos para cada linha.
              </p>
            </div>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 3. Categoria / Produto */}
        <div className="space-y-3">
          <label className="text-base font-bold block text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white text-sm font-bold">
              {modalidade === "portabilidade" || tipoPessoa === "PJ"
                ? "4"
                : "3"}
            </span>
            O que você precisa?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "fibra" ? null : "fibra"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "fibra"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Fibra Óptica
            </button>
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "movel" ? null : "movel"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "movel"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Telefonia Móvel
            </button>
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "tv" ? null : "tv"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "tv"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              TV
            </button>
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "combo" ? null : "combo"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "combo"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Combo
            </button>
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "aparelhos" ? null : "aparelhos"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "aparelhos"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Smartphones
            </button>
            <button
              onClick={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === "locacao" ? null : "locacao"
                )
              }
              className={cn(
                "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                categoriaSelecionada === "locacao"
                  ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                  : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
              )}
            >
              Locação
            </button>
            {tipoPessoa === "PJ" && (
              <>
                <button
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoriaSelecionada === "office" ? null : "office"
                    )
                  }
                  className={cn(
                    "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                    categoriaSelecionada === "office"
                      ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                      : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                  )}
                >
                  Office 365
                </button>
                <button
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoriaSelecionada === "pabx" ? null : "pabx"
                    )
                  }
                  className={cn(
                    "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                    categoriaSelecionada === "pabx"
                      ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                      : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                  )}
                >
                  PABX Virtual
                </button>
                <button
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoriaSelecionada === "internet-dedicada"
                        ? null
                        : "internet-dedicada"
                    )
                  }
                  className={cn(
                    "h-12 px-4 rounded-xl font-medium border-2 transition-all duration-300",
                    categoriaSelecionada === "internet-dedicada"
                      ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                      : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                  )}
                >
                  Internet Dedicada
                </button>
              </>
            )}
          </div>
          {tipoPessoa === "PF" && (
            <div className="flex items-start gap-3 text-xs text-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
              <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
              <p>
                <span className="font-bold">Dica:</span> Office 365, PABX
                Virtual e Internet Dedicada estão disponíveis apenas para
                empresas.
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 4. Operadora (opcional) */}
        <div className="space-y-3">
          <label className="text-base font-bold block text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-sm font-bold">
              {modalidade === "portabilidade" || tipoPessoa === "PJ"
                ? "5"
                : "4"}
            </span>
            Prefere alguma operadora?{" "}
            <span className="text-slate-500 font-normal text-sm">
              (opcional)
            </span>
          </label>
          <div className="flex gap-4 justify-center flex-wrap">
            {operadoras.map((op) => (
              <button
                key={op.value}
                onClick={() =>
                  setOperadoraSelecionada(
                    operadoraSelecionada === op.value ? null : op.value
                  )
                }
                className={cn(
                  "h-14 px-10 rounded-xl font-bold border-2 transition-all duration-300",
                  operadoraSelecionada === op.value
                    ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg scale-105"
                    : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de busca */}
        <div className="pt-4">
          <Link href={buildSearchUrl()}>
            <button
              className="w-full h-16 rounded-xl font-bold text-lg bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
              onClick={handleBuscar}
            >
              Ver planos recomendados
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
        </div>

        {/* Contador de filtros ativos */}
        {(modalidade ||
          quantidadeLinhas ||
          categoriaSelecionada ||
          operadoraSelecionada) && (
          <div className="text-center pt-2">
            <Badge className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0 px-4 py-2">
              {
                [
                  modalidade,
                  quantidadeLinhas,
                  categoriaSelecionada,
                  operadoraSelecionada,
                ].filter(Boolean).length
              }{" "}
              filtro(s) selecionado(s)
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
