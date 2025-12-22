import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Check, AlertCircle, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProductVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onAddToCart: (product: any, selectedVariations: any) => void;
}

interface VariationGroup {
  id: string;
  nome: string;
  tipoSelecao: "radio" | "checkbox" | "select";
  obrigatorio: boolean;
  minSelecoes?: number;
  maxSelecoes?: number;
  ordem: number;
  options: VariationOption[];
}

interface VariationOption {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  valorTecnico?: string;
  ordem: number;
}

export function ProductVariationsModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ProductVariationsModalProps) {
  const { toast } = useToast();
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string[]>
  >({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Buscar grupos de variação do produto
  const { data: variationGroups = [], isLoading } = useQuery<VariationGroup[]>({
    queryKey: [`/api/app/public/products/${product?.id}/variations`],
    enabled: isOpen && !!product?.id,
  });

  // Debug: verificar dados carregados
  useEffect(() => {
    if (!isLoading && isOpen) {
      console.log('📦 Grupos de variação carregados:', variationGroups);
      console.log('📦 Quantidade:', variationGroups.length);
    }
  }, [variationGroups, isLoading, isOpen]);

  // Resetar seleções quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedVariations({});
      setValidationErrors([]);
    }
  }, [isOpen, product]);

  const handleRadioChange = (groupId: string, optionId: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [groupId]: [optionId],
    }));
    setValidationErrors([]);
  };

  const handleCheckboxChange = (
    groupId: string,
    optionId: string,
    checked: boolean
  ) => {
    setSelectedVariations((prev) => {
      const current = prev[groupId] || [];
      const group = variationGroups.find((g) => g.id === groupId);

      if (checked) {
        // Verificar limite máximo
        if (group?.maxSelecoes && current.length >= group.maxSelecoes) {
          toast({
            title: "Limite atingido",
            description: `Você pode selecionar no máximo ${group.maxSelecoes} opções neste grupo.`,
            variant: "destructive",
          });
          return prev;
        }
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      } else {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== optionId),
        };
      }
    });
    setValidationErrors([]);
  };

  const validateSelections = (): boolean => {
    const errors: string[] = [];

    variationGroups.forEach((group) => {
      const selected = selectedVariations[group.id] || [];

      // Verificar se obrigatório e vazio
      if (group.obrigatorio && selected.length === 0) {
        errors.push(`Selecione ao menos uma opção em "${group.nome}"`);
      }

      // Verificar mínimo de seleções
      if (group.minSelecoes && selected.length < group.minSelecoes) {
        errors.push(
          `Selecione pelo menos ${group.minSelecoes} opções em "${group.nome}"`
        );
      }

      // Verificar máximo de seleções
      if (group.maxSelecoes && selected.length > group.maxSelecoes) {
        errors.push(
          `Selecione no máximo ${group.maxSelecoes} opções em "${group.nome}"`
        );
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateTotalPrice = (): number => {
    let total = product.preco;

    variationGroups.forEach((group) => {
      const selected = selectedVariations[group.id] || [];
      selected.forEach((optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        if (option) {
          total += option.preco;
        }
      });
    });

    return total;
  };

  const handleAddToCart = () => {
    if (!validateSelections()) {
      toast({
        title: "Seleção incompleta",
        description: "Por favor, complete todas as opções obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados das variações selecionadas
    const selectedOptions = variationGroups
      .map((group) => {
        const selectedIds = selectedVariations[group.id] || [];
        const options = selectedIds.map((optionId) => {
          const option = group.options.find((opt) => opt.id === optionId);
          return {
            groupId: group.id,
            groupName: group.nome,
            optionId: option?.id,
            optionName: option?.nome,
            optionPrice: option?.preco || 0,
          };
        });
        return options;
      })
      .flat();

    onAddToCart(product, {
      selections: selectedOptions,
      totalPrice: calculateTotalPrice(),
    });
    onClose();
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl shadow-2xl border border-gray-200">
        <DialogHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-blue-100 p-6 mb-0 rounded-t-2xl shadow-sm">
          <DialogTitle className="text-2xl font-extrabold flex items-center gap-2 text-blue-800 tracking-tight">
            <SlidersHorizontal className="h-7 w-7 text-blue-600 drop-shadow" />
            Personalize seu {product.nome}
          </DialogTitle>
          <DialogDescription className="text-blue-700 text-base mt-1 font-medium">
            Escolha as opções que melhor atendem suas necessidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">Carregando opções...</p>
            </div>
          ) : variationGroups.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                Nenhuma opção de personalização disponível
              </p>
            </div>
          ) : (
            <>
              {variationGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-gray-100 rounded-xl bg-white mb-4"
                >
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.nome}
                    </h3>
                    {group.tipoSelecao === "checkbox" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {group.minSelecoes && group.maxSelecoes
                          ? `Selecione de ${group.minSelecoes} a ${group.maxSelecoes} opções`
                          : group.maxSelecoes
                          ? `Selecione até ${group.maxSelecoes} opções`
                          : "Selecione uma ou mais opções"}
                      </p>
                    )}
                    {group.tipoSelecao === "select" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Escolha uma opção na lista
                      </p>
                    )}
                  </div>

                  {group.tipoSelecao === "select" ? (
                    // SELECT DROPDOWN
                    <Select
                      value={selectedVariations[group.id]?.[0] || ""}
                      onValueChange={(value) =>
                        handleRadioChange(group.id, value)
                      }
                    >
                      <SelectTrigger className="w-full h-12 text-base border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors hover:bg-gray-50 focus:bg-gray-50">
                        <SelectValue placeholder="Selecione uma opção..." />
                      </SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id}
                            className="text-base py-3 hover:bg-gray-50 focus:bg-gray-50 data-[state=checked]:bg-gray-100"
                          >
                            <div className="flex items-center justify-between w-full gap-4">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">
                                  {option.nome}
                                </div>
                                {option.descricao && (
                                  <div className="text-xs text-gray-600 mt-0.5">
                                    {option.descricao}
                                  </div>
                                )}
                              </div>
                              <div
                                className={`font-bold text-sm ${
                                  option.preco === 0
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {option.preco === 0
                                  ? "Incluído"
                                  : `+${formatPrice(option.preco)}/mês`}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : group.tipoSelecao === "radio" ? (
                    // RADIO BUTTONS
                    <RadioGroup
                      value={selectedVariations[group.id]?.[0] || ""}
                      onValueChange={(value) =>
                        handleRadioChange(group.id, value)
                      }
                    >
                      <div className="space-y-2">
                        {group.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              selectedVariations[group.id]?.[0] === option.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() =>
                              handleRadioChange(group.id, option.id)
                            }
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label
                              htmlFor={option.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-semibold text-gray-900">
                                {option.nome}
                              </div>
                              {option.descricao && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {option.descricao}
                                </div>
                              )}
                            </Label>
                            <div className="text-right">
                              <div
                                className={`font-bold ${
                                  option.preco === 0
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {option.preco === 0
                                  ? "Incluído"
                                  : `+${formatPrice(option.preco)}`}
                              </div>
                              {option.preco !== 0 && (
                                <div className="text-xs text-gray-500">
                                  /mês
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : group.tipoSelecao === "checkbox" ? (
                    // CHECKBOXES
                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const isChecked =
                          selectedVariations[group.id]?.includes(option.id) ||
                          false;
                        return (
                          <div
                            key={option.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isChecked
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() =>
                              handleCheckboxChange(
                                group.id,
                                option.id,
                                !isChecked
                              )
                            }
                          >
                            <Checkbox
                              id={option.id}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(
                                  group.id,
                                  option.id,
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor={option.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-semibold text-gray-900">
                                {option.nome}
                              </div>
                              {option.descricao && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {option.descricao}
                                </div>
                              )}
                            </Label>
                            <div className="text-right">
                              <div
                                className={`font-bold ${
                                  option.preco === 0
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {option.preco === 0
                                  ? "Incluído"
                                  : `+${formatPrice(option.preco)}`}
                              </div>
                              {option.preco !== 0 && (
                                <div className="text-xs text-gray-500">
                                  /mês
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Erros de validação */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">
                        Atenção:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo do preço */}
              <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 rounded-b-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total mensal</p>
                    <p className="text-3xl font-extrabold text-blue-700">
                      {formatPrice(calculateTotalPrice())}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-10 rounded-md font-normal text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 shadow-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    className="h-12 rounded-md font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base tracking-tight"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Assinar Plano
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
