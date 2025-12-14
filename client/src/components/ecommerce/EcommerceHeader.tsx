import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/badge";

interface CustomerData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  client: {
    id: string;
    nome: string;
  } | null;
}

export function EcommerceHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCartStore();
  const itemCount = getItemCount();

  const { data: customerData } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
    staleTime: 30000, // Cache por 30 segundos
  });

  const navItems = [
    { label: "Planos", href: "/ecommerce/planos" },
    { label: "Comparador", href: "/ecommerce/comparador" },
    { label: "Benefícios", href: "/ecommerce#beneficios" },
    { label: "Depoimentos", href: "/ecommerce#depoimentos" },
    { label: "Contato", href: "/ecommerce#contato" },
  ];

  const loginUrl = customerData?.client
    ? "/ecommerce/painel"
    : "/ecommerce/login";

  return (
    <header
      className="sticky top-0 z-50 w-full shadow-sm"
      style={{
        borderBottom: "1px solid #E0E0E0",
        backgroundColor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/ecommerce">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{ borderRadius: "12px", backgroundColor: "#1E90FF" }}
                >
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-xl font-bold"
                  style={{ color: "#111111" }}
                >
                  TelePlanos
                </span>
                <span
                  className="text-[10px] -mt-1"
                  style={{ color: "#555555" }}
                >
                  Conecte-se melhor
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors cursor-pointer relative group ${
                  location === item.href ? "" : ""
                }`}
                style={{
                  color: location === item.href ? "#1E90FF" : "#555555",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1E90FF")}
                onMouseLeave={(e) => {
                  if (location !== item.href)
                    e.currentTarget.style.color = "#555555";
                }}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 transition-all group-hover:w-full ${
                    location === item.href ? "w-full" : "w-0"
                  }`}
                  style={{ backgroundColor: "#1E90FF" }}
                ></span>
              </a>
            ))}
          </nav>

          {/* CTA + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Carrinho Icon com Badge */}
            {itemCount > 0 && (
              <button
                onClick={openCart}
                className="relative p-2 transition-colors"
                style={{ color: "#555555" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1E90FF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
                aria-label="Abrir carrinho"
              >
                <ShoppingCart className="h-5 w-5" />
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-0"
                  style={{ backgroundColor: "#FF6B35", color: "#FFFFFF" }}
                >
                  {itemCount}
                </Badge>
              </button>
            )}

            {/* Login do Cliente - Desktop */}
            <a
              href={loginUrl}
              className="hidden sm:inline-flex items-center justify-center text-sm font-medium transition-all duration-300 h-10 px-4"
              style={{
                borderRadius: "12px",
                border: "1px solid #E0E0E0",
                backgroundColor: "#FFFFFF",
                color: "#555555",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#1E90FF";
                e.currentTarget.style.color = "#1E90FF";
                e.currentTarget.style.backgroundColor = "rgba(30,144,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0E0E0";
                e.currentTarget.style.color = "#555555";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              <User className="mr-2 h-4 w-4" />
              {customerData?.client ? "Meu Painel" : "Entrar"}
            </a>

            <a
              href="/ecommerce/checkout"
              className="hidden md:inline-flex items-center justify-center text-sm font-bold transition-all duration-300 h-10 px-6 shadow-lg"
              style={{
                borderRadius: "12px",
                backgroundColor: "#1E90FF",
                color: "#FFFFFF",
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
              <ShoppingCart className="mr-2 h-4 w-4" />
              Contrate Agora
            </a>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-slate-700 hover:text-[#6366F1] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-1 bg-white">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#6366F1] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="px-4 pt-4 space-y-2">
              <a
                href={loginUrl}
                className="flex items-center justify-center w-full rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-[#6366F1] transition-all h-10 px-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                {customerData?.client ? "Meu Painel" : "Entrar"}
              </a>
              <a
                href="/ecommerce/checkout"
                className="flex items-center justify-center w-full rounded-lg bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white hover:shadow-lg transition-all h-10 px-4 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Contratar Agora
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
