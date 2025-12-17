import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, User, Building2 } from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

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
    setLocation("/ecommerce/checkout/tipo-cliente");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EcommerceHeader />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              Seus Dados
            </h1>
            <p className="text-lg text-gray-600">
              Etapa 2 de 5 • Dados Cadastrais
            </p>
          </div>

          {/* Card do Formulário */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            {/* Título com ícone */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                {tipoPessoa === "PF" ? (
                  <User className="h-6 w-6 text-blue-600" />
                ) : (
                  <Building2 className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Informações de{" "}
                {tipoPessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {tipoPessoa === "PF" ? (
                <>
                  <div>
                    <Label
                      htmlFor="nome"
                      className="text-sm font-bold mb-2 block text-gray-900"
                    >
                      Nome Completo
                    </Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="João Silva"
                      className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="documento"
                      className="text-sm font-bold mb-2 block text-gray-900"
                    >
                      CPF
                    </Label>
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
                      className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label
                      htmlFor="razaoSocial"
                      className="text-sm font-bold mb-2 block text-gray-900"
                    >
                      Razão Social
                    </Label>
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
                      className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="cnpj"
                      className="text-sm font-bold mb-2 block text-gray-900"
                    >
                      CNPJ
                    </Label>
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
                      className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-bold mb-2 block text-gray-900"
                >
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contato@exemplo.com"
                  className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="telefone"
                  className="text-sm font-bold mb-2 block text-gray-900"
                >
                  Telefone
                </Label>
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
                  className="h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={voltar}
                  className="flex-1 h-12 px-6 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 px-6 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <EcommerceFooter />
    </div>
  );
}
