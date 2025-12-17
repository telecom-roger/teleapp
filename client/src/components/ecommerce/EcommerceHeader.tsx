import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <header className="sticky top-0 z-50 w-full shadow-sm bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/ecommerce">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">
                  TelePlanos
                </span>
                <span className="text-[10px] -mt-1 text-gray-600">
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
                className={cn(
                  "text-sm font-medium transition-colors cursor-pointer relative group",
                  location === item.href ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all group-hover:w-full",
                    location === item.href ? "w-full" : "w-0"
                  )}
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
                className="relative p-2 transition-colors text-gray-600 hover:text-blue-600"
                aria-label="Abrir carrinho"
              >
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full border-0 bg-orange-500 text-white">
                  {itemCount}
                </Badge>
              </button>
            )}

            {/* Login do Cliente - Desktop */}
            <a
              href={loginUrl}
              className="hidden sm:inline-flex items-center justify-center text-sm font-medium transition-all h-10 px-4 rounded-xl border border-gray-300 bg-white text-gray-600 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <User className="mr-2 h-4 w-4" />
              {customerData?.client ? "Meu Painel" : "Entrar"}
            </a>

            <a
              href="/ecommerce/planos"
              className="hidden md:inline-flex items-center justify-center text-sm font-semibold transition-all h-10 px-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Contrate Agora
            </a>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-2 bg-white">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-3 px-4 mx-2 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="px-4 pt-2 space-y-2">
              <a
                href={loginUrl}
                className="flex items-center justify-center w-full rounded-xl border-2 border-gray-300 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 transition-all h-11 px-4 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                {customerData?.client ? "Meu Painel" : "Entrar"}
              </a>
              <a
                href="/ecommerce/planos"
                className="flex items-center justify-center w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition-all h-11 px-4 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Contrate Agora
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
