import { useLocation } from "wouter";
import {
  ShoppingCart,
  CheckCircle,
  ArrowRight,
  User,
  Wifi,
  Smartphone,
  Briefcase,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface CustomerData {
  user?: any;
  client?: any;
}

export default function CheckoutResumo() {
  const [, setLocation] = useLocation();
  const { items, getTotal } = useCartStore();

  const getCategoryIcon = (categoria: string | null) => {
    if (!categoria) return Smartphone;
    const cat = categoria.toLowerCase();
    if (cat.includes("fibra") || cat.includes("link dedicado")) return Wifi;
    if (cat.includes("móvel") || cat.includes("movel")) return Smartphone;
    if (cat.includes("office") || cat.includes("365")) return Briefcase;
    return Smartphone;
  };

  // Verificar se o cliente está logado
  const { data: customerData } = useQuery<CustomerData>({
    queryKey: ["/api/app/auth/customer"],
    retry: false,
  });

  // Buscar todos os produtos para mapear SVAs
  const { data: todosOsProdutos = [] } = useQuery<any[]>({
    queryKey: ["/api/app/public/products"],
    queryFn: async () => {
      const res = await fetch("/api/app/public/products");
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      return res.json();
    },
  });

  // Função para obter nome do SVA pelo ID
  const getNomeSva = (svaId: string) => {
    const sva = todosOsProdutos.find((p) => p.id === svaId);
    return sva?.nome || svaId;
  };

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  const handleContinuar = () => {
    // Verificar se há produtos móveis no carrinho
    const temProdutosMoveis = items.some(
      (item) => item.product?.categoria?.toLowerCase() === "movel"
    );
    
    console.log("🔍 [RESUMO] Verificando produtos móveis:", temProdutosMoveis);
    
    // Se estiver logado, verificar se precisa de seleção de DDD
    if (customerData?.client) {
      if (temProdutosMoveis) {
        console.log("📱 [RESUMO] Tem móveis - indo para seleção de DDD");
        setLocation("/app/checkout/selecao-ddd");
      } else {
        console.log("✅ [RESUMO] Sem móveis - indo direto para confirmação");
        setLocation("/app/checkout/confirmacao");
      }
    } else {
      // Se não estiver logado, ir para escolha de tipo de cliente
      setLocation("/app/checkout/tipo-cliente");
    }
  };

  const handleVoltar = () => {
    setLocation("/app/planos");
  };

  // Se carrinho vazio, redirecionar
  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="p-12">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h2 className="text-2xl font-bold mb-2">
                Seu carrinho está vazio
              </h2>
              <p className="text-slate-600 mb-6">
                Adicione produtos ao carrinho antes de finalizar a compra
              </p>
              <Button
                onClick={handleVoltar}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Ver Planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resumo da Contratação
          </h1>
          <p className="text-sm text-gray-600">
            Confira os planos selecionados
          </p>
        </div>

        {/* Se cliente está logado, mostrar mensagem */}
        {customerData?.client && (
          <Card className="mb-6 rounded-2xl border-2 border-emerald-500 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="font-semibold text-gray-900">
                  Bem-vindo de volta, {customerData.client.nome}!
                </p>
                <p className="text-sm text-gray-600">
                  Você está logado. Prossiga para finalizar seu pedido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Itens do Carrinho */}
        <Card className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Planos Selecionados ({items.length}{" "}
              {items.length === 1 ? "plano" : "planos"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.product.id}-${index}`}
                className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cabeçalho do Item */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const Icon = getCategoryIcon(item.product.categoria);
                          return (
                            <Icon className="h-5 w-5 text-slate-900 stroke-[1.5]" />
                          );
                        })()}
                        <h4 className="font-bold text-lg text-slate-900">
                          {item.product.nome}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.product.operadora && (
                          <span className="text-xs font-semibold text-slate-600">
                            {item.product.operadora === "V"
                              ? "VIVO"
                              : item.product.operadora === "C"
                              ? "CLARO"
                              : "TIM"}
                          </span>
                        )}
                        {item.product.categoria && (
                          <span className="text-xs text-slate-500">
                            • {item.product.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">
                      Subtotal
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPreco(item.product.preco * item.quantidade)}
                    </p>
                  </div>
                </div>

                {/* Descrição do Produto */}
                {item.product.descricao && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.product.descricao}
                    </p>
                  </div>
                )}

                {/* Detalhes do Item */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 mb-1">
                      Quantidade
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {item.quantidade}x
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 mb-1">
                      Preço Unitário
                    </span>
                    <span className="text-lg font-semibold text-slate-700">
                      {formatPreco(item.product.preco)}
                    </span>
                  </div>
                  {item.product.velocidade && (
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1">
                        Velocidade
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {item.product.velocidade}
                      </span>
                    </div>
                  )}
                  {item.product.modalidade && (
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1">
                        Modalidade
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {item.product.modalidade === "novo"
                          ? "Novo Número"
                          : "Portabilidade"}
                      </span>
                    </div>
                  )}
                </div>

                {/* SVAs e Serviços Incluídos */}
                {item.svasUpsell && item.svasUpsell.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Serviços Incluídos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.svasUpsell.map((svaId, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {getNomeSva(svaId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cálculo Visual */}
                <div className="mt-3 pt-3 border-t flex items-center justify-end gap-2 text-sm text-slate-600">
                  <span>
                    {item.quantidade} × {formatPreco(item.product.preco)}
                  </span>
                  <span>=</span>
                  <span className="font-bold text-base text-blue-600">
                    {formatPreco(item.product.preco * item.quantidade)}
                  </span>
                </div>
              </div>
            ))}

            {/* Resumo por Categoria */}
            {items.length > 1 && (
              <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-slate-900">
                  Resumo por Categoria:
                </h4>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(
                    items.reduce((acc, item) => {
                      const cat = item.product.categoria || "Não especificado";
                      acc[cat] = (acc[cat] || 0) + item.quantidade;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([categoria, quantidade]) => (
                    <div
                      key={categoria}
                      className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border"
                    >
                      <Badge variant="outline" className="text-xs">
                        {categoria}
                      </Badge>
                      <span className="text-sm font-semibold text-slate-700">
                        {quantidade}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="pt-4 mt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">
                  Total
                </span>
                <span className="text-3xl font-bold text-blue-600">
                  {formatPreco(total)}
                </span>
              </div>
              <p className="text-sm text-gray-600 text-right mt-1">
                Valor mensal do plano
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informação sobre próximos passos */}
        {!customerData?.client && (
          <Card className="mb-6 rounded-2xl border-2 border-blue-600 bg-blue-600/5">
            <CardContent className="p-4">
              <p className="text-sm text-gray-900">
                <strong>Próxima etapa:</strong> Você será direcionado para
                informar se é Pessoa Física ou Jurídica e preencher seus dados
                cadastrais.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handleVoltar}
            className="w-full sm:flex-1 h-14 rounded-xl border-2 border-gray-300 hover:border-blue-600 text-gray-600 hover:text-blue-600 font-semibold transition-colors text-base"
          >
            Adicionar Mais Produtos
          </Button>
          <Button
            onClick={handleContinuar}
            className="w-full sm:flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-base"
          >
            Confirmar e Continuar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Link para Login */}
        {!customerData?.client && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Já é nosso cliente?</p>
            <a
              href="/app/login?returnTo=checkout"
              className="inline-flex items-center justify-center px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:border-blue-600 text-gray-600 hover:text-blue-600 transition-colors gap-2 font-semibold text-sm"
            >
              <User className="h-4 w-4" />
              Fazer Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
