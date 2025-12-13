import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CustomerHeader,
  CustomerSidebar,
  CustomerMobileNav,
} from "@/components/ecommerce/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, User, Key, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

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
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  } | null;
}

export default function CustomerProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editMode, setEditMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    data: customerData,
    isLoading,
    refetch,
    isError,
  } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });

  // Proteção de rota
  useEffect(() => {
    if (!isLoading && (isError || !customerData?.client)) {
      setLocation("/ecommerce");
    }
  }, [isLoading, isError, customerData, setLocation]);

  const [formData, setFormData] = useState({
    telefone: customerData?.client?.telefone || "",
    email: customerData?.client?.email || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { telefone: string; email: string }) => {
      const res = await fetch("/api/ecommerce/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar perfil");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setEditMode(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch("/api/ecommerce/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao alterar senha");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      <div className="flex">
        <CustomerSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>

            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Mantenha seus dados atualizados para melhor atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="nome"
                            value={customerData?.client?.nome || ""}
                            disabled
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document">
                          {customerData?.client?.cnpj ? "CNPJ" : "CPF"}
                        </Label>
                        <Input
                          id="document"
                          value={
                            customerData?.client?.cnpj ||
                            customerData?.client?.cpf ||
                            ""
                          }
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={
                              editMode
                                ? formData.email
                                : customerData?.client?.email || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            disabled={!editMode}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="telefone"
                            type="tel"
                            value={
                              editMode
                                ? formData.telefone
                                : customerData?.client?.telefone || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                telefone: e.target.value,
                              })
                            }
                            disabled={!editMode}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {customerData?.client?.endereco && (
                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="endereco">Endereço</Label>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                          <div className="flex-1 space-y-2">
                            <Input
                              id="endereco"
                              value={customerData?.client?.endereco || ""}
                              disabled
                            />
                            <div className="grid gap-2 sm:grid-cols-3">
                              <Input
                                value={customerData?.client?.cidade || ""}
                                placeholder="Cidade"
                                disabled
                              />
                              <Input
                                value={customerData?.client?.estado || ""}
                                placeholder="Estado"
                                disabled
                              />
                              <Input
                                value={customerData?.client?.cep || ""}
                                placeholder="CEP"
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Para alterar o endereço, entre em contato com nosso
                          suporte
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      {editMode ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditMode(false)}
                            disabled={updateProfileMutation.isPending}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar Alterações"
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button type="button" onClick={() => setEditMode(true)}>
                          Editar Informações
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Altere sua senha regularmente para manter sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={changePasswordMutation.isPending}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changePasswordMutation.isPending}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changePasswordMutation.isPending}
                      placeholder="Digite novamente"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        "Alterar Senha"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CustomerMobileNav />
    </div>
  );
}
