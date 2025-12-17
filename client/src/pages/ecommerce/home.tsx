import { useState } from "react";
import {
  Wifi,
  Smartphone,
  Check,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Users,
  User,
  Clock,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Mail,
  MapPin,
  Search,
  Briefcase,
  X,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { CartSidebar } from "@/components/ecommerce/CartSidebar";
import SeletorRapido from "@/components/ecommerce/SeletorRapido";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { useContextoInteligenteStore } from "@/stores/contextoInteligenteStore";
import { useBadgeDinamico } from "@/hooks/useBadgeDinamico";
import type {
  EcommerceCategory,
  EcommerceProduct,
  EcommerceBanner,
} from "@shared/schema";

// Cores das operadoras (mesmo padrão da página /planos)
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

export default function EcommerceHome() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Estados do Comparador Inteligente
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | null>(null);
  const [modalidade, setModalidade] = useState<"novo" | "portabilidade" | null>(
    null
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    string[]
  >([]);
  const [operadorasSelecionadas, setOperadorasSelecionadas] = useState<
    string[]
  >([]);
  const [quantidadeLinhas, setQuantidadeLinhas] = useState<number>(1);
  const [mostrarCampoPersonalizado, setMostrarCampoPersonalizado] =
    useState(false);
  const [linhasPersonalizado, setLinhasPersonalizado] = useState<string>("10");
  const [tooltipCategoriaOpen, setTooltipCategoriaOpen] = useState(false);
  const [tooltipOperadoraOpen, setTooltipOperadoraOpen] = useState(false);

  const { data: categorias = [] } = useQuery<EcommerceCategory[]>({
    queryKey: ["/api/ecommerce/public/categories"],
  });

  const { data: produtos = [] } = useQuery<EcommerceProduct[]>({
    queryKey: ["/api/ecommerce/public/products"],
  });

  const { data: banners = [] } = useQuery<EcommerceBanner[]>({
    queryKey: ["/api/ecommerce/public/banners", "home"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce/public/banners/home");
      if (!res.ok) throw new Error("Erro ao buscar banners");
      return res.json();
    },
  });

  const banner = banners[0]; // Pega o primeiro banner ativo

  const { addItem } = useCartStore();
  const { contextoAtivo, sinais } = useContextoInteligenteStore();

  const getCategoryIcon = (categoria: string) => {
    const cat = categoria.toLowerCase();
    if (cat.includes("fibra") || cat.includes("link dedicado")) return Wifi;
    if (cat.includes("móvel") || cat.includes("movel")) return Smartphone;
    if (cat.includes("office") || cat.includes("365")) return Briefcase;
    return Smartphone;
  };

  // Função para navegar com filtros
  const handleComparar = () => {
    const params = new URLSearchParams();
    if (tipoPessoa) params.set("tipo", tipoPessoa);
    if (modalidade) params.set("modalidade", modalidade);
    if (categoriasSelecionadas.length > 0)
      params.set("categorias", categoriasSelecionadas.join(","));
    if (operadorasSelecionadas.length > 0)
      params.set("operadoras", operadorasSelecionadas.join(","));

    const linhasFinais = mostrarCampoPersonalizado
      ? parseInt(linhasPersonalizado)
      : quantidadeLinhas;
    params.set("linhas", linhasFinais.toString());

    window.location.href = `/ecommerce/planos?${params.toString()}`;
  };

  // Funções para toggle multi-select
  const toggleCategoria = (catSlug: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(catSlug)
        ? prev.filter((c) => c !== catSlug)
        : [...prev, catSlug]
    );
  };

  const toggleOperadora = (op: string) => {
    setOperadorasSelecionadas((prev) =>
      prev.includes(op) ? prev.filter((o) => o !== op) : [...prev, op]
    );
  };

  // Calcular badges dinâmicos para os planos
  const badgesMap = useBadgeDinamico(produtos, contextoAtivo);

  // Planos recomendados baseados no contexto inteligente ou aleatórios
  const planosPopulares = (() => {
    // Verificar se há contexto inteligente ativo
    const temContexto =
      contextoAtivo.categorias.length > 0 ||
      contextoAtivo.operadoras.length > 0 ||
      sinais.planosVisualizados.length > 0;

    if (temContexto) {
      // Filtrar por contexto
      let planosRecomendados = produtos.filter((p) => p.ativo);

      // Priorizar por categoria do contexto
      if (contextoAtivo.categorias.length > 0) {
        const planosCategoria = planosRecomendados.filter((p) =>
          contextoAtivo.categorias.some((cat) =>
            p.categoria.toLowerCase().includes(cat.toLowerCase())
          )
        );
        if (planosCategoria.length >= 4) {
          planosRecomendados = planosCategoria;
        }
      }

      // Priorizar por operadora do contexto
      if (contextoAtivo.operadoras.length > 0) {
        const planosOperadora = planosRecomendados.filter((p) =>
          contextoAtivo.operadoras.includes(p.operadora)
        );
        if (planosOperadora.length >= 4) {
          planosRecomendados = planosOperadora;
        }
      }

      // Embaralhar e pegar 4
      return planosRecomendados.sort(() => Math.random() - 0.5).slice(0, 4);
    }

    // Sem contexto: escolher aleatoriamente entre planos ativos
    return produtos
      .filter((p) => p.ativo)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
  })();

  const beneficios = [
    {
      icon: Shield,
      title: "Sem Burocracia",
      description: "Contratação 100% online em poucos minutos",
    },
    {
      icon: Zap,
      title: "Suporte Rápido",
      description: "Atendimento ágil quando você precisar",
    },
    {
      icon: Award,
      title: "Planos Personalizados",
      description: "Encontre o plano ideal para seu perfil",
    },
    {
      icon: Users,
      title: "Melhor Custo-Benefício",
      description: "Compare e economize com as melhores ofertas",
    },
  ];

  const faqItems = [
    {
      pergunta: "Como funciona a contratação online?",
      resposta:
        "É simples! Escolha seu plano, preencha seus dados e pronto. Em poucos minutos você terá acesso ao seu novo plano de telecomunicações.",
    },
    {
      pergunta: "Posso fazer portabilidade do meu número?",
      resposta:
        "Sim! Oferecemos portabilidade gratuita para todos os planos. Seu número atual será mantido sem custos adicionais.",
    },
    {
      pergunta: "Qual a diferença entre os planos PF e PJ?",
      resposta:
        "Planos PF são para uso pessoal, com preços e benefícios voltados para indivíduos. Planos PJ oferecem recursos empresariais como múltiplas linhas e gestão centralizada.",
    },
    {
      pergunta: "Existe fidelidade nos planos?",
      resposta:
        "Depende do plano escolhido. Temos opções com e sem fidelidade. Planos com fidelidade geralmente oferecem descontos maiores.",
    },
    {
      pergunta: "Como funciona a instalação?",
      resposta:
        "Após a aprovação do seu pedido, nossa equipe técnica entrará em contato para agendar a instalação em até 48 horas.",
    },
  ];

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <EcommerceHeader />

      {/* Banner Visual no Topo - Design System Clean */}
      {banner ? (
        <section className="relative w-full overflow-hidden bg-white shadow-sm">
          {/* Pattern decorativo suave */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #111111 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>

          <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Título */}
              <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight transition-transform duration-300 hover:scale-[1.02] text-gray-900">
                {banner.titulo}
              </h1>

              {/* Subtítulo */}
              {banner.subtitulo && (
                <p className="text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed text-gray-600">
                  {banner.subtitulo}
                </p>
              )}

              {/* CTA Button */}
              {banner.linkDestino && banner.linkTexto && (
                <div className="pt-8">
                  <Button
                    asChild
                    size="lg"
                    className="font-semibold text-lg px-12 h-16 transition-all hover:scale-105 shadow-sm hover:shadow-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <a
                      href={banner.linkDestino}
                      className="flex items-center gap-3"
                    >
                      {banner.linkTexto}
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <Badge className="border-0 px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:scale-110 rounded-xl bg-blue-600 text-white">
                  <Star className="w-4 h-4 mr-2 inline fill-white" />
                  Avaliação 4.8★
                </Badge>
                <Badge className="border-0 px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:scale-110 rounded-xl bg-orange-500 text-white">
                  <Award className="w-4 h-4 mr-2 inline" />
                  #1 em 2025
                </Badge>
                <Badge className="border px-6 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white rounded-xl bg-white text-gray-900 border-gray-300">
                  <Shield className="w-4 h-4 mr-2 inline" />
                  100% Seguro
                </Badge>
              </div>
            </div>
          </div>

          {/* Onda decorativa */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                d="M0 0L60 10C120 20 240 40 360 43.3C480 46.7 600 33.3 720 30C840 26.7 960 33.3 1080 36.7C1200 40 1320 40 1380 40L1440 40V60H0V0Z"
                fill="#FAFAFA"
              />
            </svg>
          </div>
        </section>
      ) : null}

      {/* 3️⃣ COMPARADOR INTELIGENTE - Layout Horizontal */}
      <section
        id="comparador"
        className="pb-16 md:pb-24"
        style={{ backgroundColor: "#FAFAFA" }}
      >
        {/* Header com Fundo Gradiente - Full Width */}
        <div
          className="text-center py-12 md:py-16 space-y-4 mb-10"
          style={{
            background: "linear-gradient(135deg, #1E90FF 0%, #1570D6 100%)",
            boxShadow: "0 20px 60px rgba(30, 144, 255, 0.4)",
          }}
        >
          <h2
            className="text-4xl md:text-5xl font-black tracking-tight px-6"
            style={{ color: "#FFFFFF" }}
          >
            Encontre o plano ideal para o seu perfil
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto px-6"
            style={{ color: "rgba(255, 255, 255, 0.95)" }}
          >
            Compare planos de forma inteligente e contrate direto pela
            plataforma
          </p>
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Filtros em Card Branco */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="space-y-6">
                {/* Filtro 1: PF ou PJ - OBRIGATÓRIO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-base font-semibold text-gray-900">
                      Pessoa Física ou Jurídica
                    </label>
                    <Badge className="text-xs font-semibold bg-blue-100 text-blue-700 border-0 px-2 py-0.5">
                      OBRIGATÓRIO
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "PF", label: "Pessoa Física (PF)", icon: User },
                      {
                        value: "PJ",
                        label: "Pessoa Jurídica (PJ)",
                        icon: Briefcase,
                      },
                    ].map((tipo) => (
                      <button
                        key={tipo.value}
                        onClick={() => setTipoPessoa(tipo.value as "PF" | "PJ")}
                        className={cn(
                          "h-12 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2",
                          tipoPessoa === tipo.value
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        )}
                      >
                        <tipo.icon className="w-5 h-5" />
                        {tipo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro 2: Novo Cliente ou Portabilidade */}
                <div className="space-y-3">
                  <label className="block text-base font-semibold text-gray-900">
                    Cliente novo ou portabilidade
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "novo", label: "Sou Cliente Novo" },
                      { value: "portabilidade", label: "Quero Portabilidade" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setModalidade(opt.value as "novo" | "portabilidade")
                        }
                        className={cn(
                          "h-12 px-4 rounded-xl font-medium text-sm transition-all duration-200",
                          modalidade === opt.value
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro 3: Categoria - MULTI SELECT */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-semibold text-gray-900">
                        Que tipo de plano você busca
                      </label>
                      <Badge className="text-xs text-gray-500 bg-gray-100 border-0">
                        Seleção múltipla
                      </Badge>
                      <TooltipProvider>
                        <Tooltip open={tooltipCategoriaOpen} onOpenChange={setTooltipCategoriaOpen}>
                          <TooltipTrigger asChild>
                            <button 
                              className="focus:outline-none"
                              onClick={() => {
                                setTooltipCategoriaOpen(true);
                                setTimeout(() => setTooltipCategoriaOpen(false), 3000);
                              }}
                            >
                              <HelpCircle
                                className="w-3.5 h-3.5"
                                style={{ color: "#999999" }}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Você pode escolher mais de uma opção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categorias.slice(0, 4).map((cat) => {
                        const IconeCategoria = getCategoryIcon(cat.nome);
                        const catSlug = cat.slug || cat.nome.toLowerCase();
                        const isSelected =
                          categoriasSelecionadas.includes(catSlug);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategoria(catSlug)}
                            className={cn(
                              "h-auto min-h-[48px] px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 flex flex-col items-center gap-2",
                              isSelected
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            )}
                          >
                            <IconeCategoria className="w-5 h-5" />
                            {cat.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtro 4: Operadora - MULTI SELECT */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-semibold text-gray-900">
                        Tem preferência de operadora
                      </label>
                      <Badge className="text-xs text-gray-500 bg-gray-100 border-0">
                        Seleção múltipla
                      </Badge>
                      <TooltipProvider>
                        <Tooltip open={tooltipOperadoraOpen} onOpenChange={setTooltipOperadoraOpen}>
                          <TooltipTrigger asChild>
                            <button 
                              className="focus:outline-none"
                              onClick={() => {
                                setTooltipOperadoraOpen(true);
                                setTimeout(() => setTooltipOperadoraOpen(false), 3000);
                              }}
                            >
                              <HelpCircle
                                className="w-3.5 h-3.5"
                                style={{ color: "#999999" }}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Você pode escolher mais de uma opção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "V", label: "VIVO" },
                        { value: "C", label: "CLARO" },
                        { value: "T", label: "TIM" },
                        { value: "todos", label: "Todas" },
                      ].map((op) => {
                        const isSelected =
                          op.value === "todos"
                            ? operadorasSelecionadas.length === 0
                            : operadorasSelecionadas.includes(op.value);

                        return (
                          <button
                            key={op.value}
                            onClick={() => {
                              if (op.value === "todos") {
                                setOperadorasSelecionadas([]);
                              } else {
                                toggleOperadora(op.value);
                              }
                            }}
                            className={cn(
                              "h-10 px-4 rounded-full font-medium text-sm transition-all duration-200",
                              isSelected
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            )}
                          >
                            {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filtro: Quantidade de Linhas - Último, lado esquerdo reduzido */}
                <div className="max-w-md space-y-3">
                  <label className="block text-base font-semibold text-gray-900">
                    Quantas linhas você precisa
                  </label>
                  {!mostrarCampoPersonalizado ? (
                    <select
                      value={quantidadeLinhas}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val === 10) {
                          setMostrarCampoPersonalizado(true);
                          setLinhasPersonalizado("10");
                          setTimeout(() => {
                            document.getElementById("linhas-personalizado-home")?.focus();
                          }, 100);
                        } else {
                          setQuantidadeLinhas(val);
                        }
                      }}
                      className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                        id="linhas-personalizado-home"
                        type="number"
                        min="10"
                        max="999"
                        value={linhasPersonalizado}
                        onChange={(e) => setLinhasPersonalizado(e.target.value)}
                        className="flex-1 h-12 px-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Digite a quantidade de linhas..."
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setMostrarCampoPersonalizado(false);
                          setQuantidadeLinhas(1);
                        }}
                        className="h-12 px-4 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Button
                    size="lg"
                    onClick={handleComparar}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    Comparar Planos
                  </Button>
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-center gap-6 pt-2 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Resultado em segundos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">100% Grátis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Sem Compromisso</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 3 Planos Recomendados - Seção Separada */}
      {planosPopulares.length > 0 && (
        <section
          className="py-16 md:py-20"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h3
                  className="text-3xl md:text-4xl font-black mb-3"
                  style={{ color: "#111111" }}
                >
                  Planos que fazem sentido de verdade
                </h3>
                <p className="text-lg" style={{ color: "#555555" }}>
                  Selecionados por usuários que buscam desempenho e estabilidade
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {planosPopulares.slice(0, 3).map((produto, index) => {
                  const IconeCategoria = getCategoryIcon(produto.categoria);
                  // Buscar badge dinâmico
                  const badgeDinamico = badgesMap.get(produto.id);
                  // Buscar cores da operadora
                  const colors = produto.operadora
                    ? OPERADORA_COLORS[produto.operadora]
                    : undefined;

                  return (
                    <div
                      key={produto.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-400"
                    >
                      {/* Badge Dinâmico ou Destaque */}
                      {badgeDinamico ? (
                        <div className="absolute top-4 right-4">
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
                        produto.destaque && (
                          <div className="absolute top-4 right-4">
                            <Badge className="text-xs rounded-full border-0 px-3 py-1 bg-orange-500/10 text-orange-700">
                              🔥 Destaque
                            </Badge>
                          </div>
                        )
                      )}

                      {/* Ícone da Categoria */}
                      <div className="mb-6">
                        <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                          <IconeCategoria className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>

                      {/* Badge Operadora */}
                      {colors && (
                        <Badge className="mb-3 text-xs rounded-full bg-blue-50 text-blue-700 border-0">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {colors.name}
                        </Badge>
                      )}

                      {/* Título */}
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {produto.nome}
                      </h4>

                      {/* Categoria */}
                      <p className="text-sm text-gray-600 mb-4">
                        {produto.categoria}
                      </p>

                      {/* Preço */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-blue-600">
                            {formatPrice(produto.preco)}
                          </span>
                          <span className="text-sm text-gray-500">/mês</span>
                        </div>
                      </div>

                      {/* Especificações Principais */}
                      <div className="space-y-2 mb-6">
                        {produto.velocidade && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold text-gray-900">
                                Velocidade:
                              </span>{" "}
                              {produto.velocidade}
                            </span>
                          </div>
                        )}
                        {produto.franquia && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold text-gray-900">
                                Franquia:
                              </span>{" "}
                              {produto.franquia}
                            </span>
                          </div>
                        )}
                        {produto.fidelidade != null &&
                          produto.fidelidade > 0 && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 flex-shrink-0 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-700">
                                  Fidelidade:
                                </span>{" "}
                                {produto.fidelidade} meses
                              </span>
                            </div>
                          )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => addItem(produto)}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors mt-6"
                      >
                        Contratar Agora
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Link Ver Mais */}
              <div className="text-center mt-10">
                <a href="/ecommerce/planos">
                  <Button
                    size="lg"
                    className="font-bold text-base transition-all duration-300"
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #1E90FF",
                      backgroundColor: "#FFFFFF",
                      color: "#1E90FF",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1E90FF";
                      e.currentTarget.style.color = "#FFFFFF";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                      e.currentTarget.style.color = "#1E90FF";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Ver Todos os Planos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Inspiração em Sites de Imóveis */}
      <section className="py-12" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { numero: "200+", label: "Planos Disponíveis", icon: TrendingUp },
              { numero: "50mil+", label: "Clientes Ativos", icon: Users },
              { numero: "4.8★", label: "Avaliação Média", icon: Star },
              { numero: "24/7", label: "Suporte Online", icon: Clock },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center space-y-2 p-4 transition-transform duration-300 hover:scale-110"
              >
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-blue-100">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-blue-600">
                  {stat.numero}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4️⃣ PLANOS RECOMENDADOS - Cards Clean */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        {/* Card Horizontal com Gradiente Laranja */}
        <div className="mb-16">
          <div className="p-8 md:p-10 text-center transition-all duration-300 hover:shadow-xl rounded-2xl shadow-sm bg-gradient-to-br from-orange-500 to-orange-600">
            <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight text-white">
              O plano certo, na hora certa
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-white/95">
              Planos destacados pelo desempenho e relevância para você
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {planosPopulares.map((plano) => {
            // Buscar badge dinâmico para este plano
            const badgeDinamico = badgesMap.get(plano.id);
            // Buscar cores da operadora
            const colors =
              OPERADORA_COLORS[
                plano.operadora as keyof typeof OPERADORA_COLORS
              ];

            return (
              <Card
                key={plano.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Badge Dinâmico tem prioridade sobre badge de destaque */}
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
                  plano.destaque && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="text-xs rounded-full border-0 px-3 py-1 bg-orange-500/10 text-orange-700">
                        🔥 Destaque
                      </Badge>
                    </div>
                  )
                )}

                <CardContent className="p-7 flex flex-col h-full relative z-10">
                  <div className="space-y-5 flex-1">
                    <div>
                      {/* Badge da Operadora (estilo /planos) */}
                      {colors && (
                        <Badge className="mb-3 text-xs rounded-full bg-blue-50 text-blue-700 border-0">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {colors.name}
                        </Badge>
                      )}

                      {/* Título */}
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                        {plano.nome}
                      </h3>
                    </div>

                    {/* Specs principais com badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {plano.velocidade && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                          <Zap className="w-4 h-4 text-gray-700" />
                          <span className="text-sm font-semibold text-gray-900">
                            {plano.velocidade}
                          </span>
                        </div>
                      )}
                      {plano.franquia && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                          <Smartphone className="w-4 h-4 text-gray-700" />
                          <span className="text-sm font-semibold text-gray-900">
                            {plano.franquia}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lista de benefícios */}
                    <div className="space-y-2">
                      {plano.beneficios &&
                        plano.beneficios.slice(0, 3).map((beneficio, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                            <span>{beneficio}</span>
                          </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatPrice(plano.preco)}
                        <span className="text-sm font-normal ml-1 text-gray-500">/mês</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors mt-6 border-0"
                    onClick={() => addItem(plano, 1)}
                  >
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a href="/ecommerce/planos">
            <Button
              size="lg"
              variant="outline"
              className="font-semibold transition-all h-12 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Ver Todos os Planos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* 5️⃣ BENEFÍCIOS / DIFERENCIAIS */}
      <section
        id="beneficios"
        className="py-20 md:py-28"
        style={{ backgroundColor: "#FAFAFA" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              className="mb-6 border-0 px-6 py-2.5 font-black text-sm"
              style={{
                backgroundColor: "#1E90FF",
                color: "#FFFFFF",
                borderRadius: "12px",
              }}
            >
              ⚡ Vantagens Exclusivas
            </Badge>
            <h2
              className="text-4xl md:text-5xl font-black mb-5 tracking-tight"
              style={{ color: "#111111" }}
            >
              Por que escolher a TelePlanos?
            </h2>
            <p
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: "#555555" }}
            >
              Oferecemos a melhor experiência em contratação de planos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {beneficios.map((beneficio, i) => (
              <Card
                key={i}
                className="group hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E0E0E0",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(30,144,255,0.15)";
                  e.currentTarget.style.borderColor = "#1E90FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#E0E0E0";
                }}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div
                    className="w-16 h-16 mx-auto flex items-center justify-center group-hover:scale-110 transition-all duration-300"
                    style={{
                      backgroundColor: "#1E90FF",
                      borderRadius: "16px",
                    }}
                  >
                    <beneficio.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3
                    className="text-xl font-black transition-colors"
                    style={{ color: "#111111" }}
                  >
                    {beneficio.title}
                  </h3>
                  <p style={{ color: "#555555" }}>{beneficio.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6️⃣ PROMOÇÕES / OFERTAS */}
      <section
        className="py-20 md:py-28"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              className="mb-6 border-0 px-6 py-2.5 font-black text-sm"
              style={{
                backgroundColor: "#FF6B35",
                color: "#FFFFFF",
                borderRadius: "12px",
              }}
            >
              🎁 Ofertas Especiais
            </Badge>
            <h2
              className="text-4xl md:text-5xl font-black mb-5 tracking-tight"
              style={{ color: "#111111" }}
            >
              Ofertas do Mês
            </h2>
            <p
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: "#555555" }}
            >
              Aproveite descontos exclusivos por tempo limitado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                desconto: "30%",
                titulo: "Planos Fibra",
                desc: "Desconto nos 3 primeiros meses",
              },
              {
                desconto: "R$ 0",
                titulo: "Instalação Grátis",
                desc: "Para todos os novos clientes",
              },
              {
                desconto: "2x",
                titulo: "Velocidade Dobrada",
                desc: "Nos planos acima de 300 Mbps",
              },
            ].map((oferta, i) => (
              <Card
                key={i}
                className="group transition-all duration-300"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E0E0E0",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(30,144,255,0.15)";
                  e.currentTarget.style.borderColor = "#1E90FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#E0E0E0";
                }}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div
                    className="text-5xl font-bold"
                    style={{ color: "#1E90FF" }}
                  >
                    {oferta.desconto}
                  </div>
                  <div>
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{ color: "#111111" }}
                    >
                      {oferta.titulo}
                    </h3>
                    <p style={{ color: "#555555" }}>{oferta.desc}</p>
                  </div>
                  <Button
                    className="w-full font-semibold h-12 shadow-md transition-all duration-300 border-0"
                    style={{
                      backgroundColor: "#FF6B35",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e55b25";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FF6B35";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Saiba Mais
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8️⃣ FAQ / AJUDA RÁPIDA */}
      <section
        className="container mx-auto px-4 py-20 md:py-28"
        style={{ backgroundColor: "#FAFAFA" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 border-0 px-6 py-2.5 font-bold text-sm bg-blue-600 text-white rounded-badge">
              ❓ Dúvidas Frequentes
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight text-gray-900">
              Perguntas Frequentes
            </h2>
            <p className="text-xl leading-relaxed text-gray-600">
              Tire suas dúvidas sobre nossos planos
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <Card
                key={i}
                className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400"
              >
                <CardContent className="p-0">
                  <button
                    className="w-full p-5 flex items-center justify-between text-left"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <span className="font-semibold text-base text-gray-900">
                      {item.pergunta}
                    </span>
                    {faqOpen === i ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {faqOpen === i && (
                    <div className="px-5 pb-5 text-sm text-gray-700">
                      {item.resposta}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7️⃣ DEPOIMENTOS (opcional - simples) */}
      <section
        id="depoimentos"
        className="py-20 md:py-28"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-6 border-0 px-6 py-2.5 font-bold text-sm bg-blue-600 text-white rounded-badge">
              ⭐ Avaliações
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight text-gray-900">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                nome: "Maria Silva",
                texto:
                  "Melhor decisão que tomei! Internet rápida e suporte excelente.",
                nota: 5,
              },
              {
                nome: "João Santos",
                texto: "Contratação super fácil. Recomendo!",
                nota: 5,
              },
              {
                nome: "Ana Costa",
                texto: "Preço justo e qualidade garantida. Muito satisfeita!",
                nota: 5,
              },
            ].map((dep, i) => (
              <Card
                key={i}
                className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-400"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(dep.nota)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-5 h-5 fill-orange-500 text-orange-500"
                      />
                    ))}
                  </div>
                  <p className="italic text-gray-900 text-sm">
                    "{dep.texto}"
                  </p>
                  <div className="font-semibold text-gray-700 text-sm">
                    {dep.nome}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9️⃣ CTA FINAL / BANNER DE AÇÃO */}
      <section
        className="py-20 md:py-28"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-8 border-0 px-6 py-2.5 font-bold text-sm bg-orange-500 text-white rounded-badge">
            🚀 Comece Agora
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gray-900">
            Pronto para escolher seu plano?
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed text-gray-600">
            Compare planos, economize e contrate online em poucos minutos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/ecommerce/comparador">
              <Button
                size="lg"
                className="h-12 px-10 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-200 border-0"
              >
                Comparar Planos Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="/ecommerce/planos">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-10 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-base hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                Ver Todos os Planos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="py-20 md:py-28"
        style={{ backgroundColor: "#FAFAFA", borderTop: "1px solid #E0E0E0" }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-6 border-0 px-6 py-2.5 font-bold text-sm bg-blue-600 text-white rounded-badge">
                📞 Fale Conosco
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight text-gray-900">
                Entre em Contato
              </h2>
              <p className="text-xl leading-relaxed text-gray-600">
                Estamos aqui para ajudar você
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400 hover:-translate-y-1">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900">
                    Telefone
                  </h3>
                  <p className="text-sm text-gray-600">0800 123 4567</p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400 hover:-translate-y-1">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900">
                    Email
                  </h3>
                  <p className="text-sm text-gray-600">contato@teleplanos.com</p>
                </CardContent>
              </Card>

              <Card className="text-center bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-400 hover:-translate-y-1">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900">
                    Endereço
                  </h3>
                  <p className="text-sm text-gray-600">São Paulo, SP</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <CartSidebar />
      <EcommerceFooter />
    </div>
  );
}
