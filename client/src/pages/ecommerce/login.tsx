import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShoppingBag, Lock, User } from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export default function EcommerceLogin() {
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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
      const res = await fetch("/api/ecommerce/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao fazer login");
      }

      return res.json();
    },
    onSuccess: async () => {
      // Invalidar TODAS as queries de autenticação
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/ecommerce/auth/customer"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/ecommerce/customer/orders"],
      });

      // Forçar refetch imediato da autenticação
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });

      // Redirecionar após garantir que a autenticação foi recarregada
      setTimeout(() => {
        navigate("/ecommerce/painel");
      }, 200);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Preencha todos os campos");
      return;
    }

    // Validar email se for email
    if (isEmail(identifier)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setError("Email inválido");
        return;
      }
    }

    loginMutation.mutate({ identifier, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <EcommerceHeader />

      <main className="flex-1 container max-w-md mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full p-8 shadow-xl border-2">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Área do Cliente</h1>
            <p className="text-muted-foreground">
              Acompanhe seus pedidos e gerencie sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">CPF, CNPJ ou E-mail</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Digite seu CPF, CNPJ ou e-mail"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Você pode usar CPF (11 dígitos), CNPJ (14 dígitos) ou seu e-mail
                cadastrado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() =>
                  alert("Em breve: recuperação de senha por email")
                }
              >
                Esqueci minha senha
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>
              Ainda não tem conta?{" "}
              <button
                onClick={() => navigate("/ecommerce/planos")}
                className="text-primary hover:underline font-medium"
              >
                Contrate agora
              </button>
            </p>
          </div>
        </Card>
      </main>

      <EcommerceFooter />
    </div>
  );
}
