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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Documentos serão enviados na confirmação final
    localStorage.setItem("checkout-documentos", JSON.stringify({
      documento: files.documento?.name || null,
      comprovante: files.comprovante?.name || null,
      contrato: files.contrato?.name || null,
    }));
    setLocation(`/ecommerce/checkout/confirmacao?tipo=${tipoPessoa}`);
  };
  
  const voltar = () => {
    setLocation(`/ecommerce/checkout/endereco?tipo=${tipoPessoa}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Documentos</h1>
          <p className="text-slate-600">Etapa 4 de 5 • Upload de Documentos</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Envie seus documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="documento">{tipoPessoa === "PF" ? "RG ou CNH" : "Contrato Social"}</Label>
                <div className="mt-2">
                  <label htmlFor="documento" className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                    {files.documento ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm">{files.documento.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-slate-400" />
                        <span className="text-sm text-slate-600">Clique para selecionar</span>
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
              
              <div>
                <Label htmlFor="comprovante">Comprovante de Residência</Label>
                <div className="mt-2">
                  <label htmlFor="comprovante" className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                    {files.comprovante ? (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm">{files.comprovante.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-slate-400" />
                        <span className="text-sm text-slate-600">Clique para selecionar</span>
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
              
              {tipoPessoa === "PJ" && (
                <div>
                  <Label htmlFor="contrato">Cartão CNPJ</Label>
                  <div className="mt-2">
                    <label htmlFor="contrato" className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                      {files.contrato ? (
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-green-600" />
                          <span className="text-sm">{files.contrato.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Upload className="h-5 w-5 mr-2 text-slate-400" />
                          <span className="text-sm text-slate-600">Clique para selecionar</span>
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
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={voltar} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500">
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
