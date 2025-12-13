import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/stores/cartStore";
import { CartSidebar, CartBottomBar } from "@/components/ecommerce/CartSidebar";
import { CalculadoraMultiLinhasSidebar } from "@/components/ecommerce/CalculadoraMultiLinhasSidebar";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { 
  Check, Wifi, Smartphone, Tv, Briefcase, Star, Plus, User, 
  Filter, X, ChevronDown, Zap, Shield, Package, Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

interface CustomerData {
  user: { id: string; email: string; role: string };
  client: { id: string; nome: string } | null;
}

type TipoPessoa = "ambos" | "PF" | "PJ";

const OPERADORA_COLORS: Record<string, { 
  bg: string; 
  text: string; 
  name: string;
  badge: string;
  border: string;
}> = {
  V: { 
    bg: "bg-purple-600", 
    text: "text-purple-700", 
    name: "VIVO",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-200"
  },
  C: { 
    bg: "bg-red-600", 
    text: "text-red-700", 
    name: "CLARO",
    badge: "bg-red-50 text-red-700 border-red-200",
    border: "border-red-200"
  },
  T: { 
    bg: "bg-blue-600", 
    text: "text-blue-700", 
    name: "TIM",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200"
  },
};

export default function EcommercePlanos() {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [operadoraFiltro, setOperadoraFiltro] = useState<string>("todos");
  const [tipoPessoaFiltro, setTipoPessoaFiltro] = useState<TipoPessoa>("ambos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [sidebarCalculadoraAberto, setSidebarCalculadoraAberto] = useState(false);
  const [produtoCalculadora, setProdutoCalculadora] = useState<any>(null);
  const [quantidadeLinhasCalculadora, setQuantidadeLinhasCalculadora] = useState(2);
  const [filtrosCarregadosDaUrl, setFiltrosCarregadosDaUrl] = useState(false);

  const { addItem } = useCartStore();

  // Verificar se o cliente está logado
  const { data: customerData } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Buscar categorias dinâmicas
  const { data: categorias = [] } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/categories"],
  });

  // Buscar produtos com filtro de categoria na URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoriaUrl = urlParams.get("categoria");
  const pessoaUrl = urlParams.get("tipo") as TipoPessoa | null;
  const operadoraUrl = urlParams.get("operadora");

  // Carregar filtros da URL apenas uma vez
  useEffect(() => {
    if (!filtrosCarregadosDaUrl) {
      if (categoriaUrl && categoriaUrl !== "todos") {
        setCategoriaFiltro(categoriaUrl);
      }
      if (pessoaUrl) {
        setTipoPessoaFiltro(pessoaUrl);
      }
      if (operadoraUrl && operadoraUrl !== "todos") {
        setOperadoraFiltro(operadoraUrl);
      }
      setFiltrosCarregadosDaUrl(true);
    }
  }, [categoriaUrl, pessoaUrl, operadoraUrl, filtrosCarregadosDaUrl]);

  const { data: products, isLoading } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/products", categoriaUrl],
    queryFn: async () => {
      const url = categoriaUrl 
        ? `/api/ecommerce/public/products?categoria=${categoriaUrl}`
        : "/api/ecommerce/public/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      return res.json();
    },
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const produtosFiltrados = products?.filter((product) => {
    if (!product.ativo) return false;
    if (categoriaFiltro !== "todos" && product.categoria !== categoriaFiltro) return false;
    if (operadoraFiltro !== "todos" && product.operadora !== operadoraFiltro) return false;
    if (tipoPessoaFiltro !== "ambos") {
      if (product.tipoPessoa === "ambos") return true;
      if (product.tipoPessoa !== tipoPessoaFiltro) return false;
    }
    return true;
  }) || [];

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
  };

  const abrirCalculadora = (product: any) => {
    setProdutoCalculadora(product);
    setQuantidadeLinhasCalculadora(2);
    setSidebarCalculadoraAberto(true);
  };

  const fecharCalculadora = () => {
    setSidebarCalculadoraAberto(false);
    setProdutoCalculadora(null);
  };

  const contratarDoSidebar = () => {
    if (produtoCalculadora) {
      addItem(produtoCalculadora, quantidadeLinhasCalculadora);
      toast({
        title: "Adicionado ao carrinho!",
        description: `${quantidadeLinhasCalculadora} linha(s) de ${produtoCalculadora.nome}`,
      });
      fecharCalculadora();
    }
  };

  const limparFiltros = () => {
    setCategoriaFiltro("todos");
    setOperadoraFiltro("todos");
    setTipoPessoaFiltro("ambos");
    // Limpar URL também
    window.history.replaceState({}, '', '/ecommerce/planos');
  };

  // Quando usuário mudar qualquer filtro manualmente, limpar URL
  const handleChangeFiltro = (tipo: 'categoria' | 'operadora' | 'pessoa', valor: any) => {
    if (tipo === 'categoria') setCategoriaFiltro(valor);
    if (tipo === 'operadora') setOperadoraFiltro(valor);
    if (tipo === 'pessoa') setTipoPessoaFiltro(valor);
    // Limpar parâmetros da URL quando usuário mudar filtros manualmente
    window.history.replaceState({}, '', '/ecommerce/planos');
  };

  const getIconeCategoria = (slug: string) => {
    const icons: Record<string, any> = {
      fibra: Wifi,
      movel: Smartphone,
      tv: Tv,
      office: Briefcase,
      combo: Star,
    };
    return icons[slug] || Package;
  };

  const filtrosAtivos = [categoriaFiltro, operadoraFiltro, tipoPessoaFiltro].filter(
    f => f !== "todos" && f !== "ambos"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <EcommerceHeader />

      <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Banner se estiver logado */}
        {customerData?.client && (
          <div className="mb-8 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white rounded-2xl p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-sm opacity-90 mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Bem-vindo de volta!
              </p>
              <h2 className="text-2xl font-bold">{customerData.client.nome}</h2>
              <p className="text-sm opacity-90 mt-1">Seus dados já estão salvos, contrate em 2 minutos</p>
            </div>
            <Link href="/ecommerce/painel">
              <Button variant="secondary" size="sm" className="shadow-lg hover:scale-105 transition-transform">
                Meu Painel
              </Button>
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0 px-4 py-2">
            📱 Todos os Planos
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 text-slate-900">
            Compare e escolha seu plano
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Transparência total. Sem letras miúdas. Contrate direto online.
          </p>
        </div>

        {/* Removido: Badge de múltiplas linhas */}

        {/* Filtros Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardContent className="p-6">
            {/* Mobile: Botão toggle filtros */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                className="w-full justify-between border-2 hover:border-[#6366F1]"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {filtrosAtivos > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0">
                      {filtrosAtivos}
                    </Badge>
                  )}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", mostrarFiltros && "rotate-180")} />
              </Button>
            </div>

            <div className={cn("space-y-6", !mostrarFiltros && "hidden md:block")}>
              {/* Tipo de Pessoa */}
              <div>
                <label className="text-sm font-bold mb-3 block text-slate-900">
                  Para quem é o plano?
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: "ambos" as TipoPessoa, label: "Todos", icon: null },
                    { value: "PF" as TipoPessoa, label: "Pessoa Física", icon: User },
                    { value: "PJ" as TipoPessoa, label: "Empresas", icon: Briefcase },
                  ].map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => handleChangeFiltro('pessoa', tipo.value)}
                      className={cn(
                        "h-10 px-6 rounded-xl font-semibold border-2 transition-all duration-300 flex items-center gap-2",
                        tipoPessoaFiltro === tipo.value
                          ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                          : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                      )}
                    >
                      {tipo.icon && <tipo.icon className="w-4 h-4" />}
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-sm font-bold mb-3 block text-slate-900">
                  Tipo de serviço
                </label>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleChangeFiltro('categoria', 'todos')}
                    className={cn(
                      "h-10 px-6 rounded-xl font-semibold border-2 transition-all duration-300",
                      categoriaFiltro === "todos"
                        ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                        : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                    )}
                  >
                    Todos
                  </button>
                  {categorias.map((cat) => {
                    const Icon = getIconeCategoria(cat.slug);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleChangeFiltro('categoria', cat.slug)}
                        className={cn(
                          "h-10 px-6 rounded-xl font-semibold border-2 transition-all duration-300 flex items-center gap-2",
                          categoriaFiltro === cat.slug
                            ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                            : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operadora */}
              <div>
                <label className="text-sm font-bold mb-3 block text-slate-900">
                  Operadora
                </label>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleChangeFiltro('operadora', 'todos')}
                    className={cn(
                      "h-10 px-6 rounded-xl font-semibold border-2 transition-all duration-300",
                      operadoraFiltro === "todos"
                        ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                        : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                    )}
                  >
                    Todas
                  </button>
                  {Object.entries(OPERADORA_COLORS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleChangeFiltro('operadora', key)}
                      className={cn(
                        "h-10 px-6 rounded-xl font-bold border-2 transition-all duration-300",
                        operadoraFiltro === key
                          ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white shadow-lg"
                          : "border-slate-200 text-slate-700 hover:border-[#6366F1]/50 hover:shadow-md"
                      )}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limpar filtros */}
              {filtrosAtivos > 0 && (
                <button
                  onClick={limparFiltros}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#6366F1] transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contador de Resultados */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-slate-100 text-slate-900 border-0 font-semibold px-4 py-2">
              {isLoading ? (
                <span>Carregando...</span>
              ) : (
                <span>{produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'plano' : 'planos'}</span>
              )}
            </Badge>
            {categoriaFiltro !== "todos" && (
              <Badge className="bg-[#6366F1]/10 text-[#6366F1] border-0 font-semibold">
                {categorias.find(c => c.slug === categoriaFiltro)?.nome || categoriaFiltro}
              </Badge>
            )}
            {operadoraFiltro !== "todos" && (
              <Badge className="bg-[#A855F7]/10 text-[#A855F7] border-0 font-semibold">
                {OPERADORA_COLORS[operadoraFiltro]?.name || operadoraFiltro}
              </Badge>
            )}
            {tipoPessoaFiltro !== "ambos" && (
              <Badge className="bg-indigo-50 text-indigo-700 border-0 font-semibold">
                {tipoPessoaFiltro === "PF" ? "Pessoa Física" : "Empresas"}
              </Badge>
            )}
          </div>
        </div>

        {/* Grid de Produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum plano encontrado
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Tente ajustar os filtros ou limpar a seleção
              </p>
              {filtrosAtivos > 0 && (
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 lg:mb-8">
            {produtosFiltrados.map((product) => {
              const Icon = getIconeCategoria(product.categoria);
              const colors = OPERADORA_COLORS[product.operadora as keyof typeof OPERADORA_COLORS];

              return (
                <Card
                  key={product.id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2",
                    product.destaque 
                      ? "border-[#6366F1] shadow-xl" 
                      : "border-slate-200 hover:border-[#6366F1] shadow-md"
                  )}
                >
                  {/* Badge Destaque */}
                  {product.destaque && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg">
                        🔥 Destaque
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div>
                      {colors && (
                        <Badge className={cn("mb-3", colors.badge)}>
                          <Icon className="w-3 h-3 mr-1" />
                          {colors.name}
                        </Badge>
                      )}
                      <h3 className="text-xl font-bold line-clamp-2 mb-2 text-slate-900 group-hover:text-[#6366F1] transition-colors">
                        {product.nome}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {product.descricao}
                      </p>
                    </div>

                    {/* Specs principais */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {product.velocidade && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                          <Zap className="w-4 h-4 text-[#6366F1]" />
                          <span className="text-sm font-bold text-slate-900">{product.velocidade}</span>
                        </div>
                      )}
                      {product.franquia && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                          <Smartphone className="w-4 h-4 text-[#6366F1]" />
                          <span className="text-sm font-bold text-slate-900">{product.franquia}</span>
                        </div>
                      )}
                    </div>

                    {/* Fidelidade */}
                    {product.fidelidade > 0 ? (
                      <p className="text-xs text-[#666666] flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        Fidelidade de {product.fidelidade} meses
                      </p>
                    ) : (
                      <p className="text-xs text-[#1AD1C1] font-medium flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Sem fidelidade
                      </p>
                    )}

                    {/* Benefícios */}
                    {product.beneficios && product.beneficios.length > 0 && (
                      <ul className="space-y-2">
                        {product.beneficios.slice(0, 3).map((beneficio: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#666666]">
                            <Check className="w-4 h-4 text-[#1AD1C1] flex-shrink-0 mt-0.5" />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* SLA (PJ) */}
                    {product.sla && (
                      <div className="bg-[#007BFF]/5 border border-[#007BFF]/20 rounded-lg p-3">
                        <p className="text-xs text-[#007BFF] font-medium flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" />
                          {product.sla}
                        </p>
                      </div>
                    )}

                    {/* Preço */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-bold text-[#6366F1]">
                          {formatPrice(product.preco)}
                        </span>
                        <span className="text-sm text-slate-600">/mês</span>
                      </div>
                      <div className="space-y-1">
                        {product.precoInstalacao > 0 && (
                          <p className="text-xs text-slate-600">
                            + {formatPrice(product.precoInstalacao)} instalação
                          </p>
                        )}
                        {product.linhasInclusas > 1 && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ {product.linhasInclusas} linhas inclusas
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="space-y-2">
                      <Button
                        className="w-full gap-2 h-12 bg-gradient-to-r from-[#6366F1] to-[#A855F7] hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold"
                        onClick={() => handleAddToCart(product)}
                      >
                        <Check className="w-4 h-4" />
                        Contratar Agora
                      </Button>
                      {/* Calculadora - Só exibe se produto permitir */}
                      {product.permiteCalculadoraLinhas && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 h-11 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 font-semibold"
                          onClick={() => abrirCalculadora(product)}
                        >
                          <Calculator className="w-4 h-4" />
                          Calcular Múltiplas Linhas
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA Bottom */}
        {!isLoading && produtosFiltrados.length > 0 && (
          <div className="mt-12 text-center bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-2">
              Não encontrou o que procura?
            </h3>
            <p className="text-white/90 mb-6 text-lg">
              Temos consultores prontos para ajudar você a escolher o melhor plano
            </p>
            <Button size="lg" className="bg-white text-[#6366F1] hover:bg-slate-100 font-bold h-14 px-8" asChild>
              <a href="https://wa.me/5519999999999" target="_blank" rel="noopener noreferrer">
                Falar com Consultor
              </a>
            </Button>
          </div>
        )}
      </main>

      <EcommerceFooter />
      
      {/* Sidebar Calculadora */}
      <CalculadoraMultiLinhasSidebar
        isOpen={sidebarCalculadoraAberto}
        onClose={fecharCalculadora}
        produto={produtoCalculadora}
        quantidade={quantidadeLinhasCalculadora}
        onQuantidadeChange={setQuantidadeLinhasCalculadora}
        onContratar={contratarDoSidebar}
      />
      
      <CartSidebar />
      <CartBottomBar />
    </div>
  );
}

