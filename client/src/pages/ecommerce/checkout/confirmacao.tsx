import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Loader2, Search } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useMutation, useQuery } from "@tanstack/react-query";

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
    email?: string;
    celular?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cep?: string;
    cidade?: string;
    uf?: string;
  } | null;
}

export default function CheckoutConfirmacao() {
  const [, setLocation] = useLocation();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [dados, setDados] = useState<any>({});
  const [endereco, setEndereco] = useState<any>({});
  const [usarOutroEndereco, setUsarOutroEndereco] = useState(false);
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [usarMesmoEndereco, setUsarMesmoEndereco] = useState(true);
  const [buscandoCep, setBuscandoCep] = useState(false);
  
  // Verificar se o cliente está logado
  const { data: customerData } = useQuery<CustomerData>({
    queryKey: ["/api/ecommerce/auth/customer"],
    retry: false,
  });
  
  useEffect(() => {
    // Se estiver logado, usar os dados do cliente
    if (customerData?.client) {
      console.log("✅ Cliente logado detectado:", customerData.client.nome);
      setTipoPessoa(customerData.client.cnpj?.length === 14 ? "PJ" : "PF");
      setDados({
        nome: customerData.client.nome,
        razaoSocial: customerData.client.nome,
        email: customerData.client.email || customerData.user.email,
        telefone: customerData.client.celular || "",
        cnpj: customerData.client.cnpj || "",
        documento: customerData.client.cnpj || "",
      });
      
      // Se não estiver editando outro endereço, usar o cadastrado
      if (!usarOutroEndereco) {
        setEndereco({
          logradouro: customerData.client.endereco || "",
          numero: customerData.client.numero || "",
          bairro: customerData.client.bairro || "",
          cidade: customerData.client.cidade || "",
          estado: customerData.client.uf || "",
          cep: customerData.client.cep || "",
          complemento: "",
        });
      }
      return;
    }
    
    console.log("⚠️ Cliente não logado, carregando do localStorage");
    // Se não estiver logado, carregar do localStorage
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo") as "PF" | "PJ";
    if (tipo) setTipoPessoa(tipo);
    
    const dadosStr = localStorage.getItem("checkout-dados");
    const enderecoStr = localStorage.getItem("checkout-endereco");
    
    if (dadosStr) setDados(JSON.parse(dadosStr));
    if (enderecoStr) {
      const enderecoParsed = JSON.parse(enderecoStr);
      // Extrair do wrapper enderecoCadastral se existir
      if (enderecoParsed.enderecoCadastral) {
        setEndereco(enderecoParsed.enderecoCadastral);
      } else {
        setEndereco(enderecoParsed);
      }
    }
  }, [customerData]);
  
  const buscarCep = async () => {
    const cepLimpo = endereco.cep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      setBuscandoCep(true);
      try {
        const response = await fetch(`/api/cep/${cepLimpo}`);
        if (response.ok) {
          const data = await response.json();
          setEndereco({
            ...endereco,
            logradouro: data.endereco || "",
            bairro: data.bairro || "",
            cidade: data.cidade || "",
            estado: data.uf || "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setBuscandoCep(false);
      }
    }
  };
  
  const formatCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{5})(\d{1,3})$/, "$1-$2");
  };
  
  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };
  
  const criarPedidoMutation = useMutation({
    mutationFn: async () => {
      // Validar se há itens no carrinho
      if (!items || items.length === 0) {
        throw new Error("Carrinho vazio");
      }

      // Garantir que os dados essenciais existam
      if (!dados.email || !dados.telefone) {
        throw new Error("Dados incompletos. Por favor, preencha todos os campos.");
      }

      const orderData = {
        tipoPessoa,
        // Dados pessoais
        nomeCompleto: tipoPessoa === "PF" ? dados.nome : undefined,
        razaoSocial: tipoPessoa === "PJ" ? (dados.razaoSocial || dados.nome) : undefined,
        cpf: tipoPessoa === "PF" && dados.documento ? dados.documento.replace(/\D/g, "") : undefined,
        cnpj: tipoPessoa === "PJ" && dados.cnpj ? dados.cnpj.replace(/\D/g, "") : (tipoPessoa === "PJ" && dados.documento ? dados.documento.replace(/\D/g, "") : undefined),
        email: dados.email,
        telefone: dados.telefone.replace(/\D/g, ""),
        // Endereço
        cep: endereco.cep ? endereco.cep.replace(/\D/g, "") : "",
        endereco: endereco.logradouro || "",
        numero: endereco.numero || "S/N",
        complemento: endereco.complemento || "",
        bairro: endereco.bairro || "",
        cidade: endereco.cidade || "",
        uf: endereco.estado || endereco.uf || "",
        // Itens do pedido
        items: items.map(item => ({
          productId: item.product.id,
          productNome: item.product.nome,
          productDescricao: item.product.descricao,
          productCategoria: item.product.categoria,
          productOperadora: item.product.operadora,
          quantidade: item.quantidade,
          linhasAdicionais: item.linhasAdicionais || 0,
          precoUnitario: item.product.preco,
          valorPorLinhaAdicional: item.product.valorPorLinhaAdicional || 0,
          subtotal: item.product.preco * item.quantidade,
        })),
        // Totais
        subtotal: total,
        total: total,
        termosAceitos: true,
      };
      
      const response = await fetch("/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar pedido");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Fazer upload dos documentos se houver
      const documentosStr = localStorage.getItem("checkout-documentos");
      if (documentosStr) {
        try {
          const documentos = JSON.parse(documentosStr);
          const orderId = data.orderId;
          
          // Mapear tipos de documentos
          const tiposDocumento: { [key: string]: string } = {
            documento: tipoPessoa === "PF" ? "CNH ou CPF/RG" : "CNH ou CPF/RG do Responsável",
            comprovante: "Comprovante de Endereço",
            contrato: "Contrato Social"
          };
          
          // Enviar cada documento
          for (const [key, doc] of Object.entries(documentos)) {
            if (doc && typeof doc === 'object' && 'data' in doc) {
              const docData = doc as { name: string; type: string; size: number; data: string };
              
              // Converter base64 de volta para File
              const base64Data = docData.data.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: docData.type });
              const file = new File([blob], docData.name, { type: docData.type });
              
              // Fazer upload
              const formData = new FormData();
              formData.append('file', file);
              formData.append('orderId', orderId);
              formData.append('tipo', tiposDocumento[key] || key);
              
              await fetch('/api/ecommerce/customer/documents/upload', {
                method: 'POST',
                body: formData,
              });
            }
          }
        } catch (error) {
          console.error('Erro ao fazer upload dos documentos:', error);
        }
      }
      
      clearCart();
      localStorage.removeItem("checkout-dados");
      localStorage.removeItem("checkout-endereco");
      localStorage.removeItem("checkout-documentos");
      setLocation(`/ecommerce/checkout/obrigado?pedido=${data.orderId}`);
    },
    onError: (error: Error) => {
      console.error("Erro ao criar pedido:", error);
      alert(`Erro ao criar pedido: ${error.message}`);
    },
  });
  
  const voltar = () => {
    // Se for cliente logado, voltar para planos
    if (customerData?.client) {
      setLocation("/ecommerce/planos");
    } else {
      setLocation(`/ecommerce/checkout/documentos?tipo=${tipoPessoa}`);
    }
  };
  
  const confirmar = () => {
    // Validar dados antes de enviar
    if (!dados.email || !dados.telefone) {
      alert("Por favor, preencha todos os dados necessários.");
      setLocation("/ecommerce/checkout");
      return;
    }
    
    if (items.length === 0) {
      alert("Seu carrinho está vazio.");
      setLocation("/ecommerce/planos");
      return;
    }
    
    criarPedidoMutation.mutate();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Confirmar Pedido</h1>
          <p className="text-slate-600">Etapa 5 de 5 • Revisão Final</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seus Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-slate-600">Tipo:</span>
                  <p className="font-semibold">{tipoPessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Nome:</span>
                  <p className="font-semibold">{dados.nome || dados.razaoSocial}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Documento:</span>
                  <p className="font-semibold">{dados.documento || dados.cnpj}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">E-mail:</span>
                  <p className="font-semibold">{dados.email}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Telefone:</span>
                  <p className="font-semibold">{dados.telefone}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Instalação</CardTitle>
              </CardHeader>
              <CardContent>
                {customerData?.client && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mesmo-endereco"
                        checked={usarMesmoEndereco}
                        onCheckedChange={(checked) => {
                          setUsarMesmoEndereco(checked as boolean);
                          if (checked) {
                            setEditandoEndereco(false);
                            setUsarOutroEndereco(false);
                            setEndereco({
                              logradouro: customerData?.client?.endereco || "",
                              numero: customerData?.client?.numero || "",
                              bairro: customerData?.client?.bairro || "",
                              cidade: customerData?.client?.cidade || "",
                              estado: customerData?.client?.uf || "",
                              cep: customerData?.client?.cep || "",
                              complemento: "",
                            });
                          } else {
                            setEditandoEndereco(true);
                            setUsarOutroEndereco(true);
                          }
                        }}
                      />
                      <Label
                        htmlFor="mesmo-endereco"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        O endereço de instalação é o mesmo do cadastro
                      </Label>
                    </div>
                  </div>
                )}

                {(!customerData?.client || !usarMesmoEndereco) && editandoEndereco ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="CEP"
                        value={endereco.cep || ""}
                        onChange={(e) => setEndereco({ ...endereco, cep: formatCEP(e.target.value) })}
                        maxLength={9}
                        className="border rounded px-3 py-2 text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={buscarCep}
                        disabled={buscandoCep}
                      >
                        {buscandoCep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <input
                      type="text"
                      placeholder="Logradouro"
                      value={endereco.logradouro || ""}
                      onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                      className="border rounded px-3 py-2 text-sm w-full"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Número"
                        value={endereco.numero || ""}
                        onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                        className="border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (opcional)"
                        value={endereco.complemento || ""}
                        onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                        className="border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={endereco.bairro || ""}
                      onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                      className="border rounded px-3 py-2 text-sm w-full"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={endereco.cidade || ""}
                        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                        className="border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="UF"
                        value={endereco.estado || ""}
                        onChange={(e) => setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })}
                        maxLength={2}
                        className="border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    {customerData?.client && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditandoEndereco(false);
                        }}
                        className="w-full"
                      >
                        Confirmar Endereço
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">
                      {endereco.logradouro}, {endereco.numero}
                      {endereco.complemento && ` - ${endereco.complemento}`}
                    </p>
                    <p>{endereco.bairro}</p>
                    <p>{endereco.cidade} - {endereco.estado}</p>
                    <p>CEP: {endereco.cep}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product.nome}</p>
                      <p className="text-xs text-slate-600">
                        Qtd: {item.quantidade} • Op. {item.product.operadora}
                      </p>
                      {item.linhasAdicionais && item.linhasAdicionais > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          +{item.linhasAdicionais} linhas
                        </Badge>
                      )}
                    </div>
                    <div className="font-bold text-sm">
                      {formatPreco(item.product.preco * item.quantidade)}
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span>{formatPreco(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={voltar} className="flex-1" disabled={criarPedidoMutation.isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={confirmar}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
                disabled={criarPedidoMutation.isPending}
              >
                {criarPedidoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
