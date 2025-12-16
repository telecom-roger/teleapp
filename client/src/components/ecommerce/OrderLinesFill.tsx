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
  Check, 
  X, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface OrderLinesFillProps {
  orderId: string;
  onClose?: () => void;
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

export function OrderLinesFill({ orderId, onClose }: OrderLinesFillProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [slots, setSlots] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  // Buscar resumo do pedido
  const { data: summary, isLoading: loadingSummary } = useQuery<any>({
    queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Inicializar slots baseado no resumo
  useEffect(() => {
    if (summary) {
      const newSlots: any[] = [];
      
      // Adicionar slots para linhas já preenchidas
      summary.linhas.forEach((line: OrderLine) => {
        newSlots.push({
          id: line.id,
          filled: true,
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
      for (let i = 0; i < remaining; i++) {
        newSlots.push({
          id: `new-${i}`,
          filled: false,
          editing: false,
          numero: "",
          productId: "",
          operadoraAtual: "",
          svas: [],
          observacoes: "",
        });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
      toast({
        title: "Linha salva com sucesso!",
        description: "Os dados da linha foram registrados.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
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
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ecommerce/order-lines/${orderId}/summary`] });
      toast({
        title: "Linha removida",
        description: "A linha foi excluída com sucesso.",
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

  const handleSaveSlot = (index: number) => {
    const slot = slots[index];
    
    if (!slot.numero || !slot.productId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o número e selecione um plano.",
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
    
    if (slot.filled && slot.id && !slot.id.startsWith("new-")) {
      deleteLineMutation.mutate(slot.id);
    }
  };

  const updateSlot = (index: number, field: string, value: any) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const toggleSVA = (index: number, svaId: string) => {
    const slot = slots[index];
    const currentSvas = slot.svas || [];
    const newSvas = currentSvas.includes(svaId)
      ? currentSvas.filter((id: string) => id !== svaId)
      : [...currentSvas, svaId];
    
    updateSlot(index, "svas", newSvas);
  };

  // Filtrar produtos/SVAs já usados
  const getAvailableProducts = (currentIndex: number) => {
    if (!summary) return [];
    
    const usedProductIds = slots
      .filter((s, i) => i !== currentIndex && s.filled && s.productId)
      .map(s => s.productId);
    
    return summary.produtosDisponiveis.filter(
      (p: Product) => !usedProductIds.includes(p.id)
    );
  };

  const getAvailableSVAs = (index: number) => {
    if (!summary) return [];
    
    const slot = slots[index];
    if (!slot.productId) return [];
    
    // Buscar produto selecionado
    const product = summary.produtosDisponiveis.find(
      (p: Product) => p.id === slot.productId
    );
    
    if (!product || !product.svasUpsell || product.svasUpsell.length === 0) {
      return [];
    }
    
    // Retornar apenas SVAs compatíveis com este plano
    return summary.svasDisponiveis.filter((sva: SVA) =>
      product.svasUpsell.includes(sva.id)
    );
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
          const canEdit = slot.status === "inicial" || !slot.filled;
          const availableProducts = getAvailableProducts(index);
          const availableSVAs = getAvailableSVAs(index);

          return (
            <Card key={slot.id} className={slot.filled ? "border-green-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {slot.filled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    Linha {index + 1}
                  </CardTitle>
                  
                  {slot.filled && (
                    <div className="flex gap-2">
                      {canEdit && !isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSlot(index)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSlot(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Número */}
                    <div>
                      <Label>Número da Linha *</Label>
                      <Input
                        placeholder="(99) 99999-9999"
                        value={slot.numero}
                        onChange={(e) => updateSlot(index, "numero", e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Plano */}
                    <div>
                      <Label>Plano *</Label>
                      <Select
                        value={slot.productId}
                        onValueChange={(value) => {
                          updateSlot(index, "productId", value);
                          updateSlot(index, "svas", []); // Limpar SVAs ao mudar plano
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product: Product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nome} - {product.operadora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operadora Atual */}
                    <div>
                      <Label>Operadora Atual</Label>
                      <Select
                        value={slot.operadoraAtual}
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

                    {/* SVAs */}
                    {availableSVAs.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Serviços Adicionais (SVAs)</Label>
                        <div className="space-y-2 border rounded-md p-3">
                          {availableSVAs.map((sva: SVA) => (
                            <div key={sva.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sva-${index}-${sva.id}`}
                                checked={slot.svas.includes(sva.id)}
                                onCheckedChange={() => toggleSVA(index, sva.id)}
                                disabled={!canEdit}
                              />
                              <label
                                htmlFor={`sva-${index}-${sva.id}`}
                                className="text-sm cursor-pointer"
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
                          onClick={() => handleSaveSlot(index)}
                          disabled={createLineMutation.isPending || updateLineMutation.isPending}
                          className="flex-1"
                        >
                          {createLineMutation.isPending || updateLineMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                        {slot.filled && (
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
                  </>
                ) : (
                  // Visualização (não editável)
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Número:</span> {slot.numero}
                    </div>
                    {slot.operadoraAtual && (
                      <div>
                        <span className="font-semibold">Operadora Atual:</span>{" "}
                        {OPERADORAS.find(o => o.value === slot.operadoraAtual)?.label || slot.operadoraAtual}
                      </div>
                    )}
                    {slot.svas.length > 0 && (
                      <div>
                        <span className="font-semibold">SVAs:</span>{" "}
                        {slot.svas.length} selecionado(s)
                      </div>
                    )}
                  </div>
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
