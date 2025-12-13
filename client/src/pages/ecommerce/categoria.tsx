import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EcommerceProduct, EcommerceCategory } from "@shared/schema";
import CardInteligente from "@/components/ecommerce/CardInteligente";
import {
  recomendarProdutos,
  type FiltrosRecomendacao,
} from "@/lib/recomendacao";
import { useCartStore } from "@/stores/cartStore";
import ResumoMultiLinha from "@/components/ecommerce/ResumoMultiLinha";
import { useState } from "react";

export default function CategoriaPage() {
  const [, params] = useRoute("/ecommerce/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug;

  const [filtros, setFiltros] = useState<FiltrosRecomendacao>({
    tipoPessoa: "PF",
    modalidade: undefined,
    operadora: undefined,
  });

  const { data: categoria } = useQuery<EcommerceCategory>({
    queryKey: [`/api/ecommerce/public/categories/${slug}`],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/ecommerce/public/categories/${slug}`,
        {}
      );
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: produtos = [] } = useQuery<EcommerceProduct[]>({
    queryKey: ["/api/ecommerce/public/products", slug],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/ecommerce/public/products?categoria=${slug}`,
        {}
      );
      return res.json();
    },
    enabled: !!slug,
  });

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

  const addToCart = useCartStore((state: any) => state.addItem);

  // Aplicar recomendação inteligente
  const produtosRecomendados = recomendarProdutos(produtos, filtros);

  const handleAddToCart = (produto: EcommerceProduct) => {
    addToCart(produto, 1);
  };

  if (!categoria) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const categoriaInfo = {
    fibra: {
      title: "Internet Fibra Óptica Ultra Rápida",
      description:
        "Navegue, trabalhe e assista com a velocidade que você merece. Conexões estáveis de até 1 Gbps.",
      highlights: ["Ultra velocidade", "Estabilidade", "Fibra 100%"],
    },
    movel: {
      title: "Planos Móveis com Internet Ilimitada",
      description:
        "Fique conectado onde estiver com nossos planos de celular com apps ilimitados e cobertura nacional.",
      highlights: [
        "Apps ilimitados",
        "Cobertura 4G/5G",
        "Portabilidade grátis",
      ],
    },
    aparelhos: {
      title: "Smartphones e Aparelhos",
      description:
        "Os melhores dispositivos com parcelamento sem juros e entrega rápida.",
      highlights: ["Parcelamento 12x", "Entrega rápida", "Garantia estendida"],
    },
    combo: {
      title: "Combos Fibra + TV",
      description:
        "Economize combinando internet ultra rápida com TV por assinatura com canais HD.",
      highlights: ["Economia", "Canais HD", "Instalação única"],
    },
    office365: {
      title: "Microsoft Office 365 para Empresas",
      description:
        "Produtividade na nuvem com Word, Excel, PowerPoint, Teams e 1TB de armazenamento.",
      highlights: ["Apps completos", "1TB OneDrive", "Suporte técnico"],
    },
    "internet-dedicada": {
      title: "Internet Dedicada Empresarial",
      description:
        "Banda dedicada com SLA 99.5%, IP fixo e suporte 24/7 para sua empresa.",
      highlights: ["SLA 99.5%", "IP fixo", "Suporte 24/7"],
    },
    pabx: {
      title: "PABX Virtual na Nuvem",
      description:
        "Sistema de telefonia empresarial completo sem necessidade de equipamentos físicos.",
      highlights: ["Sem hardware", "Ramais ilimitados", "Integração CRM"],
    },
    locacao: {
      title: "Locação de Equipamentos",
      description:
        "Alugue roteadores, switches e equipamentos de rede com manutenção inclusa.",
      highlights: [
        "Manutenção inclusa",
        "Sem investimento",
        "Upgrade facilitado",
      ],
    },
  };

  const info = categoriaInfo[slug as keyof typeof categoriaInfo] || {
    title: categoria.nome,
    description: "Confira nossas ofertas especiais",
    highlights: ["Qualidade", "Melhor preço", "Suporte"],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero da Categoria */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/ecommerce")}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center mb-4">
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
              {categoria.nome}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{info.title}</h1>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl">
            {info.description}
          </p>

          <div className="flex gap-3">
            {info.highlights.map((highlight, i) => (
              <Badge
                key={i}
                className="bg-white/90 text-primary border-primary/20"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {highlight}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={filtros.tipoPessoa === "PF" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltros({ ...filtros, tipoPessoa: "PF" })}
              >
                Pessoa Física
              </Button>
              <Button
                variant={filtros.tipoPessoa === "PJ" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltros({ ...filtros, tipoPessoa: "PJ" })}
              >
                Pessoa Jurídica
              </Button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex gap-2">
              <Button
                variant={filtros.modalidade === "novo" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setFiltros({
                    ...filtros,
                    modalidade:
                      filtros.modalidade === "novo"
                        ? undefined
                        : ("novo" as const),
                  })
                }
              >
                Novo Número
              </Button>
              <Button
                variant={
                  filtros.modalidade === "portabilidade" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setFiltros({
                    ...filtros,
                    modalidade:
                      filtros.modalidade === "portabilidade"
                        ? undefined
                        : ("portabilidade" as const),
                  })
                }
              >
                Portabilidade
              </Button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex gap-2">
              {["V", "C", "T"].map((op) => (
                <Button
                  key={op}
                  variant={filtros.operadora === op ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFiltros({
                      ...filtros,
                      operadora: filtros.operadora === op ? undefined : op,
                    })
                  }
                >
                  {op === "V" ? "VIVO" : op === "C" ? "CLARO" : "TIM"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Produtos Recomendados + Sidebar Resumo */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Coluna principal - Produtos */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {filtros.tipoPessoa === "PF"
                  ? "Planos recomendados para você"
                  : "Planos recomendados para sua empresa"}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-slate-600">
                  {produtosRecomendados.length} plano(s) disponível(is)
                </p>
                {filtros.operadora && (
                  <Badge variant="secondary" className="font-semibold">
                    {filtros.operadora === "V"
                      ? "VIVO"
                      : filtros.operadora === "C"
                      ? "CLARO"
                      : "TIM"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {produtosRecomendados.map((produto, index) => (
                <CardInteligente
                  key={produto.id}
                  produto={produto}
                  onAddToCart={() => handleAddToCart(produto)}
                  isRecomendado={index < 3}
                  posicao={index}
                />
              ))}
            </div>

            {produtosRecomendados.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-slate-500 mb-4">
                  Nenhum plano encontrado com os filtros selecionados.
                </p>
                <Button
                  onClick={() =>
                    setFiltros({
                      tipoPessoa: "PF",
                      modalidade: undefined,
                      operadora: undefined,
                    })
                  }
                >
                  Limpar Filtros
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar - Resumo Multi-Linha (Desktop) */}
          <div className="hidden lg:block">
            <ResumoMultiLinha />
          </div>
        </div>
      </div>

      {/* Resumo Mobile (Drawer flutuante) */}
      <div className="lg:hidden">
        <ResumoMultiLinha />
      </div>

      {/* Seção de Adicionais */}
      {adicionais.length > 0 && (
        <div className="bg-white border-t py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <Badge className="mb-3">Complemente seu plano</Badge>
              <h2 className="text-3xl font-bold mb-2">Adicionais e Upgrades</h2>
              <p className="text-slate-600">
                Personalize seu plano com serviços adicionais. Use o botão "Nova
                Linha" no card do plano para adicionar linhas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adicionais.slice(0, 8).map((adicional: any) => (
                <Card
                  key={adicional.id}
                  className="p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {adicional.nome}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {adicional.tipo}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(adicional.preco / 100)}
                      </div>
                      <div className="text-xs text-slate-500">/mês</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    {adicional.descricao}
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    Selecione uma linha no resumo para adicionar
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
