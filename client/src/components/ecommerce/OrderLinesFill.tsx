import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Plus, 
  Save, 
  Trash2, 
  Edit2,
  Edit, 
  Check, 
  X, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface OrderLinesFillProps {
  orderId: string;
  onClose?: () => void;
  readOnly?: boolean;
}

interface Product {
  id: string;
  nome: string;
  operadora: string;
  categoria: string;
  productId: string;
  quantidade: number;
  svasUpsell: string[];
}

interface SVA {
  id: string;
  nome: string;
  categoria: string;
  productId: string;
  quantidade: number;
}

interface OrderLine {
  id: string;
  orderId: string;
  productId: string;
  numero: string;
  operadoraAtual: string | null;
  operadoraDestino: string | null;
  svas: string[];
  status: string;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

const OPERADORAS = [
  { value: "vivo", label: "Vivo" },
  { value: "claro", label: "Claro" },
  { value: "tim", label: "TIM" },
  { value: "oi", label: "Oi" },
  { value: "nextel", label: "Nextel" },
  { value: "algar", label: "Algar" },
  { value: "outra", label: "Outra" },
];

export function OrderLinesFill({ orderId, onClose, readOnly = false }: OrderLinesFillProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [slots, setSlots] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  // Buscar resumo do pedido
  const { data: summary, isLoading: loadingSummary } = useQuery<any>({
    queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
  
  // Log quando summary mudar
  useEffect(() => {
    if (summary) {
      console.log('📦 SUMMARY RECEBIDO:', {
        totalLinhasContratadas: summary.totalLinhasContratadas,
        totalLinhasPreenchidas: summary.totalLinhasPreenchidas,
        linhasRestantes: summary.linhasRestantes,
        produtosDisponiveis: summary.produtosDisponiveis?.length,
        svasDisponiveis: summary.svasDisponiveis?.length
      });
      
      // Log detalhado dos produtos
      console.log('🎯 PRODUTOS DETALHADOS:');
      summary.produtosDisponiveis?.forEach((p: any, i: number) => {
        console.log(`  Produto ${i + 1}:`, {
          id: p.id,
          nome: p.nome,
          quantidade: p.quantidade,
          categoria: p.categoria,
          operadora: p.operadora
        });
      });
      
      // Log detalhado dos SVAs
      console.log('🎯 SVAs DETALHADOS:');
      summary.svasDisponiveis?.forEach((s: any, i: number) => {
        console.log(`  SVA ${i + 1}:`, {
          id: s.id,
          nome: s.nome,
          quantidade: s.quantidade,
          categoria: s.categoria
        });
      });
    } else {
      console.log('⚠️ SUMMARY ainda não carregou');
    }
  }, [summary]);

  // Inicializar slots baseado no resumo
  useEffect(() => {
    if (summary) {
      console.log('🔧 Inicializando slots...');
      console.log('📊 DADOS DO SUMMARY:');
      console.log('   Total contratadas:', summary.totalLinhasContratadas);
      console.log('   Total preenchidas:', summary.totalLinhasPreenchidas);
      console.log('   Linhas restantes:', summary.linhasRestantes);
      console.log('   Linhas array length:', summary.linhas?.length);
      
      const newSlots: any[] = [];
      
      // Adicionar slots para linhas já preenchidas
      summary.linhas.forEach((line: OrderLine) => {
        console.log('  ✅ Adicionando linha preenchida:', line.numero);
        newSlots.push({
          id: line.id,
          filled: true,
          saved: true,
          isEditing: false,
          editing: false,
          numero: line.numero,
          productId: line.productId,
          operadoraAtual: line.operadoraAtual || "",
          svas: line.svas || [],
          observacoes: line.observacoes || "",
          status: line.status,
        });
      });
      
      // Adicionar slots vazios para linhas restantes
      const remaining = summary.linhasRestantes;
      console.log(`  🆕 Criando ${remaining} slots vazios`);
      for (let i = 0; i < remaining; i++) {
        newSlots.push({
          id: `new-${i}`,
          filled: false,
          saved: false,
          isEditing: true,
          editing: false,
          numero: "",
          productId: "",
          operadoraAtual: "",
          svas: [],
          observacoes: "",
        });
      }
      
      console.log(`✅ Total de slots criados: ${newSlots.length}`);
      setSlots(newSlots);
    }
  }, [summary]);

  // Mutation para criar linha
  const createLineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/ecommerce/order-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "Erro ao criar linha");
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
      
      // Encontrar o slot e marcar como saved
      const slotIndex = slots.findIndex(s => 
        s.numero === variables.numero && !s.saved
      );
      if (slotIndex !== -1) {
        updateSlot(slotIndex, "saved", true);
        updateSlot(slotIndex, "isEditing", false);
        updateSlot(slotIndex, "id", data.id);
      }
      
      const linhasPreenchidas = slots.filter(s => s.saved).length + 1;
      const totalLinhas = slots.length;
      
      toast({
        title: "Linha salva com sucesso!",
        description: `Progresso: ${linhasPreenchidas}/${totalLinhas} linhas preenchidas`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar linha
  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string; data: any }) => {
      const res = await fetch(`/api/ecommerce/order-lines/${lineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "Erro ao atualizar linha");
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
      
      // Marcar o slot como saved e sair do modo de edição
      const slotIndex = slots.findIndex(s => s.id === variables.lineId);
      if (slotIndex !== -1) {
        updateSlot(slotIndex, "isEditing", false);
      }
      
      toast({
        title: "Linha atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar linha
  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await fetch(`/api/ecommerce/order-lines/${lineId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "Erro ao remover linha");
      }
      
      return { lineId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
      
      // Encontrar e limpar o slot local
      const slotIndex = slots.findIndex(s => s.id === data.lineId);
      if (slotIndex !== -1) {
        console.log(`✅ Limpando Slot ${slotIndex} após remoção bem-sucedida`);
        updateSlot(slotIndex, "productId", "");
        updateSlot(slotIndex, "numero", "");
        updateSlot(slotIndex, "operadoraAtual", "");
        updateSlot(slotIndex, "svas", []);
        updateSlot(slotIndex, "observacoes", "");
        updateSlot(slotIndex, "saved", false);
        updateSlot(slotIndex, "filled", false);
      }
      
      toast({
        title: "Linha removida",
        description: "O produto foi liberado e está disponível novamente para seleção.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Alias para facilitar uso no componente
  const saveMutation = createLineMutation;

  const handleSaveSlot = (index: number) => {
    const slot = slots[index];
    
    console.log(`💾 Tentando salvar Slot ${index}:`, {
      numero: slot.numero,
      productId: slot.productId,
      svas: slot.svas,
      operadoraAtual: slot.operadoraAtual
    });
    
    if (!slot.numero) {
      toast({
        title: "Número obrigatório",
        description: "Preencha o número da linha.",
        variant: "destructive",
      });
      return;
    }
    
    if (!slot.productId) {
      console.error(`❌ ProductId está vazio! Slot completo:`, slot);
      toast({
        title: "Produto não selecionado",
        description: "Selecione um plano antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    if (slot.filled && slot.id && !slot.id.startsWith("new-")) {
      // Atualizar linha existente
      updateLineMutation.mutate({
        lineId: slot.id,
        data: {
          numero: slot.numero,
          operadoraAtual: slot.operadoraAtual,
          svas: slot.svas,
          observacoes: slot.observacoes,
        },
      });
    } else {
      // Criar nova linha
      createLineMutation.mutate({
        orderId,
        productId: slot.productId,
        numero: slot.numero,
        operadoraAtual: slot.operadoraAtual,
        svas: slot.svas,
        observacoes: slot.observacoes,
      });
    }
    
    setEditingSlot(null);
  };

  const handleDeleteSlot = (index: number) => {
    const slot = slots[index];
    
    console.log(`🗑️ REMOVENDO Slot ${index}:`, slot);
    
    if (slot.saved && slot.id && !slot.id.startsWith("new-")) {
      // Linha salva no banco - chamar API
      deleteLineMutation.mutate(slot.id);
    } else {
      // Linha não salva - apenas limpar estado local
      console.log(`   (Apenas limpando estado local)`);
      updateSlot(index, "productId", "");
      updateSlot(index, "numero", "");
      updateSlot(index, "operadoraAtual", "");
      updateSlot(index, "svas", []);
      updateSlot(index, "observacoes", "");
      updateSlot(index, "saved", false);
      updateSlot(index, "filled", false);
      
      toast({
        title: "Linha limpa",
        description: "Os produtos foram liberados para outras linhas",
      });
    }
  };

  const updateSlot = (index: number, field: string, value: any) => {
    console.log(`🔧 updateSlot - Slot ${index}, Campo: ${field}, Valor:`, value);
    
    // Usar forma funcional para garantir que temos o estado mais recente
    setSlots(prevSlots => {
      const newSlots = [...prevSlots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      console.log(`   ✅ Novo estado do Slot ${index}:`, newSlots[index]);
      console.log(`   📊 TODOS OS SLOTS:`, newSlots.map((s, i) => `[${i}]: ${s.productId ? s.productId.substring(0,8) : 'vazio'}`).join(', '));
      return newSlots;
    });
  };
  
  // Formatar telefone com máscara
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };
  
  // Validar telefone
  const isValidPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  };

  const toggleSVA = (index: number, svaId: string) => {
    const slot = slots[index];
    const currentSvas = slot.svas || [];
    const newSvas = currentSvas.includes(svaId)
      ? currentSvas.filter((id: string) => id !== svaId)
      : [...currentSvas, svaId];
    
    console.log(`🎯 SLOT ${index} - Toggle SVA:`, svaId, `(${currentSvas.includes(svaId) ? 'REMOVENDO' : 'ADICIONANDO'})`);
    updateSlot(index, "svas", newSvas);
    console.log(`✅ SVAs do Slot ${index}:`, newSvas);
  };

  // Filtrar produtos disponíveis com contagem inteligente
  const getAvailableProducts = (currentIndex: number) => {
    if (!summary) return [];
    
    console.log(`🔍 getAvailableProducts para Slot ${currentIndex}`);
    console.log(`   Produtos selecionados:`, slots.map((s, i) => `[${i}]: ${s.productId ? s.productId.substring(0,8) : 'vazio'}`).join(', '));
    
    // Criar lista plana: cada produto aparece N vezes (baseado na quantidade)
    const allProductEntries: Array<{ id: string; nome: string; operadora: string; entryIndex: number }> = [];
    summary.produtosDisponiveis.forEach((p: Product) => {
      const qty = p.quantidade || 1;
      for (let i = 0; i < qty; i++) {
        allProductEntries.push({
          id: p.id,
          nome: p.nome,
          operadora: p.operadora || '',
          entryIndex: allProductEntries.length,
        });
      }
    });
    
    // Marcar produtos já SELECIONADOS em outros slots (exceto o atual)
    const usedIndices = new Set<number>();
    
    slots.forEach((slot, slotIndex) => {
      if (slotIndex !== currentIndex && slot.productId) {
        const idx = allProductEntries.findIndex((entry, i) => 
          entry.id === slot.productId && !usedIndices.has(i)
        );
        if (idx !== -1) {
          usedIndices.add(idx);
        }
      }
    });
    
    // Retornar produtos disponíveis (não usados)
    return allProductEntries.filter((_, idx) => !usedIndices.has(idx));
  };

  const getAvailableSVAs = (index: number) => {
    if (!summary) {
      console.log(`⚠️ Summary não disponível para Slot ${index}`);
      return [];
    }
    
    const slot = slots[index];
    if (!slot.productId) {
      console.log(`⚠️ Slot ${index} não tem produto selecionado`);
      return [];
    }
    
    console.log(`🔍 getAvailableSVAs para Slot ${index}:`, {
      productId: slot.productId,
      svasDisponiveis: summary.svasDisponiveis?.length,
      svasData: summary.svasDisponiveis
    });
    
    // Criar lista plana de SVAs: cada SVA aparece N vezes (baseado na quantidade)
    const allSVAEntries: Array<{ id: string; nome: string; entryIndex: number }> = [];
    summary.svasDisponiveis.forEach((sva: SVA) => {
      const qty = sva.quantidade || 1;
      for (let i = 0; i < qty; i++) {
        allSVAEntries.push({
          id: sva.id,
          nome: sva.nome,
          entryIndex: allSVAEntries.length,
        });
      }
    });
    
    // Marcar SVAs já SELECIONADOS (não salvos) em outros slots
    const usedIndices = new Set<number>();
    
    slots.forEach((s, i) => {
      if (i !== index && s.svas && Array.isArray(s.svas)) {
        s.svas.forEach((svaId: string) => {
          const idx = allSVAEntries.findIndex((entry, entryIdx) => 
            entry.id === svaId && !usedIndices.has(entryIdx)
          );
          if (idx !== -1) {
            usedIndices.add(idx);
          }
        });
      }
    });
    
    // Retornar SVAs disponíveis (não usados)
    const available = allSVAEntries.filter((_, idx) => !usedIndices.has(idx));
    console.log(`✅ SVAs disponíveis para Slot ${index}:`, available.length, available.map(s => s.nome));
    return available;
  };

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Não foi possível carregar as informações do pedido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            Preencher Linhas de Portabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                Progresso: <span className="font-bold text-blue-600">{summary.totalLinhasPreenchidas}</span> de{" "}
                <span className="font-bold">{summary.totalLinhasContratadas}</span> linhas
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{summary.progresso}%</p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${summary.progresso}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Slots de linhas */}
      <div className="space-y-4">
        {slots.map((slot, index) => {
          const isEditing = editingSlot === index || (!slot.filled && !slot.editing);
          const canEdit = !readOnly && (slot.status === "inicial" || !slot.filled);
          
          // IMPORTANTE: Usar slot atual, não closure antiga
          const currentSlot = slots[index];
          const availableProducts = getAvailableProducts(index);
          const availableSVAs = getAvailableSVAs(index);
          
          // Key individual - usa apenas o ID do slot (não muda quando seleciona produto)
          const cardKey = `slot-${currentSlot.id}-${isEditing ? 'edit' : 'view'}`;
          
          // Debug consolidado
          if (index === 0) {
            console.log('📊 ESTADO GLOBAL DOS SLOTS:');
            slots.forEach((s, i) => {
              const prod = summary?.produtosDisponiveis?.find(p => p.id === s.productId);
              console.log(`  Slot ${i}: ${prod?.nome || '(vazio)'}, productId: ${s.productId?.substring(0,8) || 'N/A'}`);
            });
          }
          
          // Debug SVAs
          console.log(`🔍 Slot ${index} - Verificação SVAs:`, {
            temProductId: !!currentSlot.productId,
            productId: currentSlot.productId?.substring(0, 8) || 'vazio',
            availableSVAsLength: availableSVAs.length,
            vaiFicarVisivel: !!(currentSlot.productId && availableSVAs.length > 0)
          });

          return (
            <Card 
              key={cardKey} 
              className={`transition-all duration-200 ${
                currentSlot.saved 
                  ? "border-green-300 bg-green-50/30 shadow-sm" 
                  : "border-gray-200 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      currentSlot.saved 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Linha {index + 1}</CardTitle>
                      {currentSlot.saved && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Preenchida
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!currentSlot.saved || isEditing ? (
                  <>
                    {/* MODO DE EDIÇÃO */}
                    <div className="space-y-4">
                    {/* Número */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Número da Linha *</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={currentSlot.numero}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          updateSlot(index, "numero", formatted);
                        }}
                        disabled={!canEdit}
                        className="mt-1.5"
                      />
                    </div>

                    {/* Plano */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-sm font-medium text-gray-700">Plano Contratado *</Label>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {availableProducts.length} disponível(is)
                        </span>
                      </div>
                      <Select
                        value={currentSlot.productId || undefined}
                        onValueChange={(value) => {
                          const productName = availableProducts.find(p => p.id === value)?.nome;
                          console.log(`🎯 SLOT ${index} SELECIONOU PRODUTO:`, productName, value);
                          console.log(`   📊 Estado ANTES:`, slots.map((s, i) => `[${i}]: ${s.productId ? s.productId.substring(0,8) : 'vazio'}`).join(', '));
                          
                          updateSlot(index, "productId", value);
                          updateSlot(index, "svas", []); // Limpar SVAs ao mudar plano
                          
                          // Verificar estado após update com timeout maior
                          setTimeout(() => {
                            console.log(`   📊 Estado DEPOIS:`, slots.map((s, i) => `[${i}]: ${s.productId ? s.productId.substring(0,8) : 'vazio'}`).join(', '));
                            console.log(`   🔍 Slot ${index} atual:`, {
                              productId: slots[index].productId,
                              availableSVAs: getAvailableSVAs(index).length
                            });
                          }, 100);
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              Nenhum plano disponível
                            </div>
                          ) : (
                            availableProducts.map((product) => (
                              <SelectItem key={`product-${index}-${product.entryIndex}`} value={product.id}>
                                {product.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {availableProducts.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Todos os planos já foram atribuídos
                        </p>
                      )}
                    </div>

                    {/* Operadora Atual */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Operadora Atual</Label>
                      <Select
                        value={currentSlot.operadoraAtual || undefined}
                        onValueChange={(value) => updateSlot(index, "operadoraAtual", value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a operadora atual" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERADORAS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SVAs - Múltiplos (opcionais) */}
                    {currentSlot.productId && availableSVAs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-700">Serviços Adicionais (Opcionais)</Label>
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {availableSVAs.length} disponível(is)
                          </span>
                        </div>
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                          {availableSVAs.map((sva, svaIdx) => (
                            <div key={`${sva.id}-${svaIdx}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sva-${index}-${sva.id}-${svaIdx}`}
                                checked={currentSlot.svas?.includes(sva.id) || false}
                                onCheckedChange={() => {
                                  console.log("🎯 Toggle SVA:", sva.id, sva.nome);
                                  toggleSVA(index, sva.id);
                                }}
                                disabled={!canEdit}
                              />
                              <label
                                htmlFor={`sva-${index}-${sva.id}-${svaIdx}`}
                                className="text-sm cursor-pointer hover:text-indigo-600"
                              >
                                {sva.nome}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação */}
                    {canEdit && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => {
                            // Validação antes de salvar
                            if (!currentSlot.numero || !isValidPhone(currentSlot.numero)) {
                              toast({
                                title: "Número inválido",
                                description: "Digite um número de telefone válido com 10 ou 11 dígitos",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (!currentSlot.productId) {
                              toast({
                                title: "Produto não selecionado",
                                description: "Selecione um produto antes de salvar",
                                variant: "destructive",
                              });
                              return;
                            }
                            handleSaveSlot(index);
                          }}
                          disabled={createLineMutation.isPending || updateLineMutation.isPending}
                          className="flex-1"
                        >
                          {createLineMutation.isPending || updateLineMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar Linha
                        </Button>
                        {currentSlot.filled && (
                          <Button
                            variant="outline"
                            onClick={() => setEditingSlot(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* MODO VISUALIZAÇÃO - LINHA PREENCHIDA */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Número</Label>
                          <p className="text-lg font-semibold text-gray-900">{currentSlot.numero}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Plano Contratado</Label>
                          <p className="text-lg font-semibold text-blue-600">
                            {summary.produtosDisponiveis.find(p => p.id === currentSlot.productId)?.nome || currentSlot.productId}
                          </p>
                        </div>
                      </div>
                      
                      {currentSlot.operadoraAtual && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Operadora Atual</Label>
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm">
                            {OPERADORAS.find(o => o.value === currentSlot.operadoraAtual)?.label || currentSlot.operadoraAtual}
                          </div>
                        </div>
                      )}
                      
                      {currentSlot.svas && currentSlot.svas.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Serviços Adicionais</Label>
                          <div className="flex flex-wrap gap-2">
                            {currentSlot.svas.map((svaId: string) => {
                              const sva = summary.svasDisponiveis.find(s => s.id === svaId);
                              return (
                                <span
                                  key={svaId}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium shadow-sm"
                                >
                                  <Check className="h-3 w-3 mr-1.5" />
                                  {sva?.nome || svaId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Botões Editar e Remover - Design Aprimorado */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(`✏️ Editando Slot ${index}`);
                          console.log(`   Estado do slot:`, currentSlot);
                          console.log(`   ProductId:`, currentSlot.productId);
                          console.log(`   Saved:`, currentSlot.saved);
                          setEditingSlot(index);
                        }}
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar Linha
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSlot(index)}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                        disabled={deleteLineMutation.isPending}
                      >
                        {deleteLineMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer com ações */}
      {onClose && (
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
