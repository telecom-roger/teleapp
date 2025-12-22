import { useLocation } from "wouter";
import {
  User,
  Building2,
  ArrowRight,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export default function CheckoutTipoCliente() {
  const [, setLocation] = useLocation();
  const { items } = useCartStore();

  const escolherTipo = (tipo: "PF" | "PJ") => {
    setLocation(`/app/checkout/dados?tipo=${tipo}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EcommerceHeader />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              Tipo de Cliente
            </h1>
            <p className="text-lg text-gray-600">
              Etapa 1 de 5 • Escolha o tipo de contratação
            </p>
          </div>

          {/* Alert se carrinho vazio */}
          {(!items || items.length === 0) && (
            <div className="mb-6 p-6 flex items-start gap-4 rounded-2xl bg-orange-50 border-2 border-orange-500">
              <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-orange-500" />
              <div>
                <p className="font-semibold mb-1 text-gray-900">
                  Seu carrinho está vazio
                </p>
                <p className="text-gray-600">
                  <a
                    href="/app/planos"
                    className="underline font-semibold hover:opacity-80"
                  >
                    Escolha um plano primeiro
                  </a>{" "}
                  para continuar com a contratação.
                </p>
              </div>
            </div>
          )}

          {/* Resumo do carrinho */}
          {items && items.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {items.length} {items.length === 1 ? "Plano selecionado" : "Planos selecionados"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {items.map((item) => item.product.nome).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cards de escolha */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* PF */}
            <button
              onClick={() => escolherTipo("PF")}
              className="p-8 text-center transition-all duration-300 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-1"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">
                Pessoa Física
              </h2>
              <p className="mb-6 text-base text-gray-600">
                Para uso pessoal e residencial
              </p>
              <div className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white flex items-center justify-center gap-2 transition-colors">
                Continuar como PF
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>

            {/* PJ */}
            <button
              onClick={() => escolherTipo("PJ")}
              className="p-8 text-center transition-all duration-300 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-1"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">
                Pessoa Jurídica
              </h2>
              <p className="mb-6 text-base text-gray-600">
                Para empresas e corporações
              </p>
              <div className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white flex items-center justify-center gap-2 transition-colors">
                Continuar como PJ
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </div>

          {/* Login para clientes existentes */}
          <div className="text-center">
            <p className="text-sm mb-4 text-gray-600">
              Já é nosso cliente?
            </p>
            <a
              href="/app/login?returnTo=checkout"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl font-semibold transition-colors gap-2 bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600"
            >
              <User className="h-4 w-4" />
              Fazer Login
            </a>
          </div>
        </div>
      </div>

      <EcommerceFooter />
    </div>
  );
}
