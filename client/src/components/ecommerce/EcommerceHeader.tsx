import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

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
  
  const loginUrl = customerData?.client ? "/ecommerce/painel" : "/ecommerce/login";
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/ecommerce">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-[#6366F1] to-[#A855F7] bg-clip-text text-transparent">
                  TelePlanos
                </span>
                <span className="text-[10px] text-slate-500 -mt-1">Conecte-se melhor</span>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-[#6366F1] cursor-pointer relative group ${
                  location === item.href
                    ? "text-[#6366F1]"
                    : "text-slate-700"
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#A855F7] transition-all group-hover:w-full ${
                  location === item.href ? "w-full" : ""
                }`}></span>
              </a>
            ))}
          </nav>
          
          {/* CTA + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Login do Cliente - Desktop */}
            <a 
              href={loginUrl}
              className="hidden sm:inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-[#6366F1] hover:text-[#6366F1] h-10 px-4"
            >
              <User className="mr-2 h-4 w-4" />
              {customerData?.client ? "Meu Painel" : "Entrar"}
            </a>
            
            <a
              href="/ecommerce/checkout"
              className="hidden md:inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white hover:shadow-lg hover:scale-105 h-10 px-6"
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
