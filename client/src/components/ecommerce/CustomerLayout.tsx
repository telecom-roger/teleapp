import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingBag,
  FileText,
  User,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CustomerOrderNotifications } from "./CustomerOrderNotifications";
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
    cnpj?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  } | null;
}

export function CustomerHeader() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/ecommerce/auth/logout", { method: "POST" });
      // Invalidar TODAS as queries para limpar o cache
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      setLocation("/ecommerce");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      queryClient.clear();
      setLocation("/ecommerce");
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/ecommerce/painel">
              <a className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Portal do Cliente
              </a>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá,{" "}
              <span className="font-medium text-foreground">
                {data?.client?.nome || data?.user?.email}
              </span>
            </span>
            <CustomerOrderNotifications />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground px-3 py-2">
                {data?.client?.nome || data?.user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function CustomerSidebar() {
  const [location] = useLocation();

  // Buscar pedidos do cliente para verificar se tem portabilidade ativa
  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/customer/orders"],
  });

  // Verificar se existe pedido de portabilidade aguardando dados de linhas
  const temPortabilidadeAtiva = orders?.some(
    (order) =>
      order.tipoContratacao === "portabilidade" &&
      order.etapa === "aguardando_dados_linhas"
  );

  const menuItems = [
    { href: "/ecommerce/painel", icon: Home, label: "Dashboard" },
    {
      href: "/ecommerce/painel/pedidos",
      icon: ShoppingBag,
      label: "Meus Pedidos",
    },
    {
      href: "/ecommerce/painel/documentos",
      icon: FileText,
      label: "Documentos",
    },
    { href: "/ecommerce/painel/perfil", icon: User, label: "Meu Perfil" },
    {
      href: "https://wa.me/5519999999999",
      icon: MessageCircle,
      label: "Suporte WhatsApp",
      external: true,
    },
  ];

  // Inserir item de portabilidade após "Meus Pedidos" se tiver portabilidade ativa
  if (temPortabilidadeAtiva) {
    menuItems.splice(2, 0, {
      href: "/ecommerce/painel/linhas-portabilidade",
      icon: Phone,
      label: "Linhas de Portabilidade",
    });
  }

  return (
    <aside className="hidden md:block w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function CustomerMobileNav() {
  const [location] = useLocation();

  // Buscar pedidos do cliente para verificar se tem portabilidade ativa
  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/customer/orders"],
  });

  // Verificar se existe pedido de portabilidade aguardando dados de linhas
  const temPortabilidadeAtiva = orders?.some(
    (order) =>
      order.tipoContratacao === "portabilidade" &&
      order.etapa === "aguardando_dados_linhas"
  );

  const menuItems = [
    { href: "/ecommerce/painel", icon: Home, label: "Início" },
    { href: "/ecommerce/painel/pedidos", icon: ShoppingBag, label: "Pedidos" },
    { href: "/ecommerce/painel/documentos", icon: FileText, label: "Docs" },
    { href: "/ecommerce/painel/perfil", icon: User, label: "Perfil" },
  ];

  // Inserir item de portabilidade após "Pedidos" se tiver portabilidade ativa
  if (temPortabilidadeAtiva) {
    menuItems.splice(2, 0, {
      href: "/ecommerce/painel/linhas-portabilidade",
      icon: Phone,
      label: "Linhas",
    });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
