import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function CheckoutDados() {
  const [, setLocation] = useLocation();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    razaoSocial: "",
    cnpj: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "checkout-dados",
      JSON.stringify({ ...formData, tipoPessoa })
    );
    setLocation(`/ecommerce/checkout/endereco?tipo=${tipoPessoa}`);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2");
  };

  const voltar = () => {
    setLocation("/ecommerce/checkout");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Seus Dados</h1>
          <p className="text-slate-600">Etapa 2 de 5 • Dados Cadastrais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Informações de{" "}
              {tipoPessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tipoPessoa === "PF" ? (
                <>
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="documento">CPF</Label>
                    <Input
                      id="documento"
                      required
                      value={formData.documento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documento: formatCPF(e.target.value),
                        })
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input
                      id="razaoSocial"
                      required
                      value={formData.razaoSocial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          razaoSocial: e.target.value,
                        })
                      }
                      placeholder="Empresa LTDA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      required
                      value={formData.cnpj}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cnpj: formatCNPJ(e.target.value),
                        })
                      }
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contato@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  required
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefone: formatPhone(e.target.value),
                    })
                  }
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={voltar}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
