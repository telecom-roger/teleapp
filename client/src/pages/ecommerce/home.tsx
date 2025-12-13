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
  Clock,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Mail,
  MapPin,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { CartSidebar } from "@/components/ecommerce/CartSidebar";
import SeletorRapido from "@/components/ecommerce/SeletorRapido";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import type { EcommerceCategory, EcommerceProduct } from "@shared/schema";

export default function EcommerceHome() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const { data: categorias = [] } = useQuery<EcommerceCategory[]>({
    queryKey: ["/api/ecommerce/public/categories"],
  });

  const { data: produtos = [] } = useQuery<EcommerceProduct[]>({
    queryKey: ["/api/ecommerce/public/products"],
  });

  const { addItem } = useCartStore();

  // Top 4 planos mais populares
  const planosPopulares = produtos
    .filter((p) => p.ativo && p.destaque)
    .slice(0, 4);

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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <EcommerceHeader />

      {/* 2️⃣ HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] text-white overflow-hidden">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
                🎯 Escolha Inteligente
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Escolha o plano ideal para você
              </h1>
              <p className="text-xl text-white/90">
                Compare, escolha e economize com os melhores planos de
                telecomunicações
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a href="/ecommerce/comparador">
                  <Button
                    size="lg"
                    className="bg-white text-[#6366F1] hover:bg-slate-100 font-semibold text-lg px-8 h-14 w-full sm:w-auto"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Compare Agora
                  </Button>
                </a>
                <a href="/ecommerce/planos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 h-14 w-full sm:w-auto"
                  >
                    Ver Todos os Planos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>

              {/* Stats rápidas */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">200+</div>
                  <div className="text-sm text-white/80">Planos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">50mil+</div>
                  <div className="text-sm text-white/80">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">4.8★</div>
                  <div className="text-sm text-white/80">Avaliação</div>
                </div>
              </div>
            </div>

            {/* Ilustração direita */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <div className="space-y-4">
                    {[
                      {
                        icon: Wifi,
                        text: "Internet Ultra Rápida",
                        color: "from-blue-400 to-cyan-400",
                      },
                      {
                        icon: Smartphone,
                        text: "Planos Móveis Ilimitados",
                        color: "from-purple-400 to-pink-400",
                      },
                      {
                        icon: TrendingUp,
                        text: "Melhor Custo-Benefício",
                        color: "from-green-400 to-emerald-400",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all"
                      >
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
                        >
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-semibold text-lg">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ COMPARADOR / SELETOR RÁPIDO */}
      <section
        id="comparador"
        className="bg-white py-12 border-y border-slate-200"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0 px-4 py-2">
              🎯 Encontre seu Plano
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Comparador Inteligente
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Responda 4 perguntas rápidas e veja os planos ideais para você
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <SeletorRapido categorias={categorias} />
          </div>
        </div>
      </section>

      {/* 4️⃣ PLANOS POPULARES / DESTAQUES */}
      <section className="container mx-auto px-4 py-16 bg-slate-50">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white border-0 px-4 py-2">
            ⭐ Mais Vendidos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Planos Populares
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Escolhidos por milhares de clientes satisfeitos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planosPopulares.map((plano) => (
            <Card
              key={plano.id}
              className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#6366F1] relative overflow-hidden"
            >
              {plano.destaque && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg">
                    🔥 Destaque
                  </Badge>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {plano.nome}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {plano.operadora === "V"
                      ? "VIVO"
                      : plano.operadora === "C"
                      ? "CLARO"
                      : "TIM"}
                  </p>
                </div>

                <div className="py-4 border-y border-slate-100">
                  <div className="text-4xl font-bold text-[#6366F1]">
                    {formatPrice(plano.preco)}
                    <span className="text-sm text-slate-500 font-normal">
                      /mês
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {plano.velocidade && (
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-[#6366F1]" />
                      <span className="font-semibold">{plano.velocidade}</span>
                    </div>
                  )}
                  {plano.franquia && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="w-4 h-4 text-[#6366F1]" />
                      <span className="font-semibold">{plano.franquia}</span>
                    </div>
                  )}
                  {plano.beneficios &&
                    plano.beneficios.slice(0, 3).map((beneficio, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{beneficio}</span>
                      </div>
                    ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] hover:shadow-lg group-hover:scale-105 transition-all"
                  onClick={() => addItem(plano, 1)}
                >
                  Contratar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="/ecommerce/planos">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white font-semibold"
            >
              Ver Todos os Planos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* 5️⃣ BENEFÍCIOS / DIFERENCIAIS */}
      <section id="beneficios" className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Por que escolher a TelePlanos?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Oferecemos a melhor experiência em contratação de planos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, i) => (
              <Card
                key={i}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white"
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <beneficio.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {beneficio.title}
                  </h3>
                  <p className="text-slate-600">{beneficio.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6️⃣ PROMOÇÕES / OFERTAS */}
      <section className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-2">
              🎁 Ofertas Especiais
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Ofertas do Mês
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Aproveite descontos exclusivos por tempo limitado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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
                className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all group"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-5xl font-bold">{oferta.desconto}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{oferta.titulo}</h3>
                    <p className="text-white/80">{oferta.desc}</p>
                  </div>
                  <Button className="w-full bg-white text-[#6366F1] hover:bg-slate-100 font-semibold group-hover:scale-105 transition-transform">
                    Saiba Mais
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8️⃣ FAQ / AJUDA RÁPIDA */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-slate-600">
              Tire suas dúvidas sobre nossos planos
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Card
                key={i}
                className="border-2 hover:border-[#6366F1] transition-colors"
              >
                <CardContent className="p-0">
                  <button
                    className="w-full p-6 flex items-center justify-between text-left"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <span className="font-semibold text-lg text-slate-900">
                      {item.pergunta}
                    </span>
                    {faqOpen === i ? (
                      <ChevronUp className="w-5 h-5 text-[#6366F1]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  {faqOpen === i && (
                    <div className="px-6 pb-6 text-slate-600">
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
      <section id="depoimentos" className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(dep.nota)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-slate-700 italic">"{dep.texto}"</p>
                  <div className="font-semibold text-slate-900">{dep.nome}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9️⃣ CTA FINAL / BANNER DE AÇÃO */}
      <section className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para escolher seu plano?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Compare planos, economize e contrate online em poucos minutos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/ecommerce/comparador">
              <Button
                size="lg"
                className="bg-white text-[#6366F1] hover:bg-slate-100 font-semibold text-lg px-10 h-16"
              >
                Comparar Planos Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="/ecommerce/planos">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 h-16"
              >
                Ver Todos os Planos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Entre em Contato
              </h2>
              <p className="text-lg text-slate-600">
                Estamos aqui para ajudar você
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center border-2 hover:border-[#6366F1] transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <h3 className="font-semibold text-lg">Telefone</h3>
                  <p className="text-slate-600">0800 123 4567</p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 hover:border-[#6366F1] transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-slate-600">contato@teleplanos.com</p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 hover:border-[#6366F1] transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <h3 className="font-semibold text-lg">Endereço</h3>
                  <p className="text-slate-600">São Paulo, SP</p>
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
