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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <EcommerceHeader />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className="text-4xl font-bold mb-3"
              style={{ color: "#111111" }}
            >
              Seus Dados
            </h1>
            <p className="text-lg" style={{ color: "#555555" }}>
              Etapa 2 de 5 • Dados Cadastrais
            </p>
          </div>

          {/* Card do Formulário */}
          <div
            className="p-8"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Título com ícone */}
            <div
              className="flex items-center gap-3 mb-6 pb-6"
              style={{ borderBottom: "2px solid #F0F0F0" }}
            >
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: "rgba(30,144,255,0.1)" }}
              >
                {tipoPessoa === "PF" ? (
                  <User className="h-6 w-6" style={{ color: "#1E90FF" }} />
                ) : (
                  <Building2 className="h-6 w-6" style={{ color: "#1E90FF" }} />
                )}
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#111111" }}>
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
                      className="text-sm font-bold mb-2 block"
                      style={{ color: "#111111" }}
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
                      className="h-12 px-4 font-semibold"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E0E0E0",
                        backgroundColor: "#FFFFFF",
                        color: "#111111",
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="documento"
                      className="text-sm font-bold mb-2 block"
                      style={{ color: "#111111" }}
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
                      className="h-12 px-4 font-semibold"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E0E0E0",
                        backgroundColor: "#FFFFFF",
                        color: "#111111",
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label
                      htmlFor="razaoSocial"
                      className="text-sm font-bold mb-2 block"
                      style={{ color: "#111111" }}
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
                      className="h-12 px-4 font-semibold"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E0E0E0",
                        backgroundColor: "#FFFFFF",
                        color: "#111111",
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="cnpj"
                      className="text-sm font-bold mb-2 block"
                      style={{ color: "#111111" }}
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
                      className="h-12 px-4 font-semibold"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E0E0E0",
                        backgroundColor: "#FFFFFF",
                        color: "#111111",
                      }}
                    />
                  </div>
                </>
              )}

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-bold mb-2 block"
                  style={{ color: "#111111" }}
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
                  className="h-12 px-4 font-semibold"
                  style={{
                    borderRadius: "12px",
                    border: "2px solid #E0E0E0",
                    backgroundColor: "#FFFFFF",
                    color: "#111111",
                  }}
                />
              </div>

              <div>
                <Label
                  htmlFor="telefone"
                  className="text-sm font-bold mb-2 block"
                  style={{ color: "#111111" }}
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
                  className="h-12 px-4 font-semibold"
                  style={{
                    borderRadius: "12px",
                    border: "2px solid #E0E0E0",
                    backgroundColor: "#FFFFFF",
                    color: "#111111",
                  }}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={voltar}
                  className="flex-1 h-14 px-6 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #E0E0E0",
                    color: "#555555",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1E90FF";
                    e.currentTarget.style.color = "#1E90FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E0E0E0";
                    e.currentTarget.style.color = "#555555";
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-14 px-6 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "#1E90FF",
                    color: "#FFFFFF",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1570D6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1E90FF";
                  }}
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
