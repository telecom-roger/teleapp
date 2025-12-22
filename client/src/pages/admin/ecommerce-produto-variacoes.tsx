import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, ArrowLeft, GripVertical } from "lucide-react";

interface VariationGroup {
  id: string;
  productId: string;
  nome: string;
  tipoSelecao: "radio" | "checkbox" | "select";
  obrigatorio: boolean;
  minSelecoes: number;
  maxSelecoes: number;
  ordem: number;
  ativo: boolean;
  options?: VariationOption[];
}

interface VariationOption {
  id: string;
  groupId: string;
  nome: string;
  descricao?: string;
  preco: number;
  valorTecnico?: string;
  ordem: number;
  ativo: boolean;
}

export default function AdminProdutoVariacoes() {
  const [, params] = useRoute("/admin/app-produtos/:productId/variacoes");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const productId = params?.productId;

  // Estados para modals de grupos
  const [dialogGrupoOpen, setDialogGrupoOpen] = useState(false);
  const [editandoGrupo, setEditandoGrupo] = useState<VariationGroup | null>(
    null
  );
  const [deleteGrupoId, setDeleteGrupoId] = useState<string | null>(null);

  // Estados para modals de opções
  const [dialogOpcaoOpen, setDialogOpcaoOpen] = useState(false);
  const [editandoOpcao, setEditandoOpcao] = useState<VariationOption | null>(
    null
  );
  const [deleteOpcaoId, setDeleteOpcaoId] = useState<string | null>(null);
  const [grupoAtivo, setGrupoAtivo] = useState<string | null>(null);

  // Buscar produto
  const { data: produto } = useQuery<{ nome: string }>({
    queryKey: [`/api/app/products/${productId}`],
    enabled: !!productId,
  });

  // Buscar grupos de variação
  const { data: grupos = [], isLoading } = useQuery<VariationGroup[]>({
    queryKey: [
      `/api/admin/app/manage/products/${productId}/variation-groups`,
    ],
    enabled: !!productId,
  });

  // Mutations para grupos
  const criarGrupoMutation = useMutation({
    mutationFn: async (data: Partial<VariationGroup>) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/app/manage/products/${productId}/variation-groups`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDialogGrupoOpen(false);
      setEditandoGrupo(null);
      toast({ title: "Grupo criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarGrupoMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<VariationGroup>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/app/manage/products/${productId}/variation-groups/${id}`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDialogGrupoOpen(false);
      setEditandoGrupo(null);
      toast({ title: "Grupo atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletarGrupoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "DELETE",
        `/api/admin/app/manage/products/${productId}/variation-groups/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDeleteGrupoId(null);
      toast({ title: "Grupo deletado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutations para opções
  const criarOpcaoMutation = useMutation({
    mutationFn: async (data: Partial<VariationOption>) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/app/manage/products/${productId}/variation-groups/${grupoAtivo}/options`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDialogOpcaoOpen(false);
      setEditandoOpcao(null);
      toast({ title: "Opção criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarOpcaoMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<VariationOption>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/app/manage/products/${productId}/variation-groups/${grupoAtivo}/options/${id}`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDialogOpcaoOpen(false);
      setEditandoOpcao(null);
      toast({ title: "Opção atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletarOpcaoMutation = useMutation({
    mutationFn: async ({
      groupId,
      optionId,
    }: {
      groupId: string;
      optionId: string;
    }) => {
      await apiRequest(
        "DELETE",
        `/api/admin/app/manage/products/${productId}/variation-groups/${groupId}/options/${optionId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/admin/app/manage/products/${productId}/variation-groups`,
        ],
      });
      setDeleteOpcaoId(null);
      toast({ title: "Opção deletada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitGrupo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      nome: formData.get("nome") as string,
      tipoSelecao: formData.get("tipoSelecao") as
        | "radio"
        | "checkbox"
        | "select",
      obrigatorio: formData.get("obrigatorio") === "on",
      minSelecoes: parseInt(formData.get("minSelecoes") as string) || 1,
      maxSelecoes: parseInt(formData.get("maxSelecoes") as string) || 1,
      ordem: parseInt(formData.get("ordem") as string) || 0,
      ativo: formData.get("ativo") === "on",
    };

    if (editandoGrupo) {
      atualizarGrupoMutation.mutate({ id: editandoGrupo.id, data });
    } else {
      criarGrupoMutation.mutate(data);
    }
  };

  const handleSubmitOpcao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      nome: formData.get("nome") as string,
      descricao: (formData.get("descricao") as string) || undefined,
      preco: Math.round(parseFloat(formData.get("preco") as string) * 100), // Converter para centavos
      valorTecnico: (formData.get("valorTecnico") as string) || undefined,
      ordem: parseInt(formData.get("ordem") as string) || 0,
      ativo: formData.get("ativo") === "on",
    };

    if (editandoOpcao) {
      atualizarOpcaoMutation.mutate({ id: editandoOpcao.id, data });
    } else {
      criarOpcaoMutation.mutate(data);
    }
  };

  const abrirNovoGrupo = () => {
    setEditandoGrupo(null);
    setDialogGrupoOpen(true);
  };

  const abrirEditarGrupo = (grupo: VariationGroup) => {
    setEditandoGrupo(grupo);
    setDialogGrupoOpen(true);
  };

  const abrirNovaOpcao = (groupId: string) => {
    setGrupoAtivo(groupId);
    setEditandoOpcao(null);
    setDialogOpcaoOpen(true);
  };

  const abrirEditarOpcao = (opcao: VariationOption, groupId: string) => {
    setGrupoAtivo(groupId);
    setEditandoOpcao(opcao);
    setDialogOpcaoOpen(true);
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin/app-produtos")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Variações do Produto
            </h1>
            {produto && (
              <p className="text-sm text-slate-600 mt-1">{produto.nome}</p>
            )}
          </div>
        </div>
        <Button onClick={abrirNovoGrupo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Lista de Grupos */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-slate-500">Carregando...</p>
          </CardContent>
        </Card>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 mb-4">
              Nenhum grupo de variação cadastrado
            </p>
            <Button onClick={abrirNovoGrupo}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <Card key={grupo.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-slate-400" />
                    <div>
                      <CardTitle className="text-lg">{grupo.nome}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                          {grupo.tipoSelecao === "radio"
                            ? "Única escolha (Radio)"
                            : grupo.tipoSelecao === "select"
                            ? "Única escolha (Select)"
                            : "Múltipla escolha"}
                        </span>
                        {grupo.obrigatorio && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Obrigatório
                          </span>
                        )}
                        {!grupo.ativo && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            Inativo
                          </span>
                        )}
                        {grupo.tipoSelecao === "checkbox" && (
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                            Min: {grupo.minSelecoes} | Max: {grupo.maxSelecoes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirEditarGrupo(grupo)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteGrupoId(grupo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Opções</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirNovaOpcao(grupo.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Opção
                  </Button>
                </div>
                {!grupo.options || grupo.options.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    Nenhuma opção cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {grupo.options.map((opcao) => (
                      <div
                        key={opcao.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{opcao.nome}</span>
                            <span
                              className={`text-sm ${
                                opcao.preco >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {opcao.preco >= 0 ? "+" : ""}
                              {(opcao.preco / 100).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                            {opcao.valorTecnico && (
                              <span className="text-xs px-2 py-0.5 bg-slate-200 rounded">
                                Valor: {opcao.valorTecnico}
                              </span>
                            )}
                            {!opcao.ativo && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                Inativo
                              </span>
                            )}
                          </div>
                          {opcao.descricao && (
                            <p className="text-sm text-slate-600 mt-1">
                              {opcao.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirEditarOpcao(opcao, grupo.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setGrupoAtivo(grupo.id);
                              setDeleteOpcaoId(opcao.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Criar/Editar Grupo */}
      <Dialog open={dialogGrupoOpen} onOpenChange={setDialogGrupoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoGrupo ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitGrupo} className="space-y-4">
            <div>
              <Label>Nome do Grupo</Label>
              <Input
                name="nome"
                defaultValue={editandoGrupo?.nome}
                placeholder="Ex: Internet Fibra, Plano Móvel"
                required
              />
            </div>

            <div>
              <Label>Tipo de Seleção</Label>
              <Select
                name="tipoSelecao"
                defaultValue={editandoGrupo?.tipoSelecao || "radio"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radio">
                    Única escolha (Radio Buttons)
                  </SelectItem>
                  <SelectItem value="select">
                    Única escolha (Dropdown Select)
                  </SelectItem>
                  <SelectItem value="checkbox">
                    Múltipla escolha (Checkboxes)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Radio:</strong> Cliente vê todas opções e seleciona uma
                |<strong> Select:</strong> Menu dropdown compacto |
                <strong> Checkbox:</strong> Permite selecionar várias
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mínimo de Seleções</Label>
                <Input
                  name="minSelecoes"
                  type="number"
                  min="0"
                  defaultValue={editandoGrupo?.minSelecoes || 1}
                />
              </div>
              <div>
                <Label>Máximo de Seleções</Label>
                <Input
                  name="maxSelecoes"
                  type="number"
                  min="1"
                  defaultValue={editandoGrupo?.maxSelecoes || 1}
                />
              </div>
            </div>

            <div>
              <Label>Ordem</Label>
              <Input
                name="ordem"
                type="number"
                defaultValue={editandoGrupo?.ordem || 0}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                name="obrigatorio"
                defaultChecked={editandoGrupo?.obrigatorio !== false}
              />
              <Label>Obrigatório</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                name="ativo"
                defaultChecked={editandoGrupo?.ativo !== false}
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogGrupoOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar/Editar Opção */}
      <Dialog open={dialogOpcaoOpen} onOpenChange={setDialogOpcaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoOpcao ? "Editar Opção" : "Nova Opção"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOpcao} className="space-y-4">
            <div>
              <Label>Nome da Opção</Label>
              <Input
                name="nome"
                defaultValue={editandoOpcao?.nome}
                placeholder="Ex: 700 Mega, 15 GB"
                required
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                name="descricao"
                defaultValue={editandoOpcao?.descricao || ""}
                placeholder="Descrição adicional da opção"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  name="preco"
                  type="number"
                  step="0.01"
                  defaultValue={editandoOpcao ? editandoOpcao.preco / 100 : 0}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Pode ser positivo (adiciona) ou negativo (desconto)
                </p>
              </div>
              <div>
                <Label>Valor Técnico</Label>
                <Input
                  name="valorTecnico"
                  defaultValue={editandoOpcao?.valorTecnico || ""}
                  placeholder="Ex: 700, 15"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Usado para integrações e filtros
                </p>
              </div>
            </div>

            <div>
              <Label>Ordem</Label>
              <Input
                name="ordem"
                type="number"
                defaultValue={editandoOpcao?.ordem || 0}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                name="ativo"
                defaultChecked={editandoOpcao?.ativo !== false}
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpcaoOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Deletar Grupo */}
      <AlertDialog
        open={!!deleteGrupoId}
        onOpenChange={() => setDeleteGrupoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este grupo de variação? Esta ação
              não pode ser desfeita. Todas as opções deste grupo também serão
              deletadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteGrupoId && deletarGrupoMutation.mutate(deleteGrupoId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Deletar Opção */}
      <AlertDialog
        open={!!deleteOpcaoId}
        onOpenChange={() => setDeleteOpcaoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta opção? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOpcaoId && grupoAtivo) {
                  deletarOpcaoMutation.mutate({
                    groupId: grupoAtivo,
                    optionId: deleteOpcaoId,
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
