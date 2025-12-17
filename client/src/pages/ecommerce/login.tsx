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
  // Premium layout styles applied - v2024.12.17
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EcommerceHeader />

      <main className="flex-1 container max-w-md mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Área do Cliente
            </h1>
            <p className="text-gray-600">
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
              <Label htmlFor="identifier" className="text-sm font-bold text-gray-900">CPF, CNPJ ou E-mail</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Digite seu CPF, CNPJ ou e-mail"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  className="!h-12 pl-12 pr-4 !rounded-xl !border-gray-300 focus:!border-blue-500"
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-gray-500">
                Você pode usar CPF (11 dígitos), CNPJ (14 dígitos) ou seu e-mail
                cadastrado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-gray-900">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!h-12 pl-12 pr-12 !rounded-xl !border-gray-300 focus:!border-blue-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                onClick={() =>
                  alert("Em breve: recuperação de senha por email")
                }
              >
                Esqueci minha senha
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              Ainda não tem conta?{" "}
              <button
                onClick={() => navigate("/ecommerce/planos")}
                className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
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
