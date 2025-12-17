import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Search, Plus, X, MapPin } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

interface EnderecoData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export default function CheckoutEndereco() {
  const [, setLocation] = useLocation();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const { items } = useCartStore();

  // Buscar dados do cliente logado
  const { data: customerData } = useQuery<any>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
    enabled: true,
  });

  const [formData, setFormData] = useState<EnderecoData>({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [usarMesmoEndereco, setUsarMesmoEndereco] = useState(true);
  const [enderecosInstalacao, setEnderecosInstalacao] = useState<
    EnderecoData[]
  >([]);

  // Verificar se algum produto precisa endereço de instalação (configurado no produto)
  const precisaEnderecoInstalacao = items.some((item) => {
    return item.product?.precisaEnderecoInstalacao === true;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);

    // Popular endereço com dados do cliente se estiver logado
    if (customerData?.client) {
      const client = customerData.client;
      setFormData({
        cep: client.cep || "",
        logradouro: client.endereco || "",
        numero: client.numero || "",
        complemento: "",
        bairro: client.bairro || "",
        cidade: client.cidade || "",
        estado: client.uf || "",
      });
    }
  }, [customerData]);

  const adicionarEnderecoInstalacao = () => {
    setEnderecosInstalacao([
      ...enderecosInstalacao,
      {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
    ]);
  };

  const removerEnderecoInstalacao = (index: number) => {
    setEnderecosInstalacao(enderecosInstalacao.filter((_, i) => i !== index));
  };

  const atualizarEnderecoInstalacao = (
    index: number,
    campo: keyof EnderecoData,
    valor: string
  ) => {
    const novosEnderecos = [...enderecosInstalacao];
    novosEnderecos[index] = { ...novosEnderecos[index], [campo]: valor };
    setEnderecosInstalacao(novosEnderecos);
  };

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

  const buscarCepInstalacao = async (index: number) => {
    const cepLimpo = enderecosInstalacao[index].cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`/api/cep/${cepLimpo}`);
        if (!response.ok) throw new Error("CEP não encontrado");
        const data = await response.json();

        const novosEnderecos = [...enderecosInstalacao];
        novosEnderecos[index] = {
          ...novosEnderecos[index],
          logradouro: data.endereco || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.uf || "",
        };
        setEnderecosInstalacao(novosEnderecos);
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{5})(\d{1,3})$/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const enderecoData: any = {
      enderecoCadastral: formData,
    };

    // Se precisa endereço de instalação
    if (precisaEnderecoInstalacao) {
      if (usarMesmoEndereco) {
        enderecoData.enderecosInstalacao = [formData];
      } else {
        enderecoData.enderecosInstalacao = enderecosInstalacao;
      }
    }

    localStorage.setItem("checkout-endereco", JSON.stringify(enderecoData));
    setLocation(`/ecommerce/checkout/documentos?tipo=${tipoPessoa}`);
  };

  const voltar = () => {
    setLocation(`/ecommerce/checkout/dados?tipo=${tipoPessoa}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EcommerceHeader />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              Endereço
            </h1>
            <p className="text-lg text-gray-600">
              Etapa 3 de 5 • Endereço de Cadastro e Instalação
            </p>
          </div>

          {/* Card do Formulário */}
          <div className="p-8 mb-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            {/* Título com ícone */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Endereço Cadastral
              </h2>
            </div>
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

              {/* Seção de Endereços de Instalação (apenas para produtos específicos) */}
              {precisaEnderecoInstalacao && (
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold text-lg mb-3">
                    Endereço de Instalação
                  </h3>

                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="mesmoEndereco"
                      checked={usarMesmoEndereco}
                      onCheckedChange={(checked) =>
                        setUsarMesmoEndereco(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="mesmoEndereco"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Usar o mesmo endereço cadastral para instalação
                    </label>
                  </div>

                  {!usarMesmoEndereco && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Adicione os endereços onde os serviços serão instalados
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={adicionarEnderecoInstalacao}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Endereço de Instalação
                      </Button>

                      {enderecosInstalacao.map((endereco, index) => (
                        <Card
                          key={index}
                          className="border-2 border-purple-200"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Endereço de Instalação #{index + 1}
                              </CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerEnderecoInstalacao(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label>CEP</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={endereco.cep}
                                  onChange={(e) =>
                                    atualizarEnderecoInstalacao(
                                      index,
                                      "cep",
                                      formatCEP(e.target.value)
                                    )
                                  }
                                  placeholder="00000-000"
                                  maxLength={9}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => buscarCepInstalacao(index)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label>Logradouro</Label>
                              <Input
                                value={endereco.logradouro}
                                onChange={(e) =>
                                  atualizarEnderecoInstalacao(
                                    index,
                                    "logradouro",
                                    e.target.value
                                  )
                                }
                                placeholder="Rua, Avenida..."
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1">
                                <Label>Número</Label>
                                <Input
                                  value={endereco.numero}
                                  onChange={(e) =>
                                    atualizarEnderecoInstalacao(
                                      index,
                                      "numero",
                                      e.target.value
                                    )
                                  }
                                  placeholder="123"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label>Complemento</Label>
                                <Input
                                  value={endereco.complemento}
                                  onChange={(e) =>
                                    atualizarEnderecoInstalacao(
                                      index,
                                      "complemento",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Apto, Bloco..."
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Bairro</Label>
                              <Input
                                value={endereco.bairro}
                                onChange={(e) =>
                                  atualizarEnderecoInstalacao(
                                    index,
                                    "bairro",
                                    e.target.value
                                  )
                                }
                                placeholder="Centro"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <Label>Cidade</Label>
                                <Input
                                  value={endereco.cidade}
                                  onChange={(e) =>
                                    atualizarEnderecoInstalacao(
                                      index,
                                      "cidade",
                                      e.target.value
                                    )
                                  }
                                  placeholder="São Paulo"
                                />
                              </div>
                              <div className="col-span-1">
                                <Label>UF</Label>
                                <Input
                                  value={endereco.estado}
                                  onChange={(e) =>
                                    atualizarEnderecoInstalacao(
                                      index,
                                      "estado",
                                      e.target.value
                                    )
                                  }
                                  placeholder="SP"
                                  maxLength={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
