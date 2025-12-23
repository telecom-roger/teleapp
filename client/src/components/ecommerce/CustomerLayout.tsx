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
    queryKey: ["/api/app/auth/customer"],
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/app/auth/logout", { method: "POST" });
      // Invalidar TODAS as queries para limpar o cache
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      setLocation("/app");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      queryClient.clear();
      setLocation("/app");
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/app/painel">
              <a className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Portal do Cliente
              </a>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Olá,{" "}
              <span className="font-semibold text-gray-900">
                {data?.client?.nome || data?.user?.email}
              </span>
            </span>
            <CustomerOrderNotifications />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 bg-blue-50 rounded-lg mx-2">
                <span className="text-xs text-gray-600">Logado como</span>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {data?.client?.nome || data?.user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="justify-start mx-2 hover:bg-red-50 hover:text-red-600 transition-colors"
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

  // Buscar pedidos do cliente para verificar se tem portabilidade
  const { data } = useQuery<{ orders: any[] }>({
    queryKey: ["/api/app/customer/orders"],
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      console.log('\n🏠 [SIDEBAR] Pedidos recebidos para menu:');
      console.log('   Total:', data?.orders?.length || 0);
      const temPort = data?.orders?.some(order => order.tipoContratacao === "portabilidade") || false;
      console.log(`   📍 Menu de Portabilidade deve aparecer? ${temPort ? "SIM ✅" : "NÃO ❌"}`);
      if (!temPort) {
        console.log('   🔍 Tipos de contratação encontrados:');
        data?.orders?.forEach(o => {
          console.log(`      - ${o.orderCode}: "${o.tipoContratacao}"`);
        });
      }
    }
  });

  const orders = data?.orders || [];

  // Verificar se existe qualquer pedido de portabilidade (qualquer etapa)
  const temPortabilidade = orders.some(
    (order) => order.tipoContratacao === "portabilidade"
  );

  const menuItems = [
    { href: "/app/painel", icon: Home, label: "Dashboard" },
    {
      href: "/app/painel/pedidos",
      icon: ShoppingBag,
      label: "Meus Pedidos",
    },
    {
      href: "/app/painel/documentos",
      icon: FileText,
      label: "Documentos",
    },
    { href: "/app/painel/perfil", icon: User, label: "Meu Perfil" },
    {
      href: "https://wa.me/5519999999999",
      icon: MessageCircle,
      label: "Suporte WhatsApp",
      external: true,
    },
  ];

  // Inserir item de portabilidade após "Meus Pedidos" se tiver portabilidade
  if (temPortabilidade) {
    menuItems.splice(2, 0, {
      href: "/app/painel/linhas-portabilidade",
      icon: Phone,
      label: "Linhas de Portabilidade",
    });
  }

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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

  // Buscar pedidos do cliente para verificar se tem portabilidade
  const { data } = useQuery<{ orders: any[] }>({
    queryKey: ["/api/app/customer/orders"],
  });

  const orders = data?.orders || [];

  // Verificar se existe qualquer pedido de portabilidade (qualquer etapa)
  const temPortabilidade = orders.some(
    (order) => order.tipoContratacao === "portabilidade"
  );

  const menuItems = [
    { href: "/app/painel", icon: Home, label: "Início" },
    { href: "/app/painel/pedidos", icon: ShoppingBag, label: "Pedidos" },
    { href: "/app/painel/documentos", icon: FileText, label: "Docs" },
    { href: "/app/painel/perfil", icon: User, label: "Perfil" },
  ];

  // Inserir item de portabilidade após "Pedidos" se tiver portabilidade
  if (temPortabilidade) {
    menuItems.splice(2, 0, {
      href: "/app/painel/linhas-portabilidade",
      icon: Phone,
      label: "Linhas",
    });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold transition-all rounded-lg",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
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
