import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface AvailableSVA {
  id: string;
  nome: string;
  quantidadeDisponivel: number;
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
  const [slotBackup, setSlotBackup] = useState<any>(null); // Backup para reverter em caso de erro
  const [showResumo, setShowResumo] = useState(false);
  const [resumoFinalShown, setResumoFinalShown] = useState(false);

  // Buscar dados do pedido para verificar status
  const { data: orderData } = useQuery({
    queryKey: [`/api/ecommerce/customer/orders`],
    refetchInterval: 3000,
  });
  
  const currentOrder = useMemo(() => {
    return orderData?.orders?.find((o: any) => o.id === orderId);
  }, [orderData, orderId]);
  
  const isEmAnalise = useMemo(() => {
    return currentOrder?.etapa === "em_analise" || currentOrder?.etapa === "ajuste_solicitado";
  }, [currentOrder?.etapa]);
  
  const isAjusteSolicitado = useMemo(() => {
    return currentOrder?.etapa === "ajuste_solicitado";
  }, [currentOrder?.etapa]);
  
  const canEdit = useMemo(() => {
    // Pode editar se NÃO estiver em análise OU se for ajuste solicitado (liberado para edição)
    return currentOrder?.etapa !== "em_analise";
  }, [currentOrder?.etapa]);
  
  // Log para debug
  console.log('🔍 DEBUG STATUS:', {
    orderId,
    hasOrderData: !!orderData,
    totalOrders: orderData?.orders?.length,
    currentOrder: currentOrder ? {
      id: currentOrder.id,
      etapa: currentOrder.etapa
    } : null,
    isEmAnalise,
    canEdit
  });

  // Buscar resumo do pedido
  const { data: summary, isLoading: loadingSummary } = useQuery<any>({
    queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
  
  // Forçar modo visualização quando pedido está em análise
  useEffect(() => {
    if (isEmAnalise && slots.length > 0) {
      console.log('🔒 Pedido em análise - bloqueando edição de todos os slots');
      setEditingSlot(null); // Sair do modo edição
      setSlots(prevSlots => prevSlots.map(slot => ({
        ...slot,
        isEditing: false // Forçar todos para modo visualização
      })));
    }
  }, [isEmAnalise, slots.length]);
  
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
      console.log('   Produtos disponíveis:', summary.produtosDisponiveis?.length);
      
      if (summary.totalLinhasContratadas === 0) {
        console.error('❌ PROBLEMA: totalLinhasContratadas é ZERO!');
        console.error('   Isso significa que não há produtos no pedido.');
        console.error('   Verifique se os orderItems existem no banco de dados.');
      }
      
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
      
      // Adicionar slots vazios para completar o total contratado
      // Sempre garantir que tenhamos slots até o total de linhas contratadas
      const totalSlotsNeeded = summary.totalLinhasContratadas;
      const currentSlotsCount = newSlots.length;
      const emptySlotsNeeded = totalSlotsNeeded - currentSlotsCount;
      
      console.log(`  🆕 Criando ${emptySlotsNeeded} slots vazios (Total: ${totalSlotsNeeded}, Preenchidos: ${currentSlotsCount})`);
      
      if (emptySlotsNeeded < 0) {
        console.error('❌ PROBLEMA: emptySlotsNeeded é negativo!', {
          totalSlotsNeeded,
          currentSlotsCount,
          emptySlotsNeeded
        });
      }
      
      for (let i = 0; i < emptySlotsNeeded; i++) {
        // Só o primeiro slot vazio fica habilitado para edição
        const isFirstEmpty = i === 0;
        newSlots.push({
          id: `new-${i}`,
          filled: false,
          saved: false,
          isEditing: isFirstEmpty, // Apenas o primeiro slot novo fica em edição
          editing: false,
          numero: "",
          productId: "",
          operadoraAtual: "",
          svas: [],
          observacoes: "",
          bloqueado: !isFirstEmpty, // Outros slots ficam bloqueados
        });
      }
      
      console.log(`✅ Total de slots criados: ${newSlots.length}`);
      
      if (newSlots.length === 0) {
        console.error('❌ PROBLEMA CRÍTICO: Nenhum slot foi criado!');
        console.error('   Summary completo:', JSON.stringify(summary, null, 2));
      }
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/customer/orders"] });
      
      // Limpar backup após sucesso
      setSlotBackup(null);
      
      // Encontrar o slot e marcar como saved
      const slotIndex = slots.findIndex(s => 
        s.numero === variables.numero && !s.saved
      );
      
      if (slotIndex !== -1) {
        // Atualizar slots de forma imutável
        setSlots(prevSlots => {
          const newSlots = [...prevSlots];
          
          // Marcar slot atual como salvo
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            id: data.id,
            saved: true,
            isEditing: false,
            filled: true,
          };
          
          // Desbloquear próximo slot vazio
          const nextEmptyIndex = newSlots.findIndex((s, i) => 
            i > slotIndex && !s.saved && !s.filled
          );
          
          if (nextEmptyIndex !== -1 && newSlots[nextEmptyIndex].bloqueado) {
            newSlots[nextEmptyIndex] = {
              ...newSlots[nextEmptyIndex],
              bloqueado: false,
              isEditing: true,
            };
          }
          
          return newSlots;
        });
      }
      
      const linhasPreenchidas = slots.filter(s => s.saved).length + 1;
      const totalLinhas = slots.length;
      
      // Verificar se completou todas as linhas
      if (linhasPreenchidas >= totalLinhas) {
        // Abrir modal de resumo
        setResumoFinalShown(true);
        setTimeout(() => setShowResumo(true), 500);
        
        toast({
          title: "Todas as linhas preenchidas!",
          description: "Confira o resumo do seu pedido.",
        });
      } else {
        toast({
          title: "Linha salva com sucesso!",
          description: `Progresso: ${linhasPreenchidas}/${totalLinhas}. Próxima linha liberada!`,
        });
      }
    },
    onError: (error: any, variables) => {
      console.log(`❌ Erro ao criar linha:`, error.message);
      
      // Reverter para o estado anterior se houver backup
      if (slotBackup && slotBackup.backupIndex !== undefined) {
        const slotIndex = slotBackup.backupIndex;
        
        console.log(`🔄 Revertendo Slot ${slotIndex} para estado anterior:`, slotBackup);
        
        // Restaurar todo o estado anterior
        setSlots(prevSlots => {
          const newSlots = [...prevSlots];
          // Remover o backupIndex antes de restaurar
          const { backupIndex, ...restoredData } = slotBackup;
          newSlots[slotIndex] = restoredData;
          return newSlots;
        });
        
        setSlotBackup(null);
      }
      
      toast({
        title: "Erro ao salvar linha",
        description: error.message || "Ocorreu um erro ao salvar a linha",
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
      
      // Limpar backup após sucesso
      setSlotBackup(null);
      
      // Marcar o slot como saved e sair do modo de edição
      const slotIndex = slots.findIndex(s => s.id === variables.lineId);
      if (slotIndex !== -1) {
        updateSlot(slotIndex, "isEditing", false);
      }
      
      // Verificar se todas as linhas estão salvas
      const allSaved = slots.every(s => s.saved || !s.filled);
      
      // Debug: verificar condições
      console.log('🔍 Update Success - Verificando se deve mostrar popup:', {
        resumoFinalShown,
        isAjusteSolicitado,
        etapa: currentOrder?.etapa,
        allSaved,
        slots: slots.map(s => ({ saved: s.saved, filled: s.filled }))
      });
      
      // Mostrar popup se:
      // 1. Estava em ajuste_solicitado (edição após análise) OU
      // 2. Já havia mostrado o resumo antes (edição após finalização) OU
      // 3. SEMPRE que atualizar e todas as linhas estiverem preenchidas
      const shouldShowResumo = isAjusteSolicitado || resumoFinalShown || allSaved;
      
      console.log('✅ Vai mostrar resumo?', { shouldShowResumo, allSaved });
      
      if (shouldShowResumo && allSaved) {
        setTimeout(() => {
          console.log('🎯 Abrindo popup de resumo');
          setShowResumo(true);
        }, 500);
      }
      
      toast({
        title: "Linha atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any, variables) => {
      console.log(`❌ Erro ao atualizar linha:`, error.message);
      
      // Reverter para o estado anterior se houver backup
      if (slotBackup && slotBackup.backupIndex !== undefined) {
        const slotIndex = slotBackup.backupIndex;
        
        console.log(`🔄 Revertendo Slot ${slotIndex} para estado anterior:`, slotBackup);
        
        // Restaurar todo o estado anterior
        setSlots(prevSlots => {
          const newSlots = [...prevSlots];
          // Remover o backupIndex antes de restaurar
          const { backupIndex, ...restoredData } = slotBackup;
          newSlots[slotIndex] = restoredData;
          return newSlots;
        });
        
        setSlotBackup(null);
      }
      
      toast({
        title: "Erro ao atualizar linha",
        description: error.message || "Ocorreu um erro ao atualizar a linha",
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
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/customer/orders"] });
      
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
    
    // Produto NÃO é obrigatório (algumas linhas podem não ter produto associado)
    if (!slot.productId) {
      console.log(`⚠️ Salvando linha ${index} sem produto (apenas portabilidade)`);
    }

    // Fazer backup ANTES de salvar para poder reverter em caso de erro
    const backupData = { ...slot, backupIndex: index };
    setSlotBackup(backupData);
    console.log(`📦 Backup criado para Slot ${index}:`, backupData);

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
    
    // Verificar se já tem este SVA selecionado
    const hasSVA = currentSvas.includes(svaId);
    
    if (hasSVA) {
      // Remover: tirar APENAS UMA ocorrência
      const firstIndex = currentSvas.indexOf(svaId);
      const newSvas = [...currentSvas.slice(0, firstIndex), ...currentSvas.slice(firstIndex + 1)];
      console.log(`🎯 SLOT ${index} - REMOVENDO SVA:`, svaId);
      updateSlot(index, "svas", newSvas);
      console.log(`✅ SVAs do Slot ${index}:`, newSvas);
    } else {
      // Verificar se já tem este SVA na linha (impedir duplicatas na mesma linha)
      const countInLine = currentSvas.filter(id => id === svaId).length;
      
      if (countInLine > 0) {
        toast({
          title: "SVA já selecionado",
          description: "Cada linha pode ter apenas 1 unidade de cada tipo de serviço.",
          variant: "destructive",
        });
        console.log(`❌ SLOT ${index} - SVA ${svaId} já está na linha`);
        return;
      }
      
      // Adicionar: incluir APENAS UMA unidade
      const newSvas = [...currentSvas, svaId];
      console.log(`🎯 SLOT ${index} - ADICIONANDO SVA:`, svaId);
      updateSlot(index, "svas", newSvas);
      console.log(`✅ SVAs do Slot ${index}:`, newSvas);
    }
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

  const getAvailableSVAs = (index: number): AvailableSVA[] => {
    if (!summary) {
      console.log(`⚠️ Summary não disponível para Slot ${index}`);
      return [];
    }
    
    const slot = slots[index];
    if (!slot.productId) {
      console.log(`⚠️ Slot ${index} não tem produto selecionado`);
      return [];
    }
    
    // Verificar se é a última linha (todas as anteriores já foram salvas)
    const isLastLine = index === slots.length - 1 || 
                       slots.slice(index + 1).every(s => !s.saved && !s.filled);
    
    console.log(`🔍 getAvailableSVAs para Slot ${index}:`, {
      productId: slot.productId,
      svasDisponiveis: summary.svasDisponiveis?.length,
      isLastLine,
    });
    
    // Criar mapa de quantidades disponíveis de cada SVA
    // IMPORTANTE: Se o mesmo SVA aparece múltiplas vezes, SOMAR as quantidades
    const svaQuantities = new Map<string, { nome: string; total: number; usado: number }>();
    
    summary.svasDisponiveis.forEach((sva: SVA) => {
      if (svaQuantities.has(sva.id)) {
        // SVA já existe, SOMAR a quantidade
        const existing = svaQuantities.get(sva.id)!;
        existing.total += (sva.quantidade || 1);
      } else {
        // SVA novo, adicionar
        svaQuantities.set(sva.id, {
          nome: sva.nome,
          total: sva.quantidade || 1,
          usado: 0,
        });
      }
    });
    
    console.log(`📊 Slot ${index} - SVAs totais no pedido:`, 
      Array.from(svaQuantities.entries()).map(([id, data]) => `${data.nome}: ${data.total}x`)
    );
    
    // Contar quantos de cada SVA já foram SALVOS em outras linhas
    // NÃO contar o slot atual (para permitir edição)
    // NÃO contar slots que ainda não foram salvos
    slots.forEach((s, i) => {
      // Ignorar slot atual e slots não salvos
      if (i !== index && s.saved && s.svas && Array.isArray(s.svas)) {
        s.svas.forEach((svaId: string) => {
          const svaData = svaQuantities.get(svaId);
          if (svaData) {
            svaData.usado++;
          }
        });
      }
    });
    
    // Retornar SVAs baseado na regra:
    // - ÚLTIMA LINHA: Mostra TODOS os SVAs que ainda têm quantidade disponível (mesmo que seja 0, para avisar)
    // - OUTRAS LINHAS: Mostra apenas SVAs que ainda têm quantidade > 0
    const available: Array<{ id: string; nome: string; quantidadeDisponivel: number }> = [];
    
    svaQuantities.forEach((data, svaId) => {
      const disponiveis = data.total - data.usado;
      
      if (isLastLine) {
        // ÚLTIMA LINHA: Mostrar TODOS os SVAs, mesmo os que já foram todos usados
        available.push({
          id: svaId,
          nome: data.nome,
          quantidadeDisponivel: disponiveis,
        });
      } else {
        // OUTRAS LINHAS: Mostrar apenas os que têm quantidade disponível
        if (disponiveis > 0) {
          available.push({
            id: svaId,
            nome: data.nome,
            quantidadeDisponivel: disponiveis,
          });
        }
      }
    });
    
    console.log(`✅ Slot ${index} - SVAs disponíveis:`, available.map(s => `${s.nome} (${s.quantidadeDisponivel}x)`));
    
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
    <div className="space-y-4">
      {/* Aviso quando pedido está em análise com botão Solicitar Alteração */}
      {currentOrder?.etapa === "em_analise" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Pedido em Análise</p>
                  <p className="text-xs text-blue-700">As informações estão bloqueadas para edição. Para solicitar alterações, clique no botão ao lado.</p>
                </div>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    // Solicitar alteração - muda status para ajuste_solicitado
                    const res = await fetch(`/api/ecommerce/orders/${orderId}/status`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ status: "ajuste_solicitado" }),
                    });
                    
                    if (!res.ok) {
                      throw new Error("Erro ao solicitar alteração");
                    }
                    
                    toast({
                      title: "Solicitação enviada!",
                      description: "Sua solicitação de alteração foi enviada para análise.",
                    });
                    
                    // Refetch orders para atualizar status
                    queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/customer/orders`] });
                  } catch (error: any) {
                    toast({
                      title: "Erro ao solicitar alteração",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Solicitar Alteração
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Aviso quando ajuste foi solicitado e liberado para edição */}
      {isAjusteSolicitado && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Pedido Liberado para Ajustes</p>
                  <p className="text-xs text-green-700">Faça as alterações necessárias e clique em "Finalizar Alterações" quando terminar.</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  // Abrir popup de resumo para reenviar
                  setShowResumo(true);
                }}
                className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Finalizar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mensagem Informativa Inicial */}
      {summary.totalLinhasPreenchidas === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Vamos preencher as linhas de portabilidade
                </h3>
                <p className="text-sm text-blue-700">
                  Você tem <strong>{summary.totalLinhasContratadas} {summary.totalLinhasContratadas === 1 ? 'linha' : 'linhas'}</strong> para preencher. 
                  A cada linha preenchida e salva, o sistema libera automaticamente a próxima linha. 
                  Isso garante que os dados sejam preenchidos de forma organizada e sem erros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Header com Resumo do Pedido - Mais Discreto */}
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Linhas de Portabilidade</h2>
              <p className="text-sm text-gray-600">Complete as informações necessárias</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-900">{summary.progresso}%</div>
              <p className="text-xs text-gray-500 mt-0.5">concluído</p>
            </div>
          </div>
          
          {/* Barra de progresso simples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                {summary.totalLinhasPreenchidas} de {summary.totalLinhasContratadas} linhas
              </span>
              {summary.progresso === 100 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completo
                </span>
              )}
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${summary.progresso}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards de Linhas - Mais Compacto */}
      <div className="grid gap-3">
        {slots.map((slot, index) => {
          // Se o slot está bloqueado, mostrar card desabilitado
          if (slot.bloqueado) {
            return (
              <Card key={`slot-${index}-blocked`} className="border-gray-200 bg-gray-50 opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-400 border border-gray-300">
                      <span>{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Linha {index + 1}</h3>
                      <p className="text-xs text-gray-400">Aguardando preenchimento das linhas anteriores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          const isEditing = editingSlot === index || (!slot.filled && !slot.editing && !slot.bloqueado);
          const canEdit = !readOnly && (isEditing || slot.status === "inicial" || !slot.filled);
          
          const currentSlot = slots[index];
          const availableProducts = getAvailableProducts(index);
          const availableSVAs = getAvailableSVAs(index);
          
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
                  ? "border-green-500 bg-white" 
                  : isEditing
                  ? "border-blue-500 bg-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              <CardContent className="p-4">
                {/* Header do Card da Linha - Compacto */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Indicador de status simples */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      currentSlot.saved 
                        ? "bg-green-500 text-white" 
                        : isEditing
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-500 border border-gray-300"
                    }`}>
                      {currentSlot.saved ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {currentSlot.numero || `Linha ${index + 1}`}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {currentSlot.saved 
                          ? "Preenchida" 
                          : isEditing 
                          ? "Em edição" 
                          : "Pendente"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Status badge discreto */}
                  {currentSlot.saved && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      OK
                    </span>
                  )}
                </div>

                {!currentSlot.saved || isEditing ? (
                  <>
                    {/* MODO DE EDIÇÃO - Formulário Limpo */}
                    <div className="space-y-4">
                    {/* Número */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <Label className="text-xs font-medium text-gray-800 mb-1.5 block">
                        Número da Linha *
                      </Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={currentSlot.numero}
                        onChange={(e) => {
                          // Fazer backup na primeira mudança se ainda não houver
                          if (!slotBackup && !currentSlot.saved) {
                            setSlotBackup({ ...currentSlot });
                          }
                          const formatted = formatPhone(e.target.value);
                          updateSlot(index, "numero", formatted);
                        }}
                        disabled={!canEdit}
                        className="text-sm bg-white"
                      />
                      <p className="text-xs text-gray-600 mt-1">Digite o número que será portado</p>
                    </div>

                    {/* Plano */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-medium text-gray-800">
                          Plano Contratado *
                        </Label>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {availableProducts.length} disponível
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
                        <SelectTrigger className="bg-white">
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
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Todos os planos já foram atribuídos
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">Escolha um dos planos contratados</p>
                    </div>

                    {/* Operadora Atual */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <Label className="text-xs font-medium text-gray-800 mb-1.5 block">
                        Operadora Atual
                      </Label>
                      <Select
                        value={currentSlot.operadoraAtual || undefined}
                        onValueChange={(value) => updateSlot(index, "operadoraAtual", value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="bg-white">
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
                      <p className="text-xs text-gray-600 mt-1">Operadora da qual você está portando</p>
                    </div>

                    {/* SVAs - Múltiplos (opcionais) */}
                    {currentSlot.productId && availableSVAs.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-gray-800">
                            Serviços Adicionais
                          </Label>
                          <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-300">
                            {currentSlot.svas?.length || 0} / {availableSVAs.filter(s => s.quantidadeDisponivel > 0).length}
                          </span>
                        </div>
                        
                        {/* Aviso sobre regra de 1 por linha */}
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-700">
                            ℹ️ <strong>Importante:</strong> Cada linha pode ter apenas <strong>1 unidade</strong> de cada tipo de serviço.
                          </p>
                        </div>
                        
                        {/* Aviso se for a última linha */}
                        {(() => {
                          const isLastLine = index === slots.length - 1 || 
                                           slots.slice(index + 1).every(s => !s.saved && !s.filled);
                          const svasRestantes = availableSVAs.filter(s => s.quantidadeDisponivel > 0);
                          
                          if (isLastLine && svasRestantes.length > 0) {
                            return (
                              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-yellow-800">
                                  ⚠️ <strong>Última linha!</strong> Você ainda tem {svasRestantes.length} serviço(s) disponível(is) que não foram utilizados.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <p className="text-xs text-gray-600 mb-2">Selecione os serviços extras para esta linha</p>
                        <div className="space-y-2">
                          {availableSVAs.map((sva) => {
                            // Verificar se este SVA está selecionado NESTE slot
                            const isChecked = currentSlot.svas?.includes(sva.id) || false;
                            const isDisabled = !canEdit || sva.quantidadeDisponivel === 0;
                            
                            return (
                            <label 
                              key={sva.id}
                              className={`flex items-center justify-between p-2 rounded border transition-colors ${
                                isDisabled 
                                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                                  : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`sva-${index}-${sva.id}`}
                                  checked={isChecked}
                                  onCheckedChange={() => {
                                    if (!isDisabled) {
                                      console.log("🎯 Toggle SVA:", sva.id, sva.nome);
                                      toggleSVA(index, sva.id);
                                    }
                                  }}
                                  disabled={isDisabled}
                                />
                                <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                                  {sva.nome}
                                  {sva.quantidadeDisponivel === 0 && (
                                    <span className="ml-1 text-xs text-red-600">(Esgotado)</span>
                                  )}
                                </span>
                              </div>
                              {sva.quantidadeDisponivel > 1 && (
                                <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">
                                  {sva.quantidadeDisponivel} disponíveis
                                </span>
                              )}
                            </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação - alinhados à esquerda */}
                    {canEdit && (
                      <div className="flex justify-start gap-2 pt-3 border-t border-gray-200">
                        {currentSlot.filled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Restaurar estado do backup ao cancelar
                              if (slotBackup && slotBackup.backupIndex !== undefined) {
                                const slotIndex = slotBackup.backupIndex;
                                setSlots(prevSlots => {
                                  const newSlots = [...prevSlots];
                                  // Remover backupIndex antes de restaurar
                                  const { backupIndex, ...restoredData } = slotBackup;
                                  newSlots[slotIndex] = restoredData;
                                  return newSlots;
                                });
                                setSlotBackup(null);
                              }
                              setEditingSlot(null);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
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
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createLineMutation.isPending || updateLineMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* MODO VISUALIZAÇÃO - Card Resumido e Moderno */}
                    <div className="space-y-3">
                      {/* Informações principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <Label className="text-xs text-gray-700 font-medium mb-1 block">
                            Número
                          </Label>
                          <p className="text-sm font-medium text-gray-900">{currentSlot.numero}</p>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <Label className="text-xs text-blue-600 font-medium mb-1 block">
                            Plano
                          </Label>
                          <p className="text-sm font-medium text-blue-700">
                            {summary.produtosDisponiveis.find(p => p.id === currentSlot.productId)?.nome || currentSlot.productId}
                          </p>
                        </div>
                      </div>
                      
                      {currentSlot.operadoraAtual && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <Label className="text-xs text-gray-700 font-medium mb-1 block">
                            Operadora de Origem
                          </Label>
                          <p className="text-sm font-medium text-gray-700">
                            {OPERADORAS.find(o => o.value === currentSlot.operadoraAtual)?.label || currentSlot.operadoraAtual}
                          </p>
                        </div>
                      )}
                      
                      {currentSlot.svas && currentSlot.svas.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <Label className="text-xs text-gray-700 font-medium mb-2 block">
                            Serviços Adicionais
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {currentSlot.svas.map((svaId: string) => {
                              const sva = summary.svasDisponiveis.find(s => s.id === svaId);
                              return (
                                <span
                                  key={svaId}
                                  className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium border border-green-200"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {sva?.nome || svaId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Botões de ação */}
                    {(() => {
                      // Verificar status diretamente aqui para evitar closure
                      const currentOrderNow = orderData?.orders?.find((o: any) => o.id === orderId);
                      const isEmAnaliseNow = currentOrderNow?.etapa === "em_analise" || currentOrderNow?.etapa === "ajuste_solicitado";
                      const canEditNow = !isEmAnaliseNow;
                      
                      const shouldShow = canEditNow && currentSlot.filled && !currentSlot.isEditing;
                      
                      console.log(`🔍 Slot ${index} - Botões:`, {
                        canEdit: canEditNow,
                        etapa: currentOrderNow?.etapa,
                        isEmAnalise: isEmAnaliseNow,
                        filled: currentSlot.filled,
                        isEditing: currentSlot.isEditing,
                        shouldShow
                      });
                      
                      if (!shouldShow) return null;
                      
                      return (
                        <div className="flex justify-start gap-2 pt-3 border-t border-gray-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log(`✏️ Editando Slot ${index}`);
                              // Fazer backup ANTES de permitir edição
                              setSlotBackup({ ...currentSlot, backupIndex: index });
                              setEditingSlot(index);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSlot(index)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-500"
                            disabled={deleteLineMutation.isPending}
                          >
                            {deleteLineMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remover
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer com ações */}
      {onClose && currentOrder?.etapa !== "em_analise" && !isAjusteSolicitado && (
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              // Mostrar resumo antes de fechar
              setShowResumo(true);
            }}
          >
            Fechar
          </Button>
        </div>
      )}
      
      {/* Modal de Resumo - Design Limpo */}
      <Dialog open={showResumo} onOpenChange={setShowResumo}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resumo do Pedido
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Confira todas as informações das linhas cadastradas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Estatísticas - Cards Limpos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900">{summary?.totalLinhasPreenchidas || 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Linhas Cadastradas</div>
                  </div>
                  <Phone className="h-7 w-7 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {slots.filter(s => s.saved).reduce((acc, s) => acc + (s.svas?.length || 0), 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">SVAs Utilizados</div>
                  </div>
                  <CheckCircle2 className="h-7 w-7 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900">{summary?.progresso || 0}%</div>
                    <div className="text-xs text-gray-500 mt-0.5">Progresso</div>
                  </div>
                  <CheckCircle2 className="h-7 w-7 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Aviso de SVAs não utilizados - Design Aprimorado */}
            {summary && (() => {
              const svasDisponiveis = summary.svasDisponiveis || [];
              const totalSVAsDisponiveis = svasDisponiveis.reduce((acc: number, sva: any) => acc + (sva.quantidade || 1), 0);
              const totalSVAsUsados = slots.filter(s => s.saved).reduce((acc, s) => acc + (s.svas?.length || 0), 0);
              const svasNaoUsados = totalSVAsDisponiveis - totalSVAsUsados;
              
              if (svasNaoUsados > 0) {
                // Listar quais SVAs estão disponíveis mas não foram usados
                const svasUsadosCount = new Map<string, number>();
                slots.filter(s => s.saved).forEach(s => {
                  if (s.svas) {
                    s.svas.forEach((id: string) => {
                      svasUsadosCount.set(id, (svasUsadosCount.get(id) || 0) + 1);
                    });
                  }
                });
                
                const svasNaoUsadosDetalhes: Array<{nome: string; disponiveis: number}> = [];
                svasDisponiveis.forEach((sva: any) => {
                  const usado = svasUsadosCount.get(sva.id) || 0;
                  const total = sva.quantidade || 1;
                  const restante = total - usado;
                  if (restante > 0) {
                    svasNaoUsadosDetalhes.push({ nome: sva.nome, disponiveis: restante });
                  }
                });
                
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">SVAs Disponíveis Não Utilizados</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Você possui <strong>{svasNaoUsados} serviço(s) adicional(is)</strong> disponíveis:
                        </p>
                        <ul className="space-y-1">
                          {svasNaoUsadosDetalhes.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                              <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                              <strong>{item.nome}</strong> - {item.disponiveis} disponível(is)
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                          Você pode voltar e adicionar estes serviços às linhas.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Lista de Linhas - Cards Limpos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Linhas Cadastradas</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {slots.filter(s => s.saved).map((slot, index) => {
                  const produto = summary?.produtosDisponiveis?.find((p: any) => p.id === slot.productId);
                  return (
                    <Card key={slot.id} className="border border-gray-200 bg-white">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {/* Header da Linha */}
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">Linha {index + 1}</div>
                              <div className="text-sm font-semibold text-gray-900">{slot.numero}</div>
                            </div>
                          </div>
                          
                          {/* Informações */}
                          <div className="space-y-1.5">
                            {slot.operadoraAtual && (
                              <div className="flex items-start gap-2">
                                <div className="text-xs text-gray-500 min-w-[80px]">Operadora:</div>
                                <div className="text-xs text-gray-700">{slot.operadoraAtual}</div>
                              </div>
                            )}
                            
                            {produto && (
                              <div className="flex items-start gap-2">
                                <div className="text-xs text-gray-500 min-w-[80px]">Plano:</div>
                                <div className="text-xs text-gray-700">{produto.nome}</div>
                              </div>
                            )}
                            
                            {slot.svas && slot.svas.length > 0 && (
                              <div className="pt-1">
                                <div className="text-xs text-gray-500 mb-1.5">Serviços:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {slot.svas.map((svaId: string) => {
                                    const sva = summary?.svasDisponiveis?.find((s: any) => s.id === svaId);
                                    return (
                                      <span
                                        key={svaId}
                                        className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                                        {sva?.nome || svaId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {slot.observacoes && (
                              <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                                <div className="text-xs text-gray-500 mb-0.5">Observações:</div>
                                <p className="text-xs text-gray-600">{slot.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowResumo(false)}
              className="text-sm"
            >
              Voltar e Editar
            </Button>
            <Button 
              onClick={async () => {
                // Verificar SVAs não utilizados
                const svasDisponiveis = summary.svasDisponiveis || [];
                const totalSVAsDisponiveis = svasDisponiveis.reduce((acc: number, sva: any) => acc + (sva.quantidade || 1), 0);
                const totalSVAsUsados = slots.filter(s => s.saved).reduce((acc, s) => acc + (s.svas?.length || 0), 0);
                const svasNaoUsados = totalSVAsDisponiveis - totalSVAsUsados;
                
                if (svasNaoUsados > 0) {
                  toast({
                    title: "SVAs não utilizados",
                    description: `Você ainda tem ${svasNaoUsados} serviço(s) adicional(is) disponível(is). Volte e adicione-os às linhas antes de finalizar.`,
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  // Atualizar status do pedido para em_analise
                  const res = await fetch(`/api/ecommerce/orders/${orderId}/status`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: "em_analise" }),
                  });
                  
                  if (!res.ok) {
                    throw new Error("Erro ao atualizar status");
                  }
                  
                  setShowResumo(false);
                  if (onClose) onClose();
                  
                  toast({
                    title: "Pedido enviado para análise!",
                    description: "Seu pedido será analisado em breve.",
                  });
                } catch (error: any) {
                  toast({
                    title: "Erro ao finalizar",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
              disabled={(() => {
                const svasDisponiveis = summary?.svasDisponiveis || [];
                const totalSVAsDisponiveis = svasDisponiveis.reduce((acc: number, sva: any) => acc + (sva.quantidade || 1), 0);
                const totalSVAsUsados = slots.filter(s => s.saved).reduce((acc, s) => acc + (s.svas?.length || 0), 0);
                return totalSVAsDisponiveis > totalSVAsUsados;
              })()}
            >
              {(() => {
                const svasDisponiveis = summary?.svasDisponiveis || [];
                const totalSVAsDisponiveis = svasDisponiveis.reduce((acc: number, sva: any) => acc + (sva.quantidade || 1), 0);
                const totalSVAsUsados = slots.filter(s => s.saved).reduce((acc, s) => acc + (s.svas?.length || 0), 0);
                const svasNaoUsados = totalSVAsDisponiveis - totalSVAsUsados;
                
                if (svasNaoUsados > 0) {
                  return `Adicione os ${svasNaoUsados} SVA(s) restante(s)`;
                }
                
                // Texto diferente se for reenvio após ajuste
                if (isAjusteSolicitado) {
                  return "Reenviar para Análise";
                }
                
                return "Confirmar e Finalizar";
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
