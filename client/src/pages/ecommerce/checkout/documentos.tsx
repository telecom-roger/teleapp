import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Upload, FileText } from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export default function CheckoutDocumentos() {
  const [, setLocation] = useLocation();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    documento: null,
    comprovante: null,
    contrato: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);
  }, []);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles({ ...files, [key]: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Documentos serão enviados na confirmação final
    localStorage.setItem(
      "checkout-documentos",
      JSON.stringify({
        documento: files.documento?.name || null,
        comprovante: files.comprovante?.name || null,
        contrato: files.contrato?.name || null,
      })
    );
    setLocation(`/ecommerce/checkout/confirmacao?tipo=${tipoPessoa}`);
  };

  const voltar = () => {
    setLocation(`/ecommerce/checkout/endereco?tipo=${tipoPessoa}`);
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
              Documentos
            </h1>
            <p className="text-lg" style={{ color: "#555555" }}>
              Etapa 4 de 5 • Upload de Documentos
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
                <FileText className="h-6 w-6" style={{ color: "#1E90FF" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#111111" }}>
                Envie seus documentos
              </h2>
            </div>

            {/* Aviso sobre documentos */}
            <div
              className="p-4 mb-6"
              style={{
                backgroundColor: "rgba(30,144,255,0.05)",
                border: "1px solid rgba(30,144,255,0.2)",
                borderRadius: "12px",
              }}
            >
              <p className="text-sm" style={{ color: "#555555" }}>
                Os documentos não são obrigatórios agora, mas poderão ser
                solicitados através da nossa equipe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="documento">
                  {tipoPessoa === "PF" ? "RG ou CNH" : "Contrato Social"}
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="documento"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    {files.documento ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm">{files.documento.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          Clique para selecionar
                        </span>
                      </div>
                    )}
                  </label>
                  <Input
                    id="documento"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange("documento", e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comprovante">Comprovante de Residência</Label>
                <div className="mt-2">
                  <label
                    htmlFor="comprovante"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    {files.comprovante ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm">
                          {files.comprovante.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          Clique para selecionar
                        </span>
                      </div>
                    )}
                  </label>
                  <Input
                    id="comprovante"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(
                        "comprovante",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </div>
              </div>

              {tipoPessoa === "PJ" && (
                <div>
                  <Label htmlFor="contrato">Cartão CNPJ</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="contrato"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      {files.contrato ? (
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-green-600" />
                          <span className="text-sm">{files.contrato.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Upload className="h-5 w-5 mr-2 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            Clique para selecionar
                          </span>
                        </div>
                      )}
                    </label>
                    <Input
                      id="contrato"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "contrato",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>
              )}

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
