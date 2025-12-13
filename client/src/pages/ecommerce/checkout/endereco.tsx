import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function CheckoutEndereco() {
  const [, setLocation] = useLocation();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [formData, setFormData] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);
  }, []);

  const buscarCepMutation = useMutation({
    mutationFn: async (cep: string) => {
      const response = await fetch(`/api/cep/${cep}`);
      if (!response.ok) throw new Error("CEP não encontrado");
      return response.json();
    },
    onSuccess: (data) => {
      setFormData({
        ...formData,
        logradouro: data.endereco || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.uf || "",
      });
    },
  });

  const buscarCep = () => {
    const cepLimpo = formData.cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCepMutation.mutate(cepLimpo);
    }
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{5})(\d{1,3})$/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("checkout-endereco", JSON.stringify(formData));
    setLocation(`/ecommerce/checkout/documentos?tipo=${tipoPessoa}`);
  };

  const voltar = () => {
    setLocation(`/ecommerce/checkout/dados?tipo=${tipoPessoa}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Endereço de Instalação</h1>
          <p className="text-slate-600">Etapa 3 de 5 • Endereço</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Onde será instalado o serviço?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    required
                    value={formData.cep}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cep: formatCEP(e.target.value),
                      })
                    }
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={buscarCep}
                    disabled={buscarCepMutation.isPending}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  required
                  value={formData.logradouro}
                  onChange={(e) =>
                    setFormData({ ...formData, logradouro: e.target.value })
                  }
                  placeholder="Rua, Avenida..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    required
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData({ ...formData, numero: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) =>
                      setFormData({ ...formData, complemento: e.target.value })
                    }
                    placeholder="Apto, Bloco..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  required
                  value={formData.bairro}
                  onChange={(e) =>
                    setFormData({ ...formData, bairro: e.target.value })
                  }
                  placeholder="Centro"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    required
                    value={formData.cidade}
                    onChange={(e) =>
                      setFormData({ ...formData, cidade: e.target.value })
                    }
                    placeholder="São Paulo"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="estado">UF</Label>
                  <Input
                    id="estado"
                    required
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value })
                    }
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
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
