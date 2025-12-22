import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Validar se é email
  const isEmail = (value: string) => {
    return value.includes("@") || /[a-zA-Z]/.test(value);
  };

  // Auto-format CPF/CNPJ
  const formatDocument = (value: string) => {
    const cleaned = value.replace(/\D/g, "");

    // Limitar a 14 dígitos (CNPJ)
    const limited = cleaned.substring(0, 14);

    if (limited.length <= 11) {
      // CPF: 123.456.789-10
      return limited
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ: 12.345.678/0001-90
      return limited
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Se contém @ ou letras, é email - não formata
    if (isEmail(value)) {
      setIdentifier(value);
    } else {
      // É CPF/CNPJ - formata e limita
      setIdentifier(formatDocument(value));
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { identifier: string; password: string }) => {
      const res = await fetch("/api/app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao fazer login");
      }

      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao seu painel",
      });

      // Invalidar TODAS as queries de autenticação
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/app/auth/customer"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/app/customer/orders"],
      });

      // Forçar refetch imediato da autenticação
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });

      // Verificar se veio do checkout (via query param ou referrer)
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");

      // Se veio do checkout, voltar para o resumo do checkout
      if (
        returnTo === "checkout" ||
        document.referrer.includes("/app/checkout")
      ) {
        setTimeout(() => {
          setLocation("/app/checkout");
        }, 200);
      } else {
        // Caso contrário, ir para o painel
        setTimeout(() => {
          setLocation("/app/painel");
        }, 200);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha CPF/CNPJ/Email e senha",
        variant: "destructive",
      });
      return;
    }

    // Validar email se for email
    if (isEmail(identifier)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        toast({
          title: "Email inválido",
          description: "Por favor, digite um email válido",
          variant: "destructive",
        });
        return;
      }
    }

    loginMutation.mutate({ identifier, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <Card className="w-full max-w-md rounded-2xl border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            Portal do Cliente
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse seu painel para acompanhar pedidos e serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="font-bold text-gray-900">CPF / CNPJ / Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Digite seu CPF, CNPJ ou email"
                value={identifier}
                onChange={handleIdentifierChange}
                disabled={loginMutation.isPending}
                autoComplete="username"
                className="!h-12 !rounded-xl !border-gray-300 focus:!border-blue-500 focus:!ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-gray-900">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                autoComplete="current-password"
                className="!h-12 !rounded-xl !border-gray-300 focus:!border-blue-500 focus:!ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Painel"
              )}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Esqueceu sua senha?{" "}
                <a
                  href="mailto:suporte@telecom.com?subject=Recuperar Senha"
                  className="text-primary hover:underline"
                >
                  Entre em contato
                </a>
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Primeira vez? Você receberá suas credenciais por email após
                  realizar seu primeiro pedido.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
