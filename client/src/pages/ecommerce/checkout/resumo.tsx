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
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Buscar todos os produtos para mapear SVAs
  const { data: todosOsProdutos = [] } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/products"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce/public/products");
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
    // Se estiver logado, pular direto para confirmação
    if (customerData?.client) {
      setLocation("/ecommerce/checkout/confirmacao");
    } else {
      // Se não estiver logado, ir para escolha de tipo de cliente
      setLocation("/ecommerce/checkout/tipo-cliente");
    }
  };

  const handleVoltar = () => {
    setLocation("/ecommerce/planos");
  };

  // Se carrinho vazio, mostrar mensagem moderna
  if (!items || items.length === 0) {
    return (
      <div
        className="min-h-screen py-8 px-4"
        style={{ backgroundColor: "#FAFAFA" }}
      >
        <div className="max-w-2xl mx-auto">
          <Card
            style={{
              borderRadius: "16px",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent className="p-12 text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(30,144,255,0.1)",
                  borderRadius: "50%",
                }}
              >
                <ShoppingCart
                  className="h-8 w-8"
                  style={{ color: "#1E90FF" }}
                />
              </div>
              <h2
                className="text-2xl font-black mb-2"
                style={{ color: "#111111" }}
              >
                Escolha seu próximo plano
              </h2>
              <p className="text-lg mb-6" style={{ color: "#555555" }}>
                Adicione planos à sua seleção para avançar na contratação
              </p>
              <Button
                onClick={handleVoltar}
                className="font-bold text-base border-0"
                style={{
                  backgroundColor: "#1E90FF",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "12px 32px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#00CFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1E90FF";
                }}
              >
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#111111" }}>
            Resumo da Contratação
          </h1>
          <p className="text-sm" style={{ color: "#555555" }}>
            Confira os planos selecionados
          </p>
        </div>

        {/* Se cliente está logado, mostrar mensagem */}
        {customerData?.client && (
          <Card
            className="mb-6"
            style={{
              border: "2px solid #1AD1C1",
              backgroundColor: "rgba(26,209,193,0.05)",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle
                className="h-5 w-5 flex-shrink-0"
                style={{ color: "#1AD1C1" }}
              />
              <div>
                <p className="font-semibold" style={{ color: "#111111" }}>
                  Bem-vindo de volta, {customerData.client.nome}!
                </p>
                <p className="text-sm" style={{ color: "#555555" }}>
                  Você está logado. Prossiga para finalizar seu pedido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Itens do Carrinho */}
        <Card
          className="mb-6"
          style={{
            border: "1px solid #E0E0E0",
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              style={{ color: "#111111" }}
            >
              <ShoppingCart className="h-5 w-5" style={{ color: "#1E90FF" }} />
              Planos Selecionados ({items.length}{" "}
              {items.length === 1 ? "plano" : "planos"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.product.id}-${index}`}
                className="p-5 transition-shadow"
                style={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Cabeçalho do Item */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full font-bold"
                      style={{
                        backgroundColor: "rgba(30,144,255,0.1)",
                        color: "#1E90FF",
                      }}
                    >
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
                    <p className="text-xs mb-1" style={{ color: "#555555" }}>
                      Subtotal
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#111111" }}
                    >
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

                {/* SVAs e Textos Upsell */}
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

                {item.textosUpsell && item.textosUpsell.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {item.textosUpsell.map((texto, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-blue-900 mt-1 first:mt-0"
                      >
                        ✓ {texto}
                      </p>
                    ))}
                  </div>
                )}

                {/* Cálculo Visual */}
                <div className="mt-3 pt-3 border-t flex items-center justify-end gap-2 text-sm text-slate-600">
                  <span>
                    {item.quantidade} × {formatPreco(item.product.preco)}
                  </span>
                  <span>=</span>
                  <span
                    className="font-bold text-base"
                    style={{ color: "#1E90FF" }}
                  >
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
            <div
              className="pt-4 mt-4"
              style={{ borderTop: "2px solid #E0E0E0" }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-xl font-bold"
                  style={{ color: "#111111" }}
                >
                  Total
                </span>
                <span
                  className="text-3xl font-bold"
                  style={{ color: "#1E90FF" }}
                >
                  {formatPreco(total)}
                </span>
              </div>
              <p
                className="text-sm text-right mt-1"
                style={{ color: "#555555" }}
              >
                Valor mensal do plano
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informação sobre próximos passos */}
        {!customerData?.client && (
          <Card
            className="mb-6"
            style={{
              border: "2px solid #1E90FF",
              backgroundColor: "rgba(30,144,255,0.05)",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: "#111111" }}>
                <strong>Próxima etapa:</strong> Você será direcionado para
                informar se é Pessoa Física ou Jurídica e preencher seus dados
                cadastrais.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleVoltar}
            className="flex-1 h-12 font-semibold transition-all"
            style={{
              border: "1px solid #E0E0E0",
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1E90FF";
              e.currentTarget.style.backgroundColor = "rgba(30,144,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E0E0E0";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
          >
            Adicionar Mais Produtos
          </Button>
          <Button
            onClick={handleContinuar}
            className="flex-1 h-12 font-bold shadow-lg border-0 transition-all"
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
            Confirmar e Continuar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Link para Login */}
        {!customerData?.client && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 mb-2">Já é nosso cliente?</p>
            <a
              href="/ecommerce/login?returnTo=checkout"
              className="inline-flex items-center justify-center px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors gap-2 font-medium text-sm"
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
