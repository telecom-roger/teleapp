import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/stores/cartStore";
import { CartSidebar, CartBottomBar } from "@/components/ecommerce/CartSidebar";
import { CalculadoraMultiLinhasSidebar } from "@/components/ecommerce/CalculadoraMultiLinhasSidebar";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import {
  Check,
  Wifi,
  Smartphone,
  Tv,
  Briefcase,
  Star,
  Plus,
  User,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Package,
  Calculator,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

// 🆕 SISTEMA DE INTELIGÊNCIA CONTEXTUAL
import { useContextoInteligenteStore } from "@/stores/contextoInteligenteStore";
import { FiltrosHierarquicos } from "@/components/ecommerce/FiltrosHierarquicos";
import {
  useCompatibilidade,
  getCriteriosBloqueadores,
} from "@/hooks/useCompatibilidade";
import {
  useScoreContextual,
  ordenarPorScore,
} from "@/hooks/useScoreContextual";
import { useBadgeDinamico } from "@/hooks/useBadgeDinamico";
import EmptyStatePlanos from "@/components/ecommerce/EmptyStatePlanos";

interface CustomerData {
  user: { id: string; email: string; role: string };
  client: { id: string; nome: string } | null;
}

type TipoPessoa = "ambos" | "PF" | "PJ";

const OPERADORA_COLORS: Record<
  string,
  {
    bg: string;
    text: string;
    name: string;
    badge: string;
    border: string;
  }
> = {
  V: {
    bg: "bg-purple-600",
    text: "text-slate-700",
    name: "VIVO",
    badge: "bg-white text-slate-700 border-slate-200",
    border: "border-purple-200",
  },
  C: {
    bg: "bg-red-600",
    text: "text-slate-700",
    name: "CLARO",
    badge: "bg-white text-slate-700 border-slate-200",
    border: "border-red-200",
  },
  T: {
    bg: "bg-blue-600",
    text: "text-slate-700",
    name: "TIM",
    badge: "bg-white text-slate-700 border-slate-200",
    border: "border-blue-200",
  },
};

export default function EcommercePlanos() {
  // 🆕 CONTEXTO INTELIGENTE - Store principal
  const {
    contextoInicial,
    contextoAtivo,
    sinais,
    setContextoInicial,
    updateContextoAtivo,
    setCategoria,
    setOperadora,
    setTipoPessoa,
    setLinhas,
    registrarEvento,
    incrementarTempoCategoria,
  } = useContextoInteligenteStore();

  // Estados locais (UI)
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenacao, setOrdenacao] = useState("relevancia");
  const [planosPorPagina, setPlanosPorPagina] = useState(12);
  const [mostrarCampoPersonalizado, setMostrarCampoPersonalizado] =
    useState(false);
  const [linhasPersonalizado, setLinhasPersonalizado] = useState("10");
  const [sidebarCalculadoraAberto, setSidebarCalculadoraAberto] =
    useState(false);
  const [produtoCalculadora, setProdutoCalculadora] = useState<any>(null);
  const [quantidadeLinhasCalculadora, setQuantidadeLinhasCalculadora] =
    useState(2);
  const [filtrosCarregadosDaUrl, setFiltrosCarregadosDaUrl] = useState(false);
  const [planosSelecionados, setPlanosSelecionados] = useState<Set<string>>(
    new Set()
  );
  const [mostrarMensagemMulti, setMostrarMensagemMulti] = useState(false);
  const [diferencialAberto, setDiferencialAberto] = useState<string | null>(
    null
  );
  const [tempoInicioPagina] = useState(Date.now());
  const [tooltipOperadoraOpen, setTooltipOperadoraOpen] = useState(false);
  const [tooltipCategoriaOpen, setTooltipCategoriaOpen] = useState(false);
  const [tipoContratacao, setTipoContratacao] = useState<"linha_nova" | "portabilidade">(() => {
    const saved = localStorage.getItem("tipo-contratacao");
    return (saved === "portabilidade" ? "portabilidade" : "linha_nova");
  });

  // Salvar tipoContratacao no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("tipo-contratacao", tipoContratacao);
  }, [tipoContratacao]);

  const { addItem, removeItem, openCart, items: cartItems } = useCartStore();

  // Sincronizar planosSelecionados com items do carrinho
  useEffect(() => {
    const idsNoCarrinho = new Set(
      cartItems.map(item => item.product.id)
    );
    setPlanosSelecionados(idsNoCarrinho);
  }, [cartItems]);

  // 🆕 Aliases para compatibilidade com código existente
  const categoriasFiltro = contextoAtivo.categorias;
  const operadorasFiltro = contextoAtivo.operadoras;
  const tipoPessoaFiltro = contextoAtivo.tipoPessoa;

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
  const categoriasUrl =
    urlParams.get("categorias")?.split(",").filter(Boolean) || [];
  const pessoaUrl = urlParams.get("tipo") as TipoPessoa | null;
  const operadorasUrl =
    urlParams.get("operadoras")?.split(",").filter(Boolean) || [];
  const modalidadeUrl = urlParams.get("modalidade");
  const linhasUrl = urlParams.get("linhas");

  // 🆕 Carregar filtros da URL E capturar contexto inicial
  useEffect(() => {
    if (!filtrosCarregadosDaUrl) {
      // Construir contexto dos parâmetros da URL
      const temFiltrosNaUrl =
        categoriasUrl.length > 0 ||
        operadorasUrl.length > 0 ||
        pessoaUrl ||
        linhasUrl;

      if (temFiltrosNaUrl) {
        // Atualizar contexto ativo com valores da URL
        updateContextoAtivo({
          categorias: categoriasUrl,
          operadoras: operadorasUrl,
          tipoPessoa: pessoaUrl || "PF",
          linhas: linhasUrl ? Number(linhasUrl) : null,
          fibra: categoriasUrl.includes("fibra"),
          combo: categoriasUrl.includes("combo"),
        });

        // Se linhas >= 10, ativar campo personalizado
        const linhasNumero = linhasUrl ? Number(linhasUrl) : 0;
        if (linhasNumero >= 10) {
          setMostrarCampoPersonalizado(true);
          setLinhasPersonalizado(linhasNumero.toString());
        }

        // NÃO capturar como contexto inicial (veio de CTA/link)
        console.log("📍 Filtros carregados da URL (não é contexto inicial)");
      }

      setFiltrosCarregadosDaUrl(true);
    }
  }, [
    categoriasUrl.join(","),
    pessoaUrl,
    operadorasUrl.join(","),
    linhasUrl,
    filtrosCarregadosDaUrl,
  ]);

  // 🆕 Rastrear tempo na página (para sinais comportamentais)
  useEffect(() => {
    const interval = setInterval(() => {
      const categoriaAtual = categoriasFiltro[0];
      if (categoriaAtual) {
        incrementarTempoCategoria(categoriaAtual, 1000); // +1s
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [categoriasFiltro]);

  const { data: products, isLoading } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/public/products"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce/public/products");
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

  // 🆕 APLICAR INTELIGÊNCIA CONTEXTUAL
  // 1. Filtro HARD de compatibilidade (exclui incompatíveis)
  const produtosCompativeis = useCompatibilidade(products, contextoAtivo);

  // 2. Calcular scores contextuais
  const produtosComScore = useScoreContextual(
    produtosCompativeis,
    contextoAtivo,
    contextoInicial,
    sinais,
    false // incluirDetalhes = false (pode ativar para debug)
  );

  // 3. Ordenar por score contextual
  const produtosPorScore = ordenarPorScore(produtosComScore);

  // 3.5 Aplicar ordenação manual do usuário
  const produtosOrdenados = useMemo(() => {
    const produtos = [...produtosPorScore];
    
    switch (ordenacao) {
      case "menor-preco":
        return produtos.sort((a, b) => (a.preco || 0) - (b.preco || 0));
      case "maior-preco":
        return produtos.sort((a, b) => (b.preco || 0) - (a.preco || 0));
      case "velocidade":
        return produtos.sort((a, b) => {
          const velA = parseInt(a.velocidade || "0");
          const velB = parseInt(b.velocidade || "0");
          return velB - velA;
        });
      case "popularidade":
        return produtos.sort((a, b) => (b.popularidade || 0) - (a.popularidade || 0));
      case "relevancia":
      default:
        return produtos; // Mantém ordenação por score
    }
  }, [produtosPorScore, ordenacao]);

  // 4. Calcular badges dinâmicos
  const badgesMap = useBadgeDinamico(produtosOrdenados, contextoAtivo);

  // 5. Identificar critérios bloqueadores (para empty state)
  const criteriosBloqueadores = getCriteriosBloqueadores(
    products,
    contextoAtivo
  );

  // 🆕 Agrupar produtos por categoria se não houver filtro específico
  const produtosAgrupados =
    categoriasFiltro.length === 0
      ? produtosOrdenados.reduce((acc, produto) => {
          const cat = produto.categoria || "Outros";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(produto);
          return acc;
        }, {} as Record<string, typeof produtosOrdenados>)
      : categoriasFiltro.reduce((acc, cat) => {
          acc[cat] = produtosOrdenados.filter((p) => p.categoria === cat);
          return acc;
        }, {} as Record<string, typeof produtosOrdenados>);

  const categoriasComProdutos = Object.keys(produtosAgrupados).filter(
    (cat) => produtosAgrupados[cat].length > 0
  );

  const handleAddToCart = (product: any) => {
    // 🆕 Registrar evento comportamental
    registrarEvento("plano_adicionado_carrinho", product.id);

    addItem(product, 1);
    openCart();
  };

  const toggleSelecaoPlano = (product: any) => {
    const novoSet = new Set(planosSelecionados);

    if (novoSet.has(product.id)) {
      // Desselecionar - remove do carrinho
      novoSet.delete(product.id);
      removeItem(product.id);
      // 🆕 Registrar remoção
      registrarEvento("plano_removido_carrinho", product.id);
    } else {
      // Selecionar - adiciona ao carrinho
      novoSet.add(product.id);
      addItem(product, 1);
      openCart();
      // 🆕 Registrar adição
      registrarEvento("plano_adicionado_carrinho", product.id);

      // Mostrar mensagem apenas na primeira seleção
      if (novoSet.size === 1) {
        setMostrarMensagemMulti(true);
        setTimeout(() => setMostrarMensagemMulti(false), 5000);
      }
    }

    setPlanosSelecionados(novoSet);
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
    // 🆕 Limpar contexto ativo
    updateContextoAtivo({
      categorias: [],
      operadoras: [],
      tipoPessoa: "PF",
      linhas: null,
      modalidade: null,
      fibra: false,
      combo: false,
    });

    // Limpar URL também
    window.history.replaceState({}, "", "/ecommerce/planos");
  };

  // 🆕 Funções para toggle multi-select COM captura de contexto inicial
  const toggleCategoria = (slug: string) => {
    const novasCategorias = categoriasFiltro.includes(slug)
      ? categoriasFiltro.filter((c) => c !== slug)
      : [...categoriasFiltro, slug];

    // Capturar contexto inicial na PRIMEIRA interação consciente
    if (!contextoInicial && novasCategorias.length > 0) {
      console.log(
        "✅ Capturando contexto inicial (primeira interação com categoria)"
      );
      setContextoInicial({
        ...contextoAtivo,
        categorias: novasCategorias,
        fibra: novasCategorias.includes("fibra"),
        combo: novasCategorias.includes("combo"),
      });
    }

    setCategoria(novasCategorias);
    window.history.replaceState({}, "", "/ecommerce/planos");
  };

  const toggleOperadora = (op: string) => {
    const novasOperadoras = operadorasFiltro.includes(op)
      ? operadorasFiltro.filter((o) => o !== op)
      : [...operadorasFiltro, op];

    // Capturar contexto inicial na PRIMEIRA interação consciente
    if (!contextoInicial && novasOperadoras.length > 0) {
      console.log(
        "✅ Capturando contexto inicial (primeira interação com operadora)"
      );
      setContextoInicial({
        ...contextoAtivo,
        operadoras: novasOperadoras,
      });
    }

    setOperadora(novasOperadoras);
    window.history.replaceState({}, "", "/ecommerce/planos");
  };

  // Quando usuário mudar tipo de pessoa
  const handleChangeTipoPessoa = (tipo: TipoPessoa) => {
    // Capturar contexto inicial na PRIMEIRA interação
    if (!contextoInicial && tipo !== "ambos") {
      console.log(
        "✅ Capturando contexto inicial (primeira interação com tipo pessoa)"
      );
      setContextoInicial({
        ...contextoAtivo,
        tipoPessoa: tipo,
      });
    }

    setTipoPessoa(tipo);
    window.history.replaceState({}, "", "/ecommerce/planos");
  };

  // 🆕 Handlers para EmptyState
  const handleRemoverOperadora = () => {
    setOperadora([]);
  };

  const handleReduzirLinhas = () => {
    const linhasAtuais = contextoAtivo.linhas || 2;
    const novasLinhas = Math.max(1, linhasAtuais - 1);
    setLinhas(novasLinhas);
  };

  const handleRemoverCategoria = () => {
    setCategoria([]);
  };

  const handleVerTodos = () => {
    limparFiltros();
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

  // 🆕 Calcular filtros ativos do contexto
  const filtrosAtivos =
    categoriasFiltro.length +
    operadorasFiltro.length +
    (contextoAtivo.linhas ? 1 : 0) +
    (contextoAtivo.fibra ? 1 : 0) +
    (contextoAtivo.combo ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <EcommerceHeader />

      <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section com Gradiente Full Width */}
        <div
          className="text-center py-12 md:py-16 space-y-4 mb-10 -mx-4 md:-mx-6"
          style={{
            background: "linear-gradient(135deg, #1E90FF 0%, #1570D6 100%)",
            boxShadow: "0 20px 60px rgba(30, 144, 255, 0.4)",
          }}
        >
          <h1
            className="text-4xl md:text-5xl font-black tracking-tight px-6"
            style={{ color: "#FFFFFF" }}
          >
            Planos compatíveis com o seu perfil
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto px-6"
            style={{ color: "rgba(255, 255, 255, 0.95)" }}
          >
            A lista se ajusta automaticamente conforme seus filtros
          </p>
        </div>

        {/* Removido: Badge de múltiplas linhas */}

        {/* Filtros Card - Sticky no mobile */}
        <div className="mb-8">
          <Card className="rounded-xl border border-gray-200 shadow-sm sticky top-0 z-40 md:relative md:top-auto bg-white">
            <CardContent className="p-5">
              {/* Mobile: Botão toggle filtros */}
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all font-medium"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {filtrosAtivos > 0 ? (
                      <>
                        Filtros <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">{filtrosAtivos}</span> selecionados
                      </>
                    ) : "Filtros"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      mostrarFiltros && "rotate-180"
                    )}
                  />
                </Button>
              </div>

            <div
              className={cn("space-y-6", !mostrarFiltros && "hidden md:block")}
            >
              <FiltrosHierarquicos
                // Nível 1
                tipoPessoaFiltro={tipoPessoaFiltro}
                setTipoPessoa={handleChangeTipoPessoa}
                tipoContratacao={tipoContratacao}
                setTipoContratacao={setTipoContratacao}
                linhas={contextoAtivo.linhas}
                setLinhas={setLinhas}
                
                // Nível 2
                operadorasFiltro={operadorasFiltro}
                setOperadora={setOperadora}
                toggleOperadora={toggleOperadora}
                categoriasFiltro={categoriasFiltro}
                setCategoria={setCategoria}
                toggleCategoria={toggleCategoria}
                categorias={categorias}
                
                // Ações
                limparFiltros={limparFiltros}
                filtrosAtivos={filtrosAtivos}
                
                // UI States
                mostrarCampoPersonalizado={mostrarCampoPersonalizado}
                setMostrarCampoPersonalizado={setMostrarCampoPersonalizado}
                linhasPersonalizado={linhasPersonalizado}
                setLinhasPersonalizado={setLinhasPersonalizado}
                tooltipOperadoraOpen={tooltipOperadoraOpen}
                setTooltipOperadoraOpen={setTooltipOperadoraOpen}
                tooltipCategoriaOpen={tooltipCategoriaOpen}
                setTooltipCategoriaOpen={setTooltipCategoriaOpen}
              />
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Contador de Resultados e Ordenação */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className="border-0 font-semibold px-4 py-2 rounded-badge"
              style={{
                backgroundColor: "#FAFAFA",
                color: "#111111",
              }}
            >
              {isLoading ? (
                <span>Carregando...</span>
              ) : (
                <span>
                  {produtosOrdenados.length}{" "}
                  {produtosOrdenados.length === 1 ? "plano" : "planos"}
                </span>
              )}
            </Badge>
            {categoriasFiltro.length > 0 &&
              categoriasFiltro.map((cat) => (
                <Badge
                  key={cat}
                  className="border-0 font-semibold rounded-badge"
                  style={{
                    backgroundColor: "rgba(30,144,255,0.1)",
                    color: "#1E90FF",
                  }}
                >
                  {categorias.find((c) => c.slug === cat)?.nome || cat}
                </Badge>
              ))}
            {operadorasFiltro.length > 0 &&
              operadorasFiltro.map((op) => (
                <Badge
                  key={op}
                  className="border-0 font-semibold rounded-badge"
                  style={{
                    backgroundColor: "rgba(30,144,255,0.1)",
                    color: "#1E90FF",
                  }}
                >
                  {OPERADORA_COLORS[op]?.name || op}
                </Badge>
              ))}
            <Badge
              className="border-0 font-semibold rounded-badge"
              style={{
                backgroundColor: "rgba(30,144,255,0.1)",
                color: "#1E90FF",
              }}
            >
              {tipoPessoaFiltro === "PF" ? "Pessoa Física" : "Empresas"}
            </Badge>
          </div>

          {/* Mensagem Sutil Multi-Seleção */}
          {mostrarMensagemMulti && (
            <div
              className="mb-4 p-3 rounded-lg border transition-all duration-300"
              style={{
                backgroundColor: "rgba(30,144,255,0.05)",
                borderColor: "#1E90FF",
              }}
            >
              <p className="text-sm text-center" style={{ color: "#1E90FF" }}>
                💡 Você pode escolher mais de um plano
              </p>
            </div>
          )}

          {/* Dropdown de Ordenação */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "#555555" }}>
              Ordenar por:
            </span>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="h-10 px-4 font-semibold outline-none transition-all rounded-base"
              style={{
                border: "1px solid #E0E0E0",
                backgroundColor: "#FFFFFF",
                color: "#111111",
              }}
            >
              <option value="relevancia">Relevância</option>
              <option value="menor-preco">Menor Preço</option>
              <option value="maior-preco">Maior Preço</option>
              <option value="velocidade">Velocidade</option>
              <option value="popularidade">Popularidade</option>
            </select>
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
        ) : produtosOrdenados.length === 0 ? (
          // 🆕 EMPTY STATE COM SUGESTÕES INTELIGENTES
          <EmptyStatePlanos
            contextoAtivo={contextoAtivo}
            onRemoverOperadora={handleRemoverOperadora}
            onReduzirLinhas={handleReduzirLinhas}
            onRemoverCategoria={handleRemoverCategoria}
            onVerTodos={handleVerTodos}
            criteriosBloqueadores={criteriosBloqueadores}
          />
        ) : (
          <>
            {categoriasComProdutos.map((categoria, catIndex) => {
              const produtosCategoria = produtosAgrupados[categoria];
              const produtosVisiveis = produtosCategoria; // 🆕 Mostrar todos (sem paginação)
              const temMais = false; // Paginação desabilitada - mostrando todos os produtos

              return (
                <div key={categoria} className={catIndex > 0 ? "mt-12" : ""}>
                  {/* Título da Categoria (mostrar quando não há filtro OU quando há múltiplas categorias selecionadas) */}
                  {(categoriasFiltro.length === 0 ||
                    categoriasFiltro.length > 1) && (
                    <div className="mb-6">
                      <h2
                        className="text-2xl font-bold flex items-center gap-3"
                        style={{ color: "#111111" }}
                      >
                        {(() => {
                          const Icon = getIconeCategoria(
                            categoria.toLowerCase()
                          );
                          return (
                            <Icon
                              className="h-6 w-6"
                              style={{ color: "#1E90FF" }}
                            />
                          );
                        })()}
                        {categoria}
                        <Badge
                          className="border-0 text-sm"
                          style={{
                            backgroundColor: "#FAFAFA",
                            color: "#555555",
                            borderRadius: "12px",
                          }}
                        >
                          {produtosCategoria.length}{" "}
                          {produtosCategoria.length === 1 ? "plano" : "planos"}
                        </Badge>
                      </h2>
                      <div
                        className="h-1 w-20 rounded-full mt-2"
                        style={{ backgroundColor: "#1E90FF" }}
                      ></div>
                    </div>
                  )}

                  {/* Grid de Produtos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {produtosVisiveis.map((product: any) => {
                      const Icon = getIconeCategoria(product.categoria);
                      const colors =
                        OPERADORA_COLORS[
                          product.operadora as keyof typeof OPERADORA_COLORS
                        ];

                      // 🆕 BADGE DINÂMICO
                      const badgeDinamico = badgesMap.get(product.id);

                      // 🆕 REGISTRAR VISUALIZAÇÃO (apenas uma vez)
                      if (!sinais.planosVisualizados.includes(product.id)) {
                        // Registrar após pequeno delay para não poluir durante scroll
                        setTimeout(() => {
                          if (!sinais.planosVisualizados.includes(product.id)) {
                            registrarEvento("plano_visualizado", product.id);
                          }
                        }, 500);
                      }

                      return (
                        <Card
                          key={product.id}
                          className={cn(
                            "rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden",
                            product.destaque && "border-blue-500 shadow-md"
                          )}
                        >
                          {/* 🆕 BADGE DINÂMICO (prioridade sobre destaque) */}
                          {badgeDinamico ? (
                            <div className="absolute top-4 right-4 z-10">
                              <Badge
                                className={cn(
                                  "text-xs rounded-full border-0 px-3 py-1",
                                  badgeDinamico.variante === "success" && "bg-emerald-500/10 text-emerald-700",
                                  badgeDinamico.variante === "info" && "bg-blue-500/10 text-blue-700",
                                  badgeDinamico.variante === "primary" && "bg-cyan-500/10 text-cyan-700",
                                  badgeDinamico.variante === "warning" && "bg-orange-500/10 text-orange-700"
                                )}
                              >
                                {badgeDinamico.texto}
                              </Badge>
                            </div>
                          ) : (
                            product.destaque && (
                              <div className="absolute top-4 right-4 z-10">
                                <Badge className="text-xs rounded-full border-0 px-3 py-1 bg-orange-500/10 text-orange-700">
                                  🔥 Destaque
                                </Badge>
                              </div>
                            )
                          )}

                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="space-y-4 flex-1">
                              {/* Header */}
                              <div>
                                {colors && (
                                  <Badge className="mb-3 text-xs rounded-full bg-blue-50 text-blue-700 border-0">
                                    <Smartphone className="w-3 h-3 mr-1" />
                                    {colors.name}
                                  </Badge>
                                )}
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                                  {product.nome}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {product.descricao}
                                </p>
                              </div>

                              {/* Specs principais */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {product.velocidade && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100">
                                    <Zap className="w-4 h-4 text-gray-700" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {product.velocidade}
                                    </span>
                                  </div>
                                )}
                                {product.franquia && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100">
                                    <Smartphone className="w-4 h-4 text-gray-700" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {product.franquia}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Fidelidade */}
                              {product.fidelidade > 0 ? (
                                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                  <Shield className="h-4 w-4 text-gray-500" />
                                  Fidelidade de {product.fidelidade} meses
                                </p>
                              ) : (
                                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                  <Check className="h-4 w-4 text-emerald-600" />
                                  Sem fidelidade
                                </p>
                              )}

                              {/* Benefícios */}
                              {product.beneficios &&
                                product.beneficios.length > 0 && (
                                  <ul className="space-y-2">
                                    {product.beneficios
                                      .slice(0, 3)
                                      .map((beneficio: string, i: number) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2 text-sm text-gray-700"
                                        >
                                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
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
                              <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-3xl font-bold text-blue-600">
                                    {formatPrice(product.preco)}
                                  </span>
                                  <span className="text-sm text-gray-500">/mês</span>
                                </div>
                                <div className="space-y-1">
                                  {product.precoInstalacao > 0 && (
                                    <p className="text-xs text-gray-600">
                                      + {formatPrice(product.precoInstalacao)} instalação
                                    </p>
                                  )}
                                  {product.linhasInclusas > 1 && (
                                    <p className="text-xs font-medium text-blue-600">
                                      ✓ {product.linhasInclusas} linhas inclusas
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Diferenciais Colapsáveis */}
                            {product.diferenciais &&
                              product.diferenciais.length > 0 && (
                                <div className="border-t border-gray-200 pt-4">
                                  <button
                                    className="w-full flex items-center justify-between text-left font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors"
                                    onClick={() =>
                                      setDiferencialAberto(
                                        diferencialAberto === product.id
                                          ? null
                                          : product.id
                                      )
                                    }
                                  >
                                    <span>📋 Diferenciais</span>
                                    {diferencialAberto === product.id ? (
                                      <ChevronUp className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                  {diferencialAberto === product.id && (
                                    <ul className="mt-3 space-y-2 animate-in fade-in duration-200">
                                      {product.diferenciais.map(
                                        (diferencial: string, i: number) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-gray-700"
                                          >
                                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                                            <span>{diferencial}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  )}
                                </div>
                              )}

                            {/* CTA Multi-Seleção */}
                            <div className="space-y-2 mt-auto pt-4">
                              {planosSelecionados.has(product.id) ? (
                                <Button
                                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors gap-2"
                                  onClick={() => toggleSelecaoPlano(product)}
                                >
                                  <Check className="w-5 h-5" />
                                  Selecionado
                                </Button>
                              ) : (
                                <Button
                                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors gap-2"
                                  onClick={() => toggleSelecaoPlano(product)}
                                >
                                  <Plus className="w-5 h-5" />
                                  Selecionar Plano
                                </Button>
                              )}
                              {/* Calculadora - Só exibe se produto permitir */}
                              {product.permiteCalculadoraLinhas && (
                                <Button
                                  variant="outline"
                                  className="w-full h-11 rounded-xl border-gray-300 hover:border-blue-600 hover:bg-blue-50 font-semibold transition-all gap-2"
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

                  {/* Botão Carregar Mais */}
                  {temMais && (
                    <div className="text-center mt-8 mb-12">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setPlanosPorPagina((prev) => prev + 12)}
                        className="border-2 border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white font-semibold px-8"
                      >
                        Carregar Mais Planos
                        <ChevronDown className="ml-2 h-5 w-5" />
                      </Button>
                      <p className="text-sm text-slate-600 mt-2">
                        Mostrando {produtosVisiveis.length} de{" "}
                        {produtosCategoria.length} planos
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* CTA Bottom */}
        {!isLoading && produtosOrdenados.length > 0 && (
          <div className="mt-12 text-center bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-2">
              Não encontrou o que procura?
            </h3>
            <p className="text-white/90 mb-6 text-lg">
              Temos consultores prontos para ajudar você a escolher o melhor
              plano
            </p>
            <Button
              size="lg"
              className="bg-white text-[#6366F1] hover:bg-slate-100 font-bold h-14 px-8"
              asChild
            >
              <a
                href="https://wa.me/5519999999999"
                target="_blank"
                rel="noopener noreferrer"
              >
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
