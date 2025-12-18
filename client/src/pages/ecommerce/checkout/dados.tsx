import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, User, Building2, AlertCircle } from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { DocumentoDuplicadoModal } from "@/components/ecommerce/DocumentoDuplicadoModal";
import { useToast } from "@/hooks/use-toast";
import { validarCPF, validarCNPJ, validarTelefone, formatarCPF, formatarCNPJ, formatarTelefone } from "@/lib/validators";

export default function CheckoutDados() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [modalDuplicado, setModalDuplicado] = useState(false);
  const [verificandoDocumento, setVerificandoDocumento] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    razaoSocial: "",
    cnpj: "",
  });
  const [erros, setErros] = useState({
    documento: "",
    cnpj: "",
    telefone: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);
  }, []);

  const validarDocumentoCompleto = (doc: string, tipo: "PF" | "PJ"): boolean => {
    const limpo = doc.replace(/\D/g, "");
    
    if (tipo === "PF") {
      if (limpo.length !== 11) {
        setErros(prev => ({ ...prev, documento: "CPF deve ter 11 dígitos" }));
        return false;
      }
      if (!validarCPF(limpo)) {
        setErros(prev => ({ ...prev, documento: "CPF inválido" }));
        return false;
      }
      setErros(prev => ({ ...prev, documento: "" }));
      return true;
    } else {
      if (limpo.length !== 14) {
        setErros(prev => ({ ...prev, cnpj: "CNPJ deve ter 14 dígitos" }));
        return false;
      }
      if (!validarCNPJ(limpo)) {
        setErros(prev => ({ ...prev, cnpj: "CNPJ inválido" }));
        return false;
      }
      setErros(prev => ({ ...prev, cnpj: "" }));
      return true;
    }
  };

  const verificarDocumentoDuplicado = async (doc: string, tipo: "PF" | "PJ"): Promise<boolean> => {
    try {
      const response = await fetch("/api/ecommerce/check-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documento: doc,
          tipoPessoa: tipo,
        }),
      });

      const data = await response.json();
      
      if (!data.valido) {
        toast({
          title: "Documento inválido",
          description: data.error || "Verifique o documento informado",
          variant: "destructive",
        });
        return false;
      }

      if (data.existe) {
        setModalDuplicado(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao verificar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o documento. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar documento
    const documento = tipoPessoa === "PF" ? formData.documento : formData.cnpj;
    if (!validarDocumentoCompleto(documento, tipoPessoa)) {
      return;
    }

    // Validar telefone
    if (!validarTelefone(formData.telefone)) {
      setErros(prev => ({ ...prev, telefone: "Telefone inválido" }));
      toast({
        title: "Telefone inválido",
        description: "Por favor, informe um telefone válido com DDD",
        variant: "destructive",
      });
      return;
    }
    setErros(prev => ({ ...prev, telefone: "" }));

    // Verificar se documento já existe
    setVerificandoDocumento(true);
    const documentoDisponivel = await verificarDocumentoDuplicado(documento, tipoPessoa);
    setVerificandoDocumento(false);

    if (!documentoDisponivel) {
      return;
    }

    // Salvar e continuar
    localStorage.setItem(
      "checkout-dados",
      JSON.stringify({ ...formData, tipoPessoa })
    );
    setLocation(`/ecommerce/checkout/endereco?tipo=${tipoPessoa}`);
  };

  const formatCPF = formatarCPF;
  const formatCNPJ = formatarCNPJ;
  const formatPhone = formatarTelefone;

  const voltar = () => {
    setLocation("/ecommerce/checkout/tipo-cliente");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EcommerceHeader />

      <DocumentoDuplicadoModal
        open={modalDuplicado}
        onOpenChange={setModalDuplicado}
        tipoPessoa={tipoPessoa}
      />

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
                      onBlur={(e) => {
                        const doc = e.target.value;
                        if (doc) validarDocumentoCompleto(doc, "PF");
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500 ${
                        erros.documento ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    {erros.documento && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{erros.documento}</span>
                      </div>
                    )}
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
                      onBlur={(e) => {
                        const doc = e.target.value;
                        if (doc) validarDocumentoCompleto(doc, "PJ");
                      }}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className={`h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500 ${
                        erros.cnpj ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    {erros.cnpj && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{erros.cnpj}</span>
                      </div>
                    )}
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
                  onBlur={(e) => {
                    const tel = e.target.value;
                    if (tel && !validarTelefone(tel)) {
                      setErros(prev => ({ ...prev, telefone: "Telefone inválido (10 ou 11 dígitos)" }));
                    } else {
                      setErros(prev => ({ ...prev, telefone: "" }));
                    }
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={`h-12 px-4 font-semibold rounded-xl border-gray-300 focus:border-blue-500 ${
                    erros.telefone ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {erros.telefone && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{erros.telefone}</span>
                  </div>
                )}
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
                  disabled={verificandoDocumento}
                  className="flex-1 h-12 px-6 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificandoDocumento ? "Verificando..." : "Continuar"}
                  {!verificandoDocumento && <ArrowRight className="h-5 w-5" />}
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
