import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Folder,
  Search,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EcommerceCategory } from "@shared/schema";

export default function AdminCategorias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<EcommerceCategory | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    icone: "Package",
    cor: "blue",
    ativo: true,
    ordem: 0,
  });

  const { data: categorias = [] } = useQuery<EcommerceCategory[]>({
    queryKey: ["/api/admin/ecommerce/manage/categories"],
  });

  const criarMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/ecommerce/manage/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar categoria");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/categories"],
      });
      toast({ title: "Categoria criada com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/ecommerce/manage/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar categoria");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/categories"],
      });
      toast({ title: "Categoria atualizada com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ecommerce/manage/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/categories"],
      });
      toast({ title: "Categoria deletada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      nome: "",
      slug: "",
      descricao: "",
      icone: "Package",
      cor: "blue",
      ativo: true,
      ordem: 0,
    });
    setEditando(null);
  };

  const abrirDialog = (categoria?: EcommerceCategory) => {
    if (categoria) {
      setEditando(categoria);
      setForm({
        nome: categoria.nome,
        slug: categoria.slug,
        descricao: categoria.descricao || "",
        icone: categoria.icone || "Package",
        cor: categoria.cor || "blue",
        ativo: categoria.ativo || true,
        ordem: categoria.ordem || 0,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      atualizarMutation.mutate({ id: editando.id, data: form });
    } else {
      criarMutation.mutate(form);
    }
  };

  // Categorias filtradas
  const categoriasFiltradas = useMemo(() => {
    let resultado = categorias;

    // Busca
    if (busca) {
      resultado = resultado.filter(
        (c) =>
          c.nome.toLowerCase().includes(busca.toLowerCase()) ||
          c.slug.toLowerCase().includes(busca.toLowerCase()) ||
          c.descricao?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus === "ativo") {
      resultado = resultado.filter((c) => c.ativo);
    } else if (filtroStatus === "inativo") {
      resultado = resultado.filter((c) => !c.ativo);
    }

    // Ordenar por ordem
    return [...resultado].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [categorias, busca, filtroStatus]);

  const atualizarOrdem = (categoriaId: string, direcao: "up" | "down") => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    if (!categoria) return;

    const novaOrdem =
      direcao === "up"
        ? (categoria.ordem || 0) - 1
        : (categoria.ordem || 0) + 1;
    atualizarMutation.mutate({
      id: categoriaId,
      data: { ...categoria, ordem: novaOrdem },
    });
  };

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
            Categorias E-commerce
          </h1>
          <p style={{ color: "#555555" }}>
            Gerencie as categorias dos produtos
          </p>
        </div>
        <Button
          onClick={() => abrirDialog()}
          style={{
            background: "#1E90FF",
            color: "#FFFFFF",
            borderRadius: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#00CFFF";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1E90FF";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#555555" }}>
                  Total de Categorias
                </p>
                <p className="text-2xl font-bold" style={{ color: "#111111" }}>
                  {categorias.length}
                </p>
              </div>
              <Folder className="h-8 w-8" style={{ color: "#1E90FF" }} />
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#555555" }}>
                  Categorias Ativas
                </p>
                <p className="text-2xl font-bold" style={{ color: "#111111" }}>
                  {categorias.filter((c) => c.ativo).length}
                </p>
              </div>
              <Eye className="h-8 w-8" style={{ color: "#1AD1C1" }} />
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#555555" }}>
                  Categorias Inativas
                </p>
                <p className="text-2xl font-bold" style={{ color: "#111111" }}>
                  {categorias.filter((c) => !c.ativo).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8" style={{ color: "#555555" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card
        style={{
          background: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#555555" }}
                />
                <Input
                  placeholder="Buscar por nome, slug ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm" style={{ color: "#555555" }}>
              Mostrando{" "}
              <span className="font-semibold" style={{ color: "#111111" }}>
                {categoriasFiltradas.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold" style={{ color: "#111111" }}>
                {categorias.length}
              </span>{" "}
              categorias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card
        style={{
          background: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Ícone/Cor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-slate-500 py-8"
                  >
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                categoriasFiltradas.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => atualizarOrdem(categoria.id, "up")}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-center font-medium">
                          {categoria.ordem}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => atualizarOrdem(categoria.id, "down")}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Folder
                          className="h-5 w-5"
                          style={{ color: "#1E90FF" }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: "#111111" }}
                        >
                          {categoria.nome}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: "rgba(30,144,255,0.1)",
                          color: "#1E90FF",
                        }}
                      >
                        {categoria.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          {categoria.icone}
                        </code>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-slate-300"
                          style={{ backgroundColor: categoria.cor || "blue" }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 line-clamp-2">
                        {categoria.descricao || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {categoria.ativo ? (
                        <Badge
                          style={{
                            background: "rgba(26,209,193,0.1)",
                            color: "#1AD1C1",
                            border: "1px solid #1AD1C1",
                            borderRadius: "6px",
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          style={{
                            background: "#F5F5F5",
                            color: "#555555",
                            border: "1px solid #E0E0E0",
                            borderRadius: "6px",
                          }}
                        >
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialog(categoria)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta categoria?"
                              )
                            ) {
                              deletarMutation.mutate(categoria.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="ex: fibra-optica"
                required
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ícone (Lucide)</Label>
                <Input
                  value={form.icone}
                  onChange={(e) => setForm({ ...form, icone: e.target.value })}
                  placeholder="Package"
                />
              </div>
              <div>
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) =>
                    setForm({ ...form, ordem: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, ativo: checked })
                  }
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">{editando ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
