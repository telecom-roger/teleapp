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
import { CartUpsellPreview } from "@/components/ecommerce/CartUpsellPreview";
import { useCheckoutDdd } from "@/contexts/CheckoutDddContext";

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
  const { distribuicao } = useCheckoutDdd();
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [dados, setDados] = useState<any>({});
  const [endereco, setEndereco] = useState<any>({});
  const [usarOutroEndereco, setUsarOutroEndereco] = useState(false);
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [usarMesmoEndereco, setUsarMesmoEndereco] = useState(true);
  const [buscandoCep, setBuscandoCep] = useState(false);
  
  // Verificar se o cliente está logado
  const { data: customerData } = useQuery<CustomerData>({
    queryKey: ["/api/app/auth/customer"],
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
      
      // Sempre popular o endereço com dados do cliente logado
      setEndereco({
        logradouro: customerData.client.endereco || "",
        numero: customerData.client.numero || "",
        bairro: customerData.client.bairro || "",
        cidade: customerData.client.cidade || "",
        estado: customerData.client.uf || "",
        cep: customerData.client.cep || "",
        complemento: "",
      });
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

      // Recuperar tipo de contratação do localStorage
      const tipoContratacao = localStorage.getItem("tipo-contratacao") || "linha_nova";
      
      console.log("\n📦 [CHECKOUT] Criando pedido com:");
      console.log("   tipoContratacao:", tipoContratacao);
      console.log("   tipoPessoa:", tipoPessoa);
      
      const orderData = {
        tipoPessoa,
        tipoContratacao, // linha_nova ou portabilidade
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
        // DDDs (se houver)
        ddds: distribuicao.length > 0 
          ? distribuicao.map(d => ({ ddd: d.ddd, quantidade: d.quantidade }))
          : undefined,
        // Totais
        subtotal: total,
        total: total,
        termosAceitos: true,
      };
      
      const response = await fetch("/api/app/orders", {
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
      const orderId = data.orderId;
      
      // 1️⃣ PRIMEIRO: Marcar SVA do checkout como "visualizado" ou "aceito" e AGUARDAR
      const svaCheckout = localStorage.getItem('lastShownUpsellCheckout');
      if (svaCheckout && orderId) {
        try {
          // Verificar se o SVA foi adicionado ao carrinho (aceito)
          const svaFoiAceito = items.some(item => item.product.id === svaCheckout);
          
          console.log(`🔍 [CHECKOUT] Verificando SVA ${svaCheckout}`);
          console.log(`   Items no carrinho:`, items.map(i => ({ id: i.product.id, nome: i.product.nome })));
          console.log(`   Foi aceito?`, svaFoiAceito);
          
          if (svaFoiAceito) {
            console.log(`✅ [CHECKOUT] SVA ${svaCheckout} foi ACEITO - marcando como aceito`);
            const response = await fetch(`/api/app/customer/orders/${orderId}/upsell-response`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ svaId: svaCheckout, accepted: true }),
            });
            
            if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ [CHECKOUT] Resposta do backend:`, result);
            
            // AGUARDAR um pouco para garantir que salvou no banco
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`✅ [CHECKOUT] SVA marcado como aceito - confirmado`);
          } else {
            console.log(`👁️ [CHECKOUT] SVA ${svaCheckout} foi apenas visualizado - marcando como oferecido`);
            const response = await fetch(`/api/app/customer/orders/${orderId}/upsell-viewed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ svaId: svaCheckout }),
            });
            
            if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            console.log(`✅ [CHECKOUT] SVA marcado como visualizado - confirmado`);
          }
          
          // Limpar do localStorage
          localStorage.removeItem('lastShownUpsellCheckout');
        } catch (error) {
          console.error(`❌ [CHECKOUT] Erro ao marcar SVA:`, error);
          // Continuar mesmo com erro - não bloquear o fluxo
        }
      }
      
      // 2️⃣ SEGUNDO: Fazer upload dos documentos se houver
      const documentosStr = localStorage.getItem("checkout-documentos");
      if (documentosStr) {
        try {
          const documentos = JSON.parse(documentosStr);
          
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
              
              await fetch('/api/app/customer/documents/upload', {
                method: 'POST',
                body: formData,
              });
            }
          }
        } catch (error) {
          console.error('Erro ao fazer upload dos documentos:', error);
        }
      }
      
      // 3️⃣ TERCEIRO: Limpar dados e redirecionar
      clearCart();
      localStorage.removeItem("checkout-dados");
      localStorage.removeItem("checkout-endereco");
      localStorage.removeItem("checkout-documentos");
      
      console.log(`🎯 [CHECKOUT] Redirecionando para página obrigado...`);
      // Passar orderCode na URL para usuários não logados
      if (data.orderCode) {
        setLocation(`/app/checkout/obrigado?pedido=${data.orderId}&orderCode=${data.orderCode}`);
      } else {
        setLocation(`/app/checkout/obrigado?pedido=${data.orderId}`);
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao criar pedido:", error);
      alert(`Erro ao criar pedido: ${error.message}`);
    },
  });
  
  const voltar = () => {
    // Verificar se há produtos móveis
    const temProdutosMoveis = items.some(
      (item) => item.product?.categoria?.toLowerCase() === "movel"
    );
    
    // Se for cliente logado, voltar para seleção de DDD ou planos
    if (customerData?.client) {
      if (temProdutosMoveis) {
        setLocation("/app/checkout/selecao-ddd");
      } else {
        setLocation("/app/planos");
      }
    } else {
      setLocation(`/app/checkout/documentos?tipo=${tipoPessoa}`);
    }
  };
  
  const confirmar = () => {
    // Validar dados antes de enviar
    if (!dados.email || !dados.telefone) {
      alert("Por favor, preencha todos os dados necessários.");
      setLocation("/app/checkout");
      return;
    }
    
    if (items.length === 0) {
      alert("Seu carrinho está vazio.");
      setLocation("/app/planos");
      return;
    }
    
    criarPedidoMutation.mutate();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Confirmar Pedido</h1>
          <p className="text-gray-600 text-lg">Etapa 5 de 5 • Revisão Final</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Seus Dados</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <p className="font-semibold text-gray-900">{tipoPessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-semibold text-gray-900">{dados.nome || dados.razaoSocial}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Documento:</span>
                  <p className="font-semibold text-gray-900">{dados.documento || dados.cnpj}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">E-mail:</span>
                  <p className="font-semibold text-gray-900">{dados.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <p className="font-semibold text-gray-900">{dados.telefone}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Endereço Cadastrado</h2>
              </div>
              <div className="p-6">
                {/* Sempre mostrar o endereço cadastrado quando o usuário está logado */}
                {customerData?.client && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Endereço do Cadastro</h3>
                    <p className="text-gray-700">
                      {customerData.client.endereco || "Endereço não informado"}, {customerData.client.numero || ""}
                    </p>
                    <p className="text-gray-600">{customerData.client.bairro || ""}</p>
                    <p className="text-gray-600">{customerData.client.cidade || ""} - {customerData.client.uf || ""}</p>
                    <p className="text-gray-600">CEP: {customerData.client.cep || ""}</p>
                  </div>
                )}

                {/* Checkbox para usar o mesmo endereço ou adicionar endereço de instalação diferente */}
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

                {/* Se desmarcou, mostrar campos para adicionar endereço de instalação diferente */}
                {!usarMesmoEndereco && customerData?.client && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Endereço de Instalação</h3>
                  </div>
                )}

                {editandoEndereco && !usarMesmoEndereco ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="CEP"
                        value={endereco.cep || ""}
                        onChange={(e) => setEndereco({ ...endereco, cep: formatCEP(e.target.value) })}
                        maxLength={9}
                        className="border rounded-xl px-3 py-2 text-sm flex-1 border-gray-300 focus:border-blue-500"
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
                      className="border rounded-xl px-3 py-2 text-sm w-full border-gray-300 focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Número"
                        value={endereco.numero || ""}
                        onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                        className="border rounded-xl px-3 py-2 text-sm border-gray-300 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (opcional)"
                        value={endereco.complemento || ""}
                        onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                        className="border rounded-xl px-3 py-2 text-sm border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={endereco.bairro || ""}
                      onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                      className="border rounded-xl px-3 py-2 text-sm w-full border-gray-300 focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={endereco.cidade || ""}
                        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                        className="border rounded-xl px-3 py-2 text-sm border-gray-300 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="UF"
                        value={endereco.estado || ""}
                        onChange={(e) => setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })}
                        maxLength={2}
                        className="border rounded-xl px-3 py-2 text-sm border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setEditandoEndereco(false);
                      }}
                      className="w-full h-10 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      Confirmar Endereço
                    </button>
                  </div>
                ) : !usarMesmoEndereco && customerData?.client ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-semibold text-gray-900">
                      {endereco.logradouro || "Endereço não informado"}, {endereco.numero || ""}
                      {endereco.complemento && ` - ${endereco.complemento}`}
                    </p>
                    <p className="text-gray-600">{endereco.bairro || ""}</p>
                    <p className="text-gray-600">{endereco.cidade || ""} - {endereco.estado || ""}</p>
                    <p className="text-gray-600">CEP: {endereco.cep || ""}</p>
                    <button
                      onClick={() => setEditandoEndereco(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Editar Endereço de Instalação
                    </button>
                  </div>
                ) : !customerData?.client ? (
                  <div>
                    <p className="font-semibold text-gray-900">
                      {endereco.logradouro || "Endereço não informado"}, {endereco.numero || ""}
                      {endereco.complemento && ` - ${endereco.complemento}`}
                    </p>
                    <p className="text-gray-600">{endereco.bairro || ""}</p>
                    <p className="text-gray-600">{endereco.cidade || ""} - {endereco.estado || ""}</p>
                    <p className="text-gray-600">CEP: {endereco.cep || ""}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Produtos</h2>
              </div>
              <div className="p-6 space-y-4">
                {items.map((item) => {
                  const operadoraNome = item.product.operadora === 'V' ? 'Vivo' : 
                                       item.product.operadora === 'C' ? 'Claro' : 
                                       item.product.operadora === 'T' ? 'Tim' : 
                                       item.product.operadora;
                  
                  // Verificar se é produto móvel
                  const isMobile = item.product?.categoria?.toLowerCase() === "movel";
                  
                  // Calcular total de linhas deste produto
                  const totalLinhasProduto = item.quantidade + (item.linhasAdicionais || 0);
                  
                  // Filtrar DDDs relacionados a este produto (proporcional)
                  const dddsParaProduto = isMobile && distribuicao && distribuicao.length > 0
                    ? distribuicao
                    : [];
                  
                  return (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.product.nome}</p>
                      <p className="text-xs text-gray-600">
                        Qtd: {item.quantidade} • Op: {operadoraNome}
                      </p>
                      {item.linhasAdicionais > 0 && (
                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 font-medium mt-1">
                          +{item.linhasAdicionais} linhas
                        </span>
                      )}
                      {dddsParaProduto.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {dddsParaProduto.map((ddd, idx) => (
                            <span key={idx}>
                              {ddd.quantidade} {ddd.quantidade === 1 ? 'linha' : 'linhas'} DDD {ddd.ddd}
                              {idx < dddsParaProduto.length - 1 ? ' • ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-sm text-gray-900">
                      {formatPreco(item.product.preco * item.quantidade)}
                    </div>
                  </div>
                  );
                })}
                
                <div className="border-t pt-4 mt-4 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-blue-600">{formatPreco(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 🆕 UPSELL NO CHECKOUT - Após produtos, antes de confirmar */}
            <CartUpsellPreview 
              onAccept={(svaId) => {
                console.log(`✅ [CHECKOUT] SVA ${svaId} adicionado ao carrinho pelo upsell`);
              }}
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={voltar}
                disabled={criarPedidoMutation.isPending}
                className="w-full sm:flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                onClick={confirmar}
                disabled={criarPedidoMutation.isPending}
                className="w-full sm:flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {criarPedidoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
