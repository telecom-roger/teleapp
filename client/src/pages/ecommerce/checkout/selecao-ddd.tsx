import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCheckoutDdd } from "@/contexts/CheckoutDddContext";
import { useCartStore } from "@/stores/cartStore";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lista de DDDs válidos no Brasil
const DDDS_VALIDOS = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19", // SP
  "21", "22", "24", // RJ
  "27", "28", // ES
  "31", "32", "33", "34", "35", "37", "38", // MG
  "41", "42", "43", "44", "45", "46", // PR
  "47", "48", "49", // SC
  "51", "53", "54", "55", // RS
  "61", // DF
  "62", "64", // GO
  "63", // TO
  "65", "66", // MT
  "67", // MS
  "68", // AC
  "69", // RO
  "71", "73", "74", "75", "77", // BA
  "79", // SE
  "81", "87", // PE
  "82", // AL
  "83", // PB
  "84", // RN
  "85", "88", // CE
  "86", "89", // PI
  "91", "93", "94", // PA
  "92", "97", // AM
  "95", // RR
  "96", // AP
  "98", "99", // MA
];

export default function SelecaoDdd() {
  const [, navigate] = useLocation();
  const { items } = useCartStore();
  
  // Verificar se o cliente está logado
  const { data: customerData } = useQuery<any>({
    queryKey: ["/api/app/auth/customer"],
    retry: false,
  });
  
  const {
    totalLinhas,
    setTotalLinhas,
    distribuirDdds,
    setDistribuirDdds,
    distribuicao,
    addDdd,
    removeDdd,
    updateDdd,
    resetDdds,
    isValid,
    linhasRestantes,
  } = useCheckoutDdd();

  const [dddUnico, setDddUnico] = useState("");
  const [novoDdd, setNovoDdd] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [erro, setErro] = useState("");
  
  // Ajustar distribuirDdds automaticamente baseado no totalLinhas
  useEffect(() => {
    if (totalLinhas > 1 && !distribuirDdds && distribuicao.length === 0) {
      // Não ativar automaticamente, deixar usuário escolher
    }
  }, [totalLinhas, distribuirDdds, distribuicao.length]);

  // Calcular total de linhas do carrinho
  useEffect(() => {
    const total = items.reduce((acc, item) => {
      const categoria = item.product?.categoria?.toLowerCase() || "";
      if (categoria === "movel") {
        return acc + item.quantidade;
      }
      return acc;
    }, 0);
    if (total !== totalLinhas) {
      setTotalLinhas(total);
    }
  }, [items, setTotalLinhas, totalLinhas]);

  // Verificar se há produtos móveis no carrinho
  const temProdutosMoveis = items.some(
    (item) => item.product?.categoria?.toLowerCase() === "movel"
  );

  // Se não tem produtos móveis, pular esta etapa
  useEffect(() => {
    console.log("📍 [SELEÇÃO DDD] Verificando se deve mostrar página:");
    console.log("   items.length:", items.length);
    console.log("   temProdutosMoveis:", temProdutosMoveis);
    console.log("   totalLinhas:", totalLinhas);
    
    // Só pular se já tiver carregado os items e não tiver móveis
    if (items.length > 0 && !temProdutosMoveis) {
      console.log("⏭️ [SELEÇÃO DDD] Sem produtos móveis, pulando para confirmação");
      navigate("/app/checkout/confirmacao");
    } else if (temProdutosMoveis) {
      console.log("✅ [SELEÇÃO DDD] Página deve ser exibida!");
    } else {
      console.log("⏳ [SELEÇÃO DDD] Aguardando carregar items...");
    }
  }, [temProdutosMoveis, navigate, totalLinhas, items.length]);

  const handleDddUnicoChange = (ddd: string) => {
    setDddUnico(ddd);
    resetDdds();
    addDdd(ddd, totalLinhas);
  };

  const handleAddDdd = () => {
    setErro("");

    if (!novoDdd) {
      setErro("Selecione um DDD");
      return;
    }

    const quantidade = parseInt(novaQuantidade);
    if (!quantidade || quantidade < 1) {
      setErro("Quantidade deve ser maior que 0");
      return;
    }

    if (distribuicao.find((d) => d.ddd === novoDdd)) {
      setErro("Este DDD já foi adicionado");
      return;
    }

    const restantes = linhasRestantes();
    if (quantidade > restantes) {
      setErro(`Você pode adicionar no máximo ${restantes} linhas`);
      return;
    }

    addDdd(novoDdd, quantidade);
    setNovoDdd("");
    setNovaQuantidade("");
  };

  const handleProximo = () => {
    if (!isValid()) {
      setErro("Complete a distribuição de DDDs antes de continuar");
      return;
    }
    navigate("/app/checkout/confirmacao");
  };

  const handleVoltar = () => {
    // Se cliente logado, voltar para resumo do carrinho
    if (customerData?.client) {
      navigate("/app/checkout");
    } else {
      navigate("/app/checkout/documentos");
    }
  };

  if (!temProdutosMoveis) {
    return null;
  }

  console.log("🎨 [SELEÇÃO DDD] Renderizando componente:");
  console.log("   totalLinhas:", totalLinhas);
  console.log("   temProdutosMoveis:", temProdutosMoveis);
  console.log("   distribuirDdds:", distribuirDdds);
  console.log("   dddUnico:", dddUnico);
  console.log("   distribuicao:", distribuicao);
  
  if (totalLinhas > 1) {
    // Modo distribuição ou DDD único
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Seleção de DDDs</CardTitle>
            <p className="text-muted-foreground">
              Você possui {totalLinhas} linha{totalLinhas !== 1 ? "s" : ""} móvel
              {totalLinhas !== 1 ? "es" : ""} no carrinho. 
              {totalLinhas === 1
                ? " Selecione o DDD desejado."
                : " Distribua os DDDs conforme necessário."}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Modo: DDD Único ou Distribuição */}
            {totalLinhas === 1 ? (
              <div className="space-y-2">
                <Label htmlFor="ddd-unico">Selecione o DDD</Label>
                <Select value={dddUnico} onValueChange={handleDddUnicoChange}>
                  <SelectTrigger id="ddd-unico">
                    <SelectValue placeholder="Escolha um DDD" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {DDDS_VALIDOS.map((ddd) => (
                      <SelectItem key={ddd} value={ddd}>
                        {ddd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {/* Card premium com instrução e botões */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        Distribuição de DDDs
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Você possui {totalLinhas} linhas móveis. Escolha como deseja distribuir os DDDs.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                          !distribuirDdds
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setDistribuirDdds(false);
                          resetDdds();
                          setDddUnico("");
                        }}
                      >
                        Mesmo DDD para todas
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                          distribuirDdds
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setDistribuirDdds(true);
                          resetDdds();
                          setDddUnico("");
                        }}
                      >
                        Distribuir em vários DDDs
                      </button>
                    </div>
                  </div>
                </div>

                {!distribuirDdds ? (
                  <div className="space-y-2">
                    <Label htmlFor="ddd-unico-multi">
                      Todas as {totalLinhas} linhas no mesmo DDD
                    </Label>
                    <Select value={dddUnico} onValueChange={handleDddUnicoChange}>
                      <SelectTrigger id="ddd-unico-multi">
                        <SelectValue placeholder="Escolha um DDD" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {DDDS_VALIDOS.map((ddd) => (
                          <SelectItem key={ddd} value={ddd}>
                            {ddd}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">Distribua suas linhas</h3>
                      <p className="text-sm text-gray-600">
                        Adicione diferentes DDDs e especifique quantas linhas cada um terá.
                        Total disponível: <span className="font-semibold text-gray-900">{totalLinhas} linhas</span>
                      </p>
                    </div>
                                        {/* Adicionar DDD */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="novo-ddd">DDD</Label>
                        <Select value={novoDdd} onValueChange={setNovoDdd}>
                          <SelectTrigger id="novo-ddd">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {DDDS_VALIDOS.map((ddd) => (
                              <SelectItem key={ddd} value={ddd}>
                                {ddd}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nova-quantidade">Quantidade</Label>
                        <Input
                          id="nova-quantidade"
                          type="number"
                          min="1"
                          max={linhasRestantes()}
                          value={novaQuantidade}
                          onChange={(e) => setNovaQuantidade(e.target.value)}
                          placeholder="Ex: 2"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddDdd}
                          className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Lista de DDDs adicionados */}
                    {distribuicao.length > 0 && (
                      <div className="space-y-2">
                        <Label>Distribuição atual</Label>
                        <div className="space-y-2">
                          {distribuicao.map((item) => (
                            <div
                              key={item.ddd}
                              className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <span className="text-lg font-bold text-gray-700">{item.ddd}</span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">DDD {item.ddd}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.quantidade} {item.quantidade === 1 ? 'linha' : 'linhas'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeDdd(item.ddd)}
                                className="px-4 py-2 rounded-lg bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 font-medium transition-colors"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Resumo */}
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <span className="font-semibold text-gray-900">Linhas restantes:</span>
                          <span
                            className={
                              linhasRestantes() === 0
                                ? "text-green-600 font-bold text-lg"
                                : "text-orange-600 font-bold text-lg"
                            }
                          >
                            {linhasRestantes()} de {totalLinhas}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Alertas de validação */}
            {erro && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-500">
                <p className="text-red-700 font-medium">{erro}</p>
              </div>
            )}

            {distribuirDdds && linhasRestantes() > 0 && distribuicao.length > 0 && (
              <div className="p-4 rounded-lg bg-orange-50 border-2 border-orange-300">
                <p className="text-orange-700 font-medium">
                  Você ainda precisa distribuir {linhasRestantes()} linha{linhasRestantes() !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex justify-between gap-4 pt-4">
              <button
                onClick={handleVoltar}
                className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Voltar
              </button>

              <button
                onClick={handleProximo}
                disabled={!isValid()}
                className="px-8 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Continuar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
