import { useState } from "react";
import { Link } from "wouter";
import { 
  Wifi, Smartphone, Tv, Building2, Phone, CheckCircle2, 
  Shield, Clock, UserCheck, ArrowRight, Zap, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { CartSidebar } from "@/components/ecommerce/CartSidebar";
import SeletorRapido from "@/components/ecommerce/SeletorRapido";
import CardInteligente from "@/components/ecommerce/CardInteligente";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { obterTopRecomendacoes } from "@/lib/recomendacao";
import type { EcommerceCategory, EcommerceProduct } from "@shared/schema";

export default function EcommerceHome() {
  const { data: categorias = [] } = useQuery<EcommerceCategory[]>({
    queryKey: ["/api/app/public/categories"],
  });

  const { data: produtos = [] } = useQuery<EcommerceProduct[]>({
    queryKey: ["/api/app/public/products"],
  });

  const { addItem } = useCartStore();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");

  // Produtos recomendados baseado no tipo de pessoa selecionado
  const produtosRecomendados = obterTopRecomendacoes(produtos, {
    tipoPessoa,
    modalidade: null,
    categoria: null,
    operadora: null,
  });

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <EcommerceHeader />
      
      {/* Hero Section - Compacto */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-[#FAFAFA] pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-[#111111] leading-tight">
              Encontre o plano perfeito em menos de 1 minuto
            </h1>
            <p className="text-base md:text-lg text-[#555555] mb-6 max-w-2xl mx-auto">
              Responda 4 perguntas rápidas e veja planos personalizados para você
            </p>
          </div>
        </div>
      </section>

      {/* Seletor Rápido - PRIORIDADE MOBILE (Topo) */}
      <section className="bg-white py-8 border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <SeletorRapido categorias={categorias} />
          </div>
        </div>
      </section>

      {/* Produtos Recomendados Inteligentes */}
      {produtosRecomendados.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-[#FAFAFA]">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white border-0 shadow-md px-4 py-2 text-sm font-semibold">
              🔥 Recomendados para você
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-[#111111] mb-3">
              Planos selecionados {tipoPessoa === "PF" ? "para você" : "para sua empresa"}
            </h2>
            <p className="text-[#555555] max-w-2xl mx-auto text-sm md:text-base">
              Baseado em inteligência artificial e dados reais de mercado
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {produtosRecomendados.map((produto, index) => (
              <CardInteligente
                key={produto.id}
                produto={produto}
                onAddToCart={handleAddToCart}
                isRecomendado={true}
                posicao={index}
              />
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" className="border-2 hover:bg-slate-50" asChild>
              <Link href="/app/planos">
                Ver todos os planos disponíveis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Atalhos Rápidos - Simplificado */}
      <section className="container mx-auto px-4 py-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/app/planos">
              <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-200 hover:border-[#8A4FFF] bg-[#F5F5F5]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-white mx-auto mb-3 flex items-center justify-center group-hover:bg-[#8A4FFF] transition-all shadow-sm">
                    <Search className="h-7 w-7 text-[#8A4FFF] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[#222222]">
                    Ver Planos
                  </h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/planos">
              <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-200 hover:border-[#8A4FFF] bg-[#F5F5F5]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-white mx-auto mb-3 flex items-center justify-center group-hover:bg-[#8A4FFF] transition-all shadow-sm">
                    <Zap className="h-7 w-7 text-[#8A4FFF] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[#222222]">
                    Comparar
                  </h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/fibra">
              <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-200 hover:border-[#1AD1C1] bg-[#F5F5F5]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-white mx-auto mb-3 flex items-center justify-center group-hover:bg-[#1AD1C1] transition-all shadow-sm">
                    <Wifi className="h-7 w-7 text-[#1AD1C1] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[#222222]">
                    Fibra
                  </h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/movel">
              <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-200 hover:border-[#007BFF] bg-[#F5F5F5]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-white mx-auto mb-3 flex items-center justify-center group-hover:bg-[#007BFF] transition-all shadow-sm">
                    <Smartphone className="h-7 w-7 text-[#007BFF] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[#222222]">
                    Móvel
                  </h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Por que usar nossa plataforma */}
      <section className="bg-[#FAFAFA] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#111111]">
            Por que usar nossa plataforma?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: CheckCircle2,
                titulo: "Compare várias operadoras",
                descricao: "Tudo em um só lugar",
              },
              {
                icon: Zap,
                titulo: "Contrate 100% online",
                descricao: "Rápido e sem burocracia",
              },
              {
                icon: UserCheck,
                titulo: "Atendimento humano",
                descricao: "Quando você precisar",
              },
              {
                icon: Shield,
                titulo: "Acompanhe tudo",
                descricao: "Pelo painel do cliente",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-white shadow-md mx-auto mb-4 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1 text-slate-900">
                  {item.titulo}
                </h3>
                <p className="text-sm text-slate-600">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona - 3 passos */}
      <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1a2332] text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                numero: "1",
                titulo: "Compare os planos",
                descricao: "Veja todas as opções disponíveis lado a lado",
              },
              {
                numero: "2",
                titulo: "Escolha o melhor",
                descricao: "Selecione o plano ideal para seu perfil",
              },
              {
                numero: "3",
                titulo: "Contrate online",
                descricao: "Finalize tudo online e acompanhe pelo painel",
              },
            ].map((passo) => (
              <div key={passo.numero} className="text-center">
                <div className="w-16 h-16 rounded-full bg-white text-slate-900 font-bold text-2xl mx-auto mb-4 flex items-center justify-center">
                  {passo.numero}
                </div>
                <h3 className="font-bold text-xl mb-2">
                  {passo.titulo}
                </h3>
                <p className="text-white/80">
                  {passo.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confiança & Segurança */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Contratação segura</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Dados protegidos</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span>Transparência total</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span>Sem custo oculto</span>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-[#007BFF] to-[#0056b3] rounded-3xl p-12 md:p-16 text-center text-white max-w-4xl mx-auto shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para contratar seu plano ideal?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Compare operadoras e encontre o melhor custo-benefício
          </p>
          <Button
            size="lg"
            className="bg-white text-[#007BFF] hover:bg-slate-100 text-lg px-10 h-14 font-semibold shadow-lg transition-all duration-300"
            asChild
          >
            <Link href="/app/planos">
              Comparar planos agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
      
      <EcommerceFooter />
      
      {/* Carrinho Sidebar */}
      <CartSidebar />

      {/* Mobile: Barra fixa inferior */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50">
        <Button className="w-full h-12 bg-[#007BFF] hover:bg-[#0056b3] text-white font-semibold transition-all duration-300" size="lg" asChild>
          <Link href="/app/planos">
            Ver planos recomendados
          </Link>
        </Button>
      </div>
    </div>
  );
}
