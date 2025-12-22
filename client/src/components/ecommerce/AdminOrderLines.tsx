import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Phone, Check, X, Edit2, Trash2, Plus, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AdminOrderLinesProps {
  orderId: string;
}

export default function AdminOrderLines({ orderId }: AdminOrderLinesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [slots, setSlots] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  // Buscar sumário com progresso e produtos disponíveis
  const { data: summary, isLoading: loadingSummary } = useQuery<any>({
    queryKey: [`/api/app/order-lines/${orderId}/summary`],
    refetchInterval: 3000,
  });

  // Buscar linhas existentes
  const { data: lines, isLoading: loadingLines } = useQuery<any[]>({
    queryKey: [`/api/app/order-lines/${orderId}`],
    refetchInterval: 3000,
    staleTime: 0, // Sempre considerar dados como stale
    cacheTime: 0, // Não fazer cache
  });

  // Log para debug (comentado)
  // useEffect(() => {
  //   console.log('🔍 [ADMIN ORDER LINES] Summary:', summary);
  //   console.log('🔍 [ADMIN ORDER LINES] Lines RAW:', lines);
  //   if (lines && lines.length > 0) {
  //     lines.forEach((line, i) => console.log(`Linha ${i + 1}:`, line));
  //   }
  // }, [summary, lines]);

  // Atualizar slots quando dados mudarem
  useEffect(() => {
    if (summary && lines) {
      const filledSlots = lines.map((line) => ({
        id: line.id,
        filled: true,
        productId: line.productId,
        numero: line.numero,
        operadoraAtual: line.operadoraAtual || "",
        operadoraDestino: line.operadoraDestino || "",
        svas: line.svas || [],
        status: line.status,
        observacoes: line.observacoes || "",
        productNome: line.product?.nome || "Produto",
      }));

      const emptyCount = Math.max(0, summary.totalLinhasContratadas - lines.length);
      const emptySlots = Array.from({ length: emptyCount }, (_, i) => ({
        id: `empty-${i}`,
        filled: false,
        productId: "",
        numero: "",
        operadoraAtual: "",
        operadoraDestino: "",
        svas: [],
        status: "inicial",
        observacoes: "",
      }));

      setSlots([...filledSlots, ...emptySlots]);
    }
  }, [summary, lines]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/app/order-lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar linha");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}/summary`] });
      toast({
        title: "Linha criada",
        description: "Linha de portabilidade adicionada com sucesso",
      });
      setEditingSlot(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string; data: any }) => {
      const res = await fetch(`/api/app/order-lines/${lineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar linha");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}/summary`] });
      toast({
        title: "Linha atualizada",
        description: "Alterações salvas com sucesso",
      });
      setEditingSlot(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await fetch(`/api/app/order-lines/${lineId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao deletar linha");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/app/order-lines/${orderId}/summary`] });
      toast({
        title: "Linha removida",
        description: "Linha deletada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (index: number) => {
    const slot = slots[index];

    if (!slot.productId || !slot.numero) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o produto e o número da linha",
        variant: "destructive",
      });
      return;
    }

    if (slot.filled) {
      // Atualizar
      updateMutation.mutate({
        lineId: slot.id,
        data: {
          productId: slot.productId,
          numero: slot.numero,
          operadoraAtual: slot.operadoraAtual,
          operadoraDestino: slot.operadoraDestino,
          svas: slot.svas,
          status: slot.status,
          observacoes: slot.observacoes,
        },
      });
    } else {
      // Criar
      createMutation.mutate({
        orderId,
        productId: slot.productId,
        numero: slot.numero,
        operadoraAtual: slot.operadoraAtual,
        operadoraDestino: slot.operadoraDestino,
        svas: slot.svas,
        status: slot.status,
        observacoes: slot.observacoes,
      });
    }
  };

  const handleDelete = (lineId: string) => {
    if (confirm("Tem certeza que deseja remover esta linha?")) {
      deleteMutation.mutate(lineId);
    }
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSVAToggle = (index: number, svaId: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        const svas = slot.svas || [];
        const newSvas = svas.includes(svaId)
          ? svas.filter((id: string) => id !== svaId)
          : [...svas, svaId];
        return { ...slot, svas: newSvas };
      })
    );
  };

  // Produtos disponíveis excluindo os já usados em outros slots
  const getAvailableProducts = (currentIndex: number) => {
    if (!summary) return [];
    const usedProductIds = slots
      .filter((s, i) => i !== currentIndex && s.filled)
      .map((s) => s.productId);
    return summary.produtosDisponiveis.filter(
      (p: any) => !usedProductIds.includes(p.id)
    );
  };

  // SVAs disponíveis baseado no produto selecionado
  const getAvailableSVAs = (productId: string) => {
    if (!summary || !productId) return [];
    const product = summary.produtosDisponiveis.find((p: any) => p.id === productId);
    if (!product || !product.svasUpsell || product.svasUpsell.length === 0) {
      return [];
    }
    return summary.svasDisponiveis.filter((sva: any) =>
      product.svasUpsell.includes(sva.id)
    );
  };

  if (loadingSummary || loadingLines) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
        <p>Não foi possível carregar as informações</p>
      </div>
    );
  }

  const progresso = Math.round(
    (summary.totalLinhasPreenchidas / summary.totalLinhasContratadas) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Linhas de Portabilidade
            </h3>
          </div>
          <Badge variant={progresso === 100 ? "default" : "secondary"}>
            {summary.totalLinhasPreenchidas} de {summary.totalLinhasContratadas} linhas
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {summary.linhasRestantes > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>
              {summary.linhasRestantes} linha(s) pendente(s) de preenchimento
            </span>
          </div>
        )}
      </div>

      {/* Lista de slots */}
      <div className="space-y-3">
        {slots.map((slot, index) => {
          const isEditing = editingSlot === index;
          const availableProducts = getAvailableProducts(index);
          const availableSVAs = getAvailableSVAs(slot.productId);
          
          // Key única e estável para cada Card
          const cardKey = `line-${slot.id}-${isEditing ? 'edit' : 'view'}`;

          return (
            <Card
              key={cardKey}
              className={`p-4 transition-all ${
                slot.filled
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 bg-white"
              } ${isEditing ? "ring-2 ring-primary" : ""}`}
            >
              <div className="space-y-4">
                {/* Header do slot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {slot.filled ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                    )}
                    <span className="font-medium">
                      Linha {index + 1}
                      {slot.filled && slot.productNome && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          • {slot.productNome}
                        </span>
                      )}
                    </span>
                    {slot.status && slot.status !== "inicial" && (
                      <Badge variant="outline" className="text-xs">
                        {slot.status}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSlot(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {slot.filled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSave(index)}
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSlot(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Formulário */}
                {isEditing ? (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Produto/Plano <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={slot.productId}
                          onValueChange={(value) => {
                            handleFieldChange(index, "productId", value);
                            // Limpar SVAs quando mudar o produto
                            handleFieldChange(index, "svas", []);
                            // Auto-preencher operadora destino
                            const product = summary.produtosDisponiveis.find(
                              (p: any) => p.id === value
                            );
                            if (product?.operadora) {
                              handleFieldChange(
                                index,
                                "operadoraDestino",
                                product.operadora
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map((produto: any) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Número <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={slot.numero}
                          onChange={(e) =>
                            handleFieldChange(index, "numero", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Operadora Atual</Label>
                        <Input
                          placeholder="Ex: Vivo, Claro, TIM..."
                          value={slot.operadoraAtual}
                          onChange={(e) =>
                            handleFieldChange(index, "operadoraAtual", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Operadora Destino</Label>
                        <Input
                          placeholder="Preenchido automaticamente"
                          value={slot.operadoraDestino}
                          onChange={(e) =>
                            handleFieldChange(index, "operadoraDestino", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={slot.status}
                          onValueChange={(value) =>
                            handleFieldChange(index, "status", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inicial">Inicial</SelectItem>
                            <SelectItem value="em_analise">Em Análise</SelectItem>
                            <SelectItem value="aprovado">Aprovado</SelectItem>
                            <SelectItem value="em_processo">Em Processo</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* SVAs */}
                    {availableSVAs.length > 0 && (
                      <div className="space-y-2">
                        <Label>SVAs (opcionais)</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableSVAs.map((sva: any) => {
                            const isSelected = (slot.svas || []).includes(sva.id);
                            return (
                              <Button
                                key={sva.id}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSVAToggle(index, sva.id)}
                              >
                                {isSelected && <Check className="h-3 w-3 mr-1" />}
                                {sva.nome}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Informações adicionais..."
                        value={slot.observacoes}
                        onChange={(e) =>
                          handleFieldChange(index, "observacoes", e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                ) : slot.filled ? (
                  // Visualização compacta
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>
                      <strong>Número:</strong> {slot.numero}
                    </p>
                    {slot.operadoraAtual && (
                      <p>
                        <strong>De:</strong> {slot.operadoraAtual}
                      </p>
                    )}
                    {slot.operadoraDestino && (
                      <p>
                        <strong>Para:</strong> {slot.operadoraDestino}
                      </p>
                    )}
                    {slot.svas && slot.svas.length > 0 && (
                      <p>
                        <strong>SVAs:</strong>{" "}
                        {slot.svas.map((svaId: string) => {
                          const sva = summary?.svasDisponiveis?.find((s: any) => s.id === svaId);
                          return sva?.nome || svaId;
                        }).join(", ")}
                      </p>
                    )}
                    {slot.observacoes && (
                      <p>
                        <strong>Obs:</strong> {slot.observacoes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Clique em editar para preencher esta linha
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
