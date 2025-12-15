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
    setLocation(`/ecommerce/checkout/dados?tipo=${tipo}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <EcommerceHeader />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className="text-4xl font-bold mb-3"
              style={{ color: "#111111" }}
            >
              Tipo de Cliente
            </h1>
            <p className="text-lg" style={{ color: "#555555" }}>
              Etapa 1 de 5 • Escolha o tipo de contratação
            </p>
          </div>

          {/* Alert se carrinho vazio - Layout Moderno */}
          {(!items || items.length === 0) && (
            <div
              className="mb-8 p-8 text-center"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
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
              <h3 className="text-2xl font-black mb-2" style={{ color: "#111111" }}>
                Escolha seu próximo plano
              </h3>
              <p className="text-lg mb-6" style={{ color: "#555555" }}>
                Adicione planos à sua seleção para avançar na contratação
              </p>
              <a href="/ecommerce/planos">
                <button
                  className="px-8 py-3 font-bold text-base transition-all duration-300"
                  style={{
                    backgroundColor: "#1E90FF",
                    color: "#FFFFFF",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#00CFFF";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1E90FF";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Ver Planos Disponíveis
                </button>
              </a>
            </div>
          )}

          {/* Resumo do carrinho */}
          {items && items.length > 0 && (
            <div
              className="mb-8 p-6"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E0E0E0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "rgba(30,144,255,0.1)" }}
                >
                  <ShoppingCart
                    className="h-6 w-6"
                    style={{ color: "#1E90FF" }}
                  />
                </div>
                <div>
                  <p className="font-bold text-lg" style={{ color: "#111111" }}>
                    {items.length} {items.length === 1 ? "plano" : "planos"} no
                    carrinho
                  </p>
                  <p className="text-sm" style={{ color: "#555555" }}>
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
              className="p-8 text-center transition-all duration-300"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "2px solid #E0E0E0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#1E90FF";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,144,255,0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0E0E0";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(30,144,255,0.1)" }}
              >
                <User className="h-10 w-10" style={{ color: "#1E90FF" }} />
              </div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ color: "#111111" }}
              >
                Pessoa Física
              </h2>
              <p className="mb-6 text-base" style={{ color: "#555555" }}>
                Para uso pessoal e residencial
              </p>
              <div
                className="w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: "#1E90FF", color: "#FFFFFF" }}
              >
                Continuar como PF
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>

            {/* PJ */}
            <button
              onClick={() => escolherTipo("PJ")}
              className="p-8 text-center transition-all duration-300"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "2px solid #E0E0E0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#1E90FF";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,144,255,0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0E0E0";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(30,144,255,0.1)" }}
              >
                <Building2 className="h-10 w-10" style={{ color: "#1E90FF" }} />
              </div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ color: "#111111" }}
              >
                Pessoa Jurídica
              </h2>
              <p className="mb-6 text-base" style={{ color: "#555555" }}>
                Para empresas e corporações
              </p>
              <div
                className="w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: "#1E90FF", color: "#FFFFFF" }}
              >
                Continuar como PJ
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </div>

          {/* Login para clientes existentes */}
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: "#555555" }}>
              Já é nosso cliente?
            </p>
            <a
              href="/ecommerce/login?returnTo=checkout"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold transition-all gap-2"
              style={{
                backgroundColor: "#FFFFFF",
                border: "2px solid #E0E0E0",
                color: "#555555",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#1E90FF";
                e.currentTarget.style.color = "#1E90FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0E0E0";
                e.currentTarget.style.color = "#555555";
              }}
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
