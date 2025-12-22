import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Upload, FileText } from "lucide-react";

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
  
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter arquivos para base64 para salvar no localStorage
    const documentosData: any = {};
    
    if (files.documento) {
      documentosData.documento = {
        name: files.documento.name,
        type: files.documento.type,
        size: files.documento.size,
        data: await convertFileToBase64(files.documento)
      };
    }
    
    // Comprovante apenas para PF
    if (files.comprovante && tipoPessoa === "PF") {
      documentosData.comprovante = {
        name: files.comprovante.name,
        type: files.comprovante.type,
        size: files.comprovante.size,
        data: await convertFileToBase64(files.comprovante)
      };
    }
    
    if (files.contrato) {
      documentosData.contrato = {
        name: files.contrato.name,
        type: files.contrato.type,
        size: files.contrato.size,
        data: await convertFileToBase64(files.contrato)
      };
    }
    
    localStorage.setItem("checkout-documentos", JSON.stringify(documentosData));
    console.log("📄➡️ [DOCUMENTOS] Navegando para seleção de DDD...");
    setLocation(`/app/checkout/selecao-ddd?tipo=${tipoPessoa}`);
  };
  
  const voltar = () => {
    setLocation(`/app/checkout/endereco?tipo=${tipoPessoa}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Documentos</h1>
          <p className="text-gray-600 text-lg">Etapa 4 de 5 • Upload de Documentos</p>
        </div>
        
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Envie seus documentos</h2>
            <p className="text-sm text-gray-600 mt-2">
              ℹ️ O envio de documentos não é obrigatório agora, mas poderá ser solicitado posteriormente pela nossa equipe.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">
                  {tipoPessoa === "PF" ? "CNH ou CPF/RG" : "CNH ou CPF/RG do Responsável"}
                </label>
                <div className="mt-2">
                  <label htmlFor="documento" className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                    {files.documento ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{files.documento.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Clique para selecionar</span>
                      </div>
                    )}
                  </label>
                  <Input
                    id="documento"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("documento", e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              
              {tipoPessoa === "PJ" && (
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">Contrato Social</label>
                <div className="mt-2">
                  <label htmlFor="contrato" className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                    {files.contrato ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{files.contrato.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Clique para selecionar</span>
                      </div>
                    )}
                  </label>
                  <Input
                    id="contrato"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("contrato", e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              )}
              
              {tipoPessoa === "PF" && (
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">Comprovante de Endereço</label>
                <div className="mt-2">
                  <label htmlFor="comprovante" className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                    {files.comprovante ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{files.comprovante.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Clique para selecionar</span>
                      </div>
                    )}
                  </label>
                  <Input
                    id="comprovante"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("comprovante", e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={voltar}
                  className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
