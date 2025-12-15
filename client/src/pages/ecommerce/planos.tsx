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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

// 🆕 SISTEMA DE INTELIGÊNCIA CONTEXTUAL
import { useContextoInteligenteStore } from "@/stores/contextoInteligenteStore";
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
  const [isScrolled, setIsScrolled] = useState(false);
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

  const { addItem, removeItem, openCart } = useCartStore();

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

        // NÃO capturar como contexto inicial (veio de CTA/link)
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

  // Detectar scroll para sticky button
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // 3. Ordenar por score contextual OU por preço/velocidade/popularidade
  let produtosOrdenados = ordenarPorScore(produtosComScore);
  if (ordenacao === "menor-preco") {
    produtosOrdenados = [...produtosOrdenados].sort((a, b) => (a.preco ?? 0) - (b.preco ?? 0));
  } else if (ordenacao === "maior-preco") {
    produtosOrdenados = [...produtosOrdenados].sort((a, b) => (b.preco ?? 0) - (a.preco ?? 0));
  } else if (ordenacao === "velocidade") {
    produtosOrdenados = [...produtosOrdenados].sort((a, b) => {
      // Suporta franquia tipo "10GB", "Ilimitado", etc
      const parseGB = (franquia: string) => {
        if (!franquia) return 0;
        if (/ilimitado/i.test(franquia)) return 99999;
        const match = franquia.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return parseGB(b.franquia) - parseGB(a.franquia);
    });
  } else if (ordenacao === "popularidade") {
    produtosOrdenados = [...produtosOrdenados].sort((a, b) => (b.popularidade ?? 0) - (a.popularidade ?? 0));
  }

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
        {/* Banner se estiver logado */}
        {customerData?.client && (
          <div
            className="mb-8 text-white p-6 flex items-center justify-between shadow-lg"
            style={{
              background: "linear-gradient(to right, #1E90FF, #00CFFF)",
              borderRadius: "16px",
            }}
          >
            <div>
              <p className="text-sm opacity-90 mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Bem-vindo de volta!
              </p>
              <h2 className="text-2xl font-bold">{customerData.client.nome}</h2>
              <p className="text-sm opacity-90 mt-1">
                Seus dados já estão salvos, contrate em 2 minutos
              </p>
            </div>
            <Link href="/ecommerce/painel">
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg hover:scale-105 transition-transform"
              >
                Meu Painel
              </Button>
            </Link>
          </div>
        )}

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

        {/* Botão Filtrar Mobile - Sticky após scroll */}
        <div 
          className={cn(
            "lg:hidden transition-all duration-300 z-40",
            isScrolled && "shadow-md"
          )}
          style={{
            position: isScrolled ? "sticky" : "relative",
            top: isScrolled ? "0px" : "auto",
            marginBottom: isScrolled ? "0" : "1.5rem",
            backgroundColor: "#FFFFFF",
          }}
        >
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="w-full flex items-center justify-between font-medium transition-all duration-300"
            style={{
              height: isScrolled ? "48px" : "48px",
              backgroundColor: "#FFFFFF",
              color: "#555555",
              borderRadius: isScrolled ? "0" : "12px",
              border: isScrolled ? "none" : "1px solid #E0E0E0",
              borderBottom: isScrolled ? "1px solid #E0E0E0" : "1px solid #E0E0E0",
              padding: "0 1rem",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Filter className="w-4 h-4" style={{ color: "#1E90FF" }} />
              <span style={{ color: "#111111" }}>
                {filtrosAtivos > 0 ? `Filtros · ${filtrosAtivos} ativos` : "Filtrar"}
              </span>
            </div>
            {filtrosAtivos > 0 && (
              <span 
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: "#1E90FF",
                  color: "#FFFFFF",
                }}
              >
                {filtrosAtivos}
              </span>
            )}
          </button>
        </div>

        {/* Filtros Mobile - Dropdown quando botão clicado */}
        {mostrarFiltros && (
          <Card
            className="mb-6 shadow-lg border-0 lg:hidden"
            style={{ backgroundColor: "#FFFFFF", borderRadius: "12px" }}
          >
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Filtros Mobile - Conteúdo igual ao desktop */}
                {/* Tipo de Pessoa - SEM OPÇÃO TODOS */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label
                      className="text-sm font-bold"
                      style={{ color: "#111111" }}
                    >
                      Para quem é o plano?
                    </label>
                    <Badge
                      className="border-0 px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: "#1E90FF",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                      }}
                    >
                      OBRIGATÓRIO
                    </Badge>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      {
                        value: "PF" as TipoPessoa,
                        label: "Pessoa Física",
                        icon: User,
                      },
                      {
                        value: "PJ" as TipoPessoa,
                        label: "Empresas",
                        icon: Briefcase,
                      },
                    ].map((tipo) => (
                      <button
                        key={tipo.value}
                        onClick={() => handleChangeTipoPessoa(tipo.value)}
                        className={cn(
                          "h-10 px-6 font-semibold border-0 transition-all duration-300 flex items-center gap-2",
                          tipoPessoaFiltro === tipo.value
                            ? "shadow-lg"
                            : "hover:shadow-md"
                        )}
                        style={{
                          borderRadius: "12px",
                          backgroundColor:
                            tipoPessoaFiltro === tipo.value
                              ? "#1E90FF"
                              : "#FFFFFF",
                          color:
                            tipoPessoaFiltro === tipo.value
                              ? "#FFFFFF"
                              : "#555555",
                          border:
                            tipoPessoaFiltro === tipo.value
                              ? "none"
                              : "1px solid #E0E0E0",
                        }}
                        onMouseEnter={(e) => {
                          if (tipoPessoaFiltro !== tipo.value) {
                            e.currentTarget.style.borderColor = "#1E90FF";
                            e.currentTarget.style.color = "#1E90FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (tipoPessoaFiltro !== tipo.value) {
                            e.currentTarget.style.borderColor = "#E0E0E0";
                            e.currentTarget.style.color = "#555555";
                          }
                        }}
                      >
                        {tipo.icon && <tipo.icon className="w-4 h-4" />}
                        {tipo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantidade de Linhas */}
                <div>
                  <label
                    className="block text-sm font-bold mb-3"
                    style={{ color: "#111111" }}
                  >
                    Quantas linhas você precisa?
                  </label>
                  {!mostrarCampoPersonalizado ? (
                    <select
                      value={contextoAtivo.linhas || 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val === 10) {
                          setMostrarCampoPersonalizado(true);
                          setLinhasPersonalizado("10");
                          setLinhas(10);
                        } else {
                          setLinhas(val);
                        }
                      }}
                      className="w-full h-10 px-4 font-semibold transition-all duration-300"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E0E0E0",
                        backgroundColor: "#FFFFFF",
                        color: "#555555",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1E90FF";
                        e.currentTarget.style.backgroundColor =
                          "rgba(30,144,255,0.05)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#E0E0E0";
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "linha" : "linhas"}
                        </option>
                      ))}
                      <option value={10}>10+ linhas (personalizado)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="10"
                        max="999"
                        value={linhasPersonalizado}
                        onChange={(e) => {
                          setLinhasPersonalizado(e.target.value);
                          const val = Number(e.target.value);
                          if (val >= 10) {
                            setLinhas(val);
                          }
                        }}
                        className="flex-1 h-10 px-4 font-semibold transition-all duration-300"
                        placeholder="Digite a quantidade"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid #1E90FF",
                          backgroundColor: "rgba(30,144,255,0.05)",
                          color: "#111111",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          setMostrarCampoPersonalizado(false);
                          setLinhas(1);
                        }}
                        className="h-10 px-4 font-semibold transition-all duration-300"
                        style={{
                          borderRadius: "12px",
                          border: "1px solid #E0E0E0",
                          backgroundColor: "#FAFAFA",
                          color: "#555555",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FF6B35";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#FF6B35";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#FAFAFA";
                          e.currentTarget.style.color = "#555555";
                          e.currentTarget.style.borderColor = "#E0E0E0";
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Categoria - MULTI SELECT */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label
                      className="text-sm font-bold"
                      style={{ color: "#111111" }}
                    >
                      Tipo de serviço
                    </label>
                    <Badge
                      className="border-0 px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: "#FF6B35",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                      }}
                    >
                      MULTI
                    </Badge>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setCategoria([])}
                      className={cn(
                        "h-10 px-6 font-semibold border-0 transition-all duration-300",
                        categoriasFiltro.length === 0
                          ? "shadow-lg"
                          : "hover:shadow-md"
                      )}
                      style={{
                        borderRadius: "12px",
                        backgroundColor:
                          categoriasFiltro.length === 0 ? "#1E90FF" : "#FFFFFF",
                        color:
                          categoriasFiltro.length === 0 ? "#FFFFFF" : "#555555",
                        border:
                          categoriasFiltro.length === 0
                            ? "none"
                            : "1px solid #E0E0E0",
                      }}
                      onMouseEnter={(e) => {
                        if (categoriasFiltro.length > 0) {
                          e.currentTarget.style.borderColor = "#1E90FF";
                          e.currentTarget.style.color = "#1E90FF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (categoriasFiltro.length > 0) {
                          e.currentTarget.style.borderColor = "#E0E0E0";
                          e.currentTarget.style.color = "#555555";
                        }
                      }}
                    >
                      Todos
                    </button>
                    {categorias.map((cat) => {
                      const Icon = getIconeCategoria(cat.slug);
                      const isSelected = categoriasFiltro.includes(cat.slug);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategoria(cat.slug)}
                          className={cn(
                            "h-10 px-6 font-semibold border-0 transition-all duration-300 flex items-center gap-2 relative",
                            isSelected ? "shadow-lg" : "hover:shadow-md"
                          )}
                          style={{
                            borderRadius: "12px",
                            backgroundColor: isSelected ? "#1E90FF" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#555555",
                            border: isSelected ? "none" : "1px solid #E0E0E0",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#1E90FF";
                              e.currentTarget.style.color = "#1E90FF";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#E0E0E0";
                              e.currentTarget.style.color = "#555555";
                            }
                          }}
                        >
                          {isSelected && (
                            <div
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: "#00CFFF" }}
                            >
                              <Check
                                className="w-3 h-3"
                                style={{ color: "#FFFFFF" }}
                              />
                            </div>
                          )}
                          <Icon className="w-4 h-4" />
                          {cat.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operadora - MULTI SELECT */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label
                      className="text-sm font-bold"
                      style={{ color: "#111111" }}
                    >
                      Operadora
                    </label>
                    <Badge
                      className="border-0 px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: "#FF6B35",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                      }}
                    >
                      MULTI
                    </Badge>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setOperadora([])}
                      className={cn(
                        "h-10 px-6 font-semibold border-0 transition-all duration-300",
                        operadorasFiltro.length === 0
                          ? "shadow-lg"
                          : "hover:shadow-md"
                      )}
                      style={{
                        borderRadius: "12px",
                        backgroundColor:
                          operadorasFiltro.length === 0 ? "#1E90FF" : "#FFFFFF",
                        color:
                          operadorasFiltro.length === 0 ? "#FFFFFF" : "#555555",
                        border:
                          operadorasFiltro.length === 0
                            ? "none"
                            : "1px solid #E0E0E0",
                      }}
                      onMouseEnter={(e) => {
                        if (operadorasFiltro.length > 0) {
                          e.currentTarget.style.borderColor = "#1E90FF";
                          e.currentTarget.style.color = "#1E90FF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (operadorasFiltro.length > 0) {
                          e.currentTarget.style.borderColor = "#E0E0E0";
                          e.currentTarget.style.color = "#555555";
                        }
                      }}
                    >
                      Todas
                    </button>
                    {Object.entries(OPERADORA_COLORS).map(([key, config]) => {
                      const isSelected = operadorasFiltro.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleOperadora(key)}
                          className={cn(
                            "h-10 px-6 font-bold border-0 transition-all duration-300 relative",
                            isSelected ? "shadow-lg" : "hover:shadow-md"
                          )}
                          style={{
                            borderRadius: "12px",
                            backgroundColor: isSelected ? "#1E90FF" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#555555",
                            border: isSelected ? "none" : "1px solid #E0E0E0",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#1E90FF";
                              e.currentTarget.style.color = "#1E90FF";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#E0E0E0";
                              e.currentTarget.style.color = "#555555";
                            }
                          }}
                        >
                          {isSelected && (
                            <div
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: "#00CFFF" }}
                            >
                              <Check
                                className="w-3 h-3"
                                style={{ color: "#FFFFFF" }}
                              />
                            </div>
                          )}
                          {config.name}
                        </button>
                      );
                    })}
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

                {/* Botão Aplicar Filtro - Mobile */}
                <button
                  type="button"
                  className="w-full mt-6 h-12 rounded-lg bg-[#1E90FF] text-white font-bold text-base shadow hover:bg-[#1877cc] transition-all"
                  onClick={() => setMostrarFiltros(false)}
                >
                  Aplicar Filtro
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros Card */}
        <Card
          className="mb-8 shadow-lg border-0 hidden md:block"
          style={{ backgroundColor: "#FFFFFF", borderRadius: "16px" }}
        >
          <CardContent className="p-6">
            <div
              className={cn("space-y-6")}
            >
              {/* Tipo de Pessoa - SEM OPÇÃO TODOS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label
                    className="text-sm font-bold"
                    style={{ color: "#111111" }}
                  >
                    Para quem é o plano?
                  </label>
                  <Badge
                    className="border-0 px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "#1E90FF",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                    }}
                  >
                    OBRIGATÓRIO
                  </Badge>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    {
                      value: "PF" as TipoPessoa,
                      label: "Pessoa Física",
                      icon: User,
                    },
                    {
                      value: "PJ" as TipoPessoa,
                      label: "Empresas",
                      icon: Briefcase,
                    },
                  ].map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => handleChangeTipoPessoa(tipo.value)}
                      className={cn(
                        "h-10 px-6 font-semibold border-0 transition-all duration-300 flex items-center gap-2",
                        tipoPessoaFiltro === tipo.value
                          ? "shadow-lg"
                          : "hover:shadow-md"
                      )}
                      style={{
                        borderRadius: "12px",
                        backgroundColor:
                          tipoPessoaFiltro === tipo.value
                            ? "#1E90FF"
                            : "#FFFFFF",
                        color:
                          tipoPessoaFiltro === tipo.value
                            ? "#FFFFFF"
                            : "#555555",
                        border:
                          tipoPessoaFiltro === tipo.value
                            ? "none"
                            : "1px solid #E0E0E0",
                      }}
                      onMouseEnter={(e) => {
                        if (tipoPessoaFiltro !== tipo.value) {
                          e.currentTarget.style.borderColor = "#1E90FF";
                          e.currentTarget.style.color = "#1E90FF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (tipoPessoaFiltro !== tipo.value) {
                          e.currentTarget.style.borderColor = "#E0E0E0";
                          e.currentTarget.style.color = "#555555";
                        }
                      }}
                    >
                      {tipo.icon && <tipo.icon className="w-4 h-4" />}
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade de Linhas */}
              <div>
                <label
                  className="block text-sm font-bold mb-3"
                  style={{ color: "#111111" }}
                >
                  Quantas linhas você precisa?
                </label>
                {!mostrarCampoPersonalizado ? (
                  <select
                    value={contextoAtivo.linhas || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val === 10) {
                        setMostrarCampoPersonalizado(true);
                        setLinhasPersonalizado("10");
                        setLinhas(10);
                      } else {
                        setLinhas(val);
                      }
                    }}
                    className="w-full h-10 px-4 font-semibold transition-all duration-300"
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #E0E0E0",
                      backgroundColor: "#FFFFFF",
                      color: "#555555",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1E90FF";
                      e.currentTarget.style.backgroundColor =
                        "rgba(30,144,255,0.05)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#E0E0E0";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "linha" : "linhas"}
                      </option>
                    ))}
                    <option value={10}>10+ linhas (personalizado)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="10"
                      max="999"
                      value={linhasPersonalizado}
                      onChange={(e) => {
                        setLinhasPersonalizado(e.target.value);
                        const val = Number(e.target.value);
                        if (val >= 10) {
                          setLinhas(val);
                        }
                      }}
                      className="flex-1 h-10 px-4 font-semibold transition-all duration-300"
                      placeholder="Digite a quantidade"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #1E90FF",
                        backgroundColor: "rgba(30,144,255,0.05)",
                        color: "#111111",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => {
                        setMostrarCampoPersonalizado(false);
                        setLinhas(1);
                      }}
                      className="h-10 px-4 font-semibold transition-all duration-300"
                      style={{
                        borderRadius: "12px",
                        border: "1px solid #E0E0E0",
                        backgroundColor: "#FAFAFA",
                        color: "#555555",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FF6B35";
                        e.currentTarget.style.color = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#FF6B35";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FAFAFA";
                        e.currentTarget.style.color = "#555555";
                        e.currentTarget.style.borderColor = "#E0E0E0";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Categoria - MULTI SELECT */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label
                    className="text-sm font-bold"
                    style={{ color: "#111111" }}
                  >
                    Tipo de serviço
                  </label>
                  <Badge
                    className="border-0 px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "#FF6B35",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                    }}
                  >
                    MULTI
                  </Badge>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setCategoria([])}
                    className={cn(
                      "h-10 px-6 font-semibold border-0 transition-all duration-300",
                      categoriasFiltro.length === 0
                        ? "shadow-lg"
                        : "hover:shadow-md"
                    )}
                    style={{
                      borderRadius: "12px",
                      backgroundColor:
                        categoriasFiltro.length === 0 ? "#1E90FF" : "#FFFFFF",
                      color:
                        categoriasFiltro.length === 0 ? "#FFFFFF" : "#555555",
                      border:
                        categoriasFiltro.length === 0
                          ? "none"
                          : "1px solid #E0E0E0",
                    }}
                    onMouseEnter={(e) => {
                      if (categoriasFiltro.length > 0) {
                        e.currentTarget.style.borderColor = "#1E90FF";
                        e.currentTarget.style.color = "#1E90FF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (categoriasFiltro.length > 0) {
                        e.currentTarget.style.borderColor = "#E0E0E0";
                        e.currentTarget.style.color = "#555555";
                      }
                    }}
                  >
                    Todos
                  </button>
                  {categorias.map((cat) => {
                    const Icon = getIconeCategoria(cat.slug);
                    const isSelected = categoriasFiltro.includes(cat.slug);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoria(cat.slug)}
                        className={cn(
                          "h-10 px-6 font-semibold border-0 transition-all duration-300 flex items-center gap-2 relative",
                          isSelected ? "shadow-lg" : "hover:shadow-md"
                        )}
                        style={{
                          borderRadius: "12px",
                          backgroundColor: isSelected ? "#1E90FF" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#555555",
                          border: isSelected ? "none" : "1px solid #E0E0E0",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#1E90FF";
                            e.currentTarget.style.color = "#1E90FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#E0E0E0";
                            e.currentTarget.style.color = "#555555";
                          }
                        }}
                      >
                        {isSelected && (
                          <div
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#00CFFF" }}
                          >
                            <Check
                              className="w-3 h-3"
                              style={{ color: "#FFFFFF" }}
                            />
                          </div>
                        )}
                        <Icon className="w-4 h-4" />
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operadora - MULTI SELECT */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label
                    className="text-sm font-bold"
                    style={{ color: "#111111" }}
                  >
                    Operadora
                  </label>
                  <Badge
                    className="border-0 px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "#FF6B35",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                    }}
                  >
                    MULTI
                  </Badge>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setOperadora([])}
                    className={cn(
                      "h-10 px-6 font-semibold border-0 transition-all duration-300",
                      operadorasFiltro.length === 0
                        ? "shadow-lg"
                        : "hover:shadow-md"
                    )}
                    style={{
                      borderRadius: "12px",
                      backgroundColor:
                        operadorasFiltro.length === 0 ? "#1E90FF" : "#FFFFFF",
                      color:
                        operadorasFiltro.length === 0 ? "#FFFFFF" : "#555555",
                      border:
                        operadorasFiltro.length === 0
                          ? "none"
                          : "1px solid #E0E0E0",
                    }}
                    onMouseEnter={(e) => {
                      if (operadorasFiltro.length > 0) {
                        e.currentTarget.style.borderColor = "#1E90FF";
                        e.currentTarget.style.color = "#1E90FF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (operadorasFiltro.length > 0) {
                        e.currentTarget.style.borderColor = "#E0E0E0";
                        e.currentTarget.style.color = "#555555";
                      }
                    }}
                  >
                    Todas
                  </button>
                  {Object.entries(OPERADORA_COLORS).map(([key, config]) => {
                    const isSelected = operadorasFiltro.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleOperadora(key)}
                        className={cn(
                          "h-10 px-6 font-bold border-0 transition-all duration-300 relative",
                          isSelected ? "shadow-lg" : "hover:shadow-md"
                        )}
                        style={{
                          borderRadius: "12px",
                          backgroundColor: isSelected ? "#1E90FF" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#555555",
                          border: isSelected ? "none" : "1px solid #E0E0E0",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#1E90FF";
                            e.currentTarget.style.color = "#1E90FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#E0E0E0";
                            e.currentTarget.style.color = "#555555";
                          }
                        }}
                      >
                        {isSelected && (
                          <div
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#00CFFF" }}
                          >
                            <Check
                              className="w-3 h-3"
                              style={{ color: "#FFFFFF" }}
                            />
                          </div>
                        )}
                        {config.name}
                      </button>
                    );
                  })}
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

        {/* Contador de Resultados e Ordenação */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className="border-0 font-semibold px-4 py-2"
              style={{
                backgroundColor: "#FAFAFA",
                color: "#111111",
                borderRadius: "12px",
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
                  className="border-0 font-semibold"
                  style={{
                    backgroundColor: "rgba(30,144,255,0.1)",
                    color: "#1E90FF",
                    borderRadius: "12px",
                  }}
                >
                  {categorias.find((c) => c.slug === cat)?.nome || cat}
                </Badge>
              ))}
            {operadorasFiltro.length > 0 &&
              operadorasFiltro.map((op) => (
                <Badge
                  key={op}
                  className="border-0 font-semibold"
                  style={{
                    backgroundColor: "rgba(30,144,255,0.1)",
                    color: "#1E90FF",
                    borderRadius: "12px",
                  }}
                >
                  {OPERADORA_COLORS[op]?.name || op}
                </Badge>
              ))}
            <Badge
              className="border-0 font-semibold"
              style={{
                backgroundColor: "rgba(30,144,255,0.1)",
                color: "#1E90FF",
                borderRadius: "12px",
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
              className="h-10 px-4 font-semibold outline-none transition-all"
              style={{
                borderRadius: "12px",
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
                            "group relative overflow-hidden transition-all duration-300 flex flex-col",
                            product.destaque ? "shadow-xl" : "shadow-md"
                          )}
                          style={{
                            border: product.destaque
                              ? "2px solid #1E90FF"
                              : "1px solid #E0E0E0",
                            borderRadius: "16px",
                            backgroundColor: "#FFFFFF",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.02)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 24px rgba(30,144,255,0.15)";
                            if (!product.destaque)
                              e.currentTarget.style.borderColor = "#1E90FF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = product.destaque
                              ? "0 8px 16px rgba(0,0,0,0.1)"
                              : "0 2px 8px rgba(0,0,0,0.05)";
                            if (!product.destaque)
                              e.currentTarget.style.borderColor = "#E0E0E0";
                          }}
                        >
                          {/* 🆕 BADGE DINÂMICO (prioridade sobre destaque) */}
                          {badgeDinamico ? (
                            <div className="absolute top-4 right-4 z-10">
                              <Badge
                                className="border-0 shadow-lg"
                                style={{
                                  backgroundColor:
                                    badgeDinamico.variante === "success"
                                      ? "#1AD1C1"
                                      : badgeDinamico.variante === "info"
                                      ? "#1E90FF"
                                      : badgeDinamico.variante === "primary"
                                      ? "#00CFFF"
                                      : badgeDinamico.variante === "warning"
                                      ? "#FF6B35"
                                      : "#555555",
                                  color: "#FFFFFF",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                }}
                              >
                                {badgeDinamico.texto}
                              </Badge>
                            </div>
                          ) : (
                            product.destaque && (
                              <div className="absolute top-4 right-4 z-10">
                                <Badge
                                  className="border-0 shadow-lg"
                                  style={{
                                    backgroundColor: "#FF6B35",
                                    color: "#FFFFFF",
                                    borderRadius: "12px",
                                  }}
                                >
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
                                  <Badge className={cn("mb-3", colors.badge)}>
                                    <Smartphone className="w-3 h-3 mr-1" />
                                    {colors.name}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                  {(() => {
                                    const getCategoryIcon = (
                                      categoria: string
                                    ) => {
                                      const cat = categoria.toLowerCase();
                                      if (
                                        cat.includes("fibra") ||
                                        cat.includes("link dedicado")
                                      )
                                        return Wifi;
                                      if (
                                        cat.includes("móvel") ||
                                        cat.includes("movel")
                                      )
                                        return Smartphone;
                                      if (
                                        cat.includes("office") ||
                                        cat.includes("365")
                                      )
                                        return Briefcase;
                                      return Smartphone;
                                    };
                                    const CategoryIcon = getCategoryIcon(
                                      product.categoria
                                    );
                                    return (
                                      <CategoryIcon className="h-5 w-5 text-slate-900 stroke-[1.5]" />
                                    );
                                  })()}
                                  <h3
                                    className="text-xl font-bold line-clamp-2 transition-colors"
                                    style={{ color: "#111111" }}
                                  >
                                    {product.nome}
                                  </h3>
                                </div>
                                <p
                                  className="text-sm line-clamp-2"
                                  style={{ color: "#555555" }}
                                >
                                  {product.descricao}
                                </p>
                              </div>

                              {/* Specs principais */}
                              <div className="flex items-center gap-3 flex-wrap">
                                {product.velocidade && (
                                  <div
                                    className="flex items-center gap-1.5 px-3 py-1.5"
                                    style={{
                                      backgroundColor: "rgba(30,144,255,0.1)",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    <Zap
                                      className="w-4 h-4"
                                      style={{ color: "#1E90FF" }}
                                    />
                                    <span
                                      className="text-sm font-bold"
                                      style={{ color: "#111111" }}
                                    >
                                      {product.velocidade}
                                    </span>
                                  </div>
                                )}
                                {product.franquia && (
                                  <div
                                    className="flex items-center gap-1.5 px-3 py-1.5"
                                    style={{
                                      backgroundColor: "rgba(30,144,255,0.1)",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    <Smartphone
                                      className="w-4 h-4"
                                      style={{ color: "#1E90FF" }}
                                    />
                                    <span
                                      className="text-sm font-bold"
                                      style={{ color: "#111111" }}
                                    >
                                      {product.franquia}
                                    </span>
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
                              {product.beneficios &&
                                product.beneficios.length > 0 && (
                                  <ul className="space-y-2">
                                    {product.beneficios
                                      .slice(0, 3)
                                      .map((beneficio: string, i: number) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2 text-sm text-[#666666]"
                                        >
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
                              <div
                                className="pt-4"
                                style={{ borderTop: "1px solid #E0E0E0" }}
                              >
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span
                                    className="text-4xl font-bold"
                                    style={{ color: "#1E90FF" }}
                                  >
                                    {formatPrice(product.preco)}
                                  </span>
                                  <span
                                    className="text-sm"
                                    style={{ color: "#555555" }}
                                  >
                                    /mês
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {product.precoInstalacao > 0 && (
                                    <p
                                      className="text-xs"
                                      style={{ color: "#555555" }}
                                    >
                                      + {formatPrice(product.precoInstalacao)}{" "}
                                      instalação
                                    </p>
                                  )}
                                  {product.linhasInclusas > 1 && (
                                    <p
                                      className="text-xs font-medium"
                                      style={{ color: "#1E90FF" }}
                                    >
                                      ✓ {product.linhasInclusas} linhas inclusas
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Diferenciais Colapsáveis */}
                            {product.diferenciais &&
                              product.diferenciais.length > 0 && (
                                <div
                                  className="border-t pt-4"
                                  style={{ borderColor: "#E0E0E0" }}
                                >
                                  <button
                                    className="w-full flex items-center justify-between text-left font-semibold text-sm transition-colors"
                                    style={{ color: "#111111" }}
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
                                      <ChevronUp
                                        className="w-4 h-4"
                                        style={{ color: "#1E90FF" }}
                                      />
                                    ) : (
                                      <ChevronDown
                                        className="w-4 h-4"
                                        style={{ color: "#555555" }}
                                      />
                                    )}
                                  </button>
                                  {diferencialAberto === product.id && (
                                    <ul className="mt-3 space-y-2 animate-in fade-in duration-200">
                                      {product.diferenciais.map(
                                        (diferencial: string, i: number) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm"
                                            style={{ color: "#555555" }}
                                          >
                                            <Check
                                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                                              style={{ color: "#1E90FF" }}
                                            />
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
                                  className="w-full gap-2 h-12 transition-all duration-300 font-bold shadow-lg border-0"
                                  style={{
                                    backgroundColor: "#1AD1C1",
                                    color: "#FFFFFF",
                                    borderRadius: "12px",
                                  }}
                                  onClick={() => toggleSelecaoPlano(product)}
                                >
                                  <Check className="w-5 h-5" />
                                  Selecionado
                                </Button>
                              ) : (
                                <Button
                                  className="w-full gap-2 h-12 transition-all duration-300 font-bold shadow-lg border-0"
                                  style={{
                                    backgroundColor: "#1E90FF",
                                    color: "#FFFFFF",
                                    borderRadius: "12px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#00CFFF";
                                    e.currentTarget.style.transform =
                                      "scale(1.02)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#1E90FF";
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                  }}
                                  onClick={() => toggleSelecaoPlano(product)}
                                >
                                  Selecionar Plano
                                </Button>
                              )}
                              {/* Calculadora - Só exibe se produto permitir */}
                              {product.permiteCalculadoraLinhas && (
                                <Button
                                  variant="outline"
                                  className="w-full gap-2 h-11 font-semibold border-0 transition-all"
                                  style={{
                                    border: "1px solid #E0E0E0",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: "12px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor =
                                      "#1E90FF";
                                    e.currentTarget.style.backgroundColor =
                                      "rgba(30,144,255,0.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor =
                                      "#E0E0E0";
                                    e.currentTarget.style.backgroundColor =
                                      "#FFFFFF";
                                  }}
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
