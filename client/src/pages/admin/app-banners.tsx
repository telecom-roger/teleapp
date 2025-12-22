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
  Image as ImageIcon,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EcommerceBanner } from "@shared/schema";

export default function AdminBanners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<EcommerceBanner | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPagina, setFiltroPagina] = useState<string>("todos");

  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    imagemUrl: "",
    imagemMobileUrl: "",
    pagina: "home",
    posicao: "topo",
    linkDestino: "",
    linkTexto: "",
    ordem: 0,
    ativo: true,
    dataInicio: "",
    dataFim: "",
  });

  const { data: banners = [] } = useQuery<EcommerceBanner[]>({
    queryKey: ["/api/admin/app/banners"],
  });

  const criarMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/app/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao criar banner");
        } catch {
          throw new Error(`Erro ${res.status}: ${text.substring(0, 100)}`);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/banners"],
      });
      toast({ title: "Banner criado com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/app/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao atualizar banner");
        } catch {
          throw new Error(`Erro ${res.status}: ${text.substring(0, 100)}`);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/banners"],
      });
      toast({ title: "Banner atualizado com sucesso!" });
      setDialogOpen(false);
      setEditando(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/app/banners/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao deletar banner");
        } catch {
          throw new Error(`Erro ${res.status}: ${text.substring(0, 100)}`);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/app/banners"],
      });
      toast({ title: "Banner deletado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      titulo: "",
      subtitulo: "",
      imagemUrl: "",
      imagemMobileUrl: "",
      pagina: "home",
      posicao: "topo",
      linkDestino: "",
      linkTexto: "",
      ordem: 0,
      ativo: true,
      dataInicio: "",
      dataFim: "",
    });
    setEditando(null);
  };

  const abrirDialogNovo = () => {
    resetForm();
    setDialogOpen(true);
  };

  const abrirDialogEditar = (banner: EcommerceBanner) => {
    setEditando(banner);
    setForm({
      titulo: banner.titulo,
      subtitulo: banner.subtitulo || "",
      imagemUrl: banner.imagemUrl,
      imagemMobileUrl: banner.imagemMobileUrl || "",
      pagina: banner.pagina,
      posicao: banner.posicao || "topo",
      linkDestino: banner.linkDestino || "",
      linkTexto: banner.linkTexto || "",
      ordem: banner.ordem || 0,
      ativo: banner.ativo,
      dataInicio: banner.dataInicio
        ? new Date(banner.dataInicio).toISOString().split("T")[0]
        : "",
      dataFim: banner.dataFim
        ? new Date(banner.dataFim).toISOString().split("T")[0]
        : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo || !form.imagemUrl || !form.pagina) {
      toast({
        title: "Campos obrigatórios faltando",
        description: "Preencha título, imagem e página",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...form,
      dataInicio: form.dataInicio
        ? new Date(form.dataInicio).toISOString()
        : null,
      dataFim: form.dataFim ? new Date(form.dataFim).toISOString() : null,
    };

    if (editando) {
      atualizarMutation.mutate({ id: editando.id, data });
    } else {
      criarMutation.mutate(data);
    }
  };

  const handleDeletar = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este banner?")) {
      deletarMutation.mutate(id);
    }
  };

  const bannersFiltrados = useMemo(() => {
    return banners.filter((banner) => {
      const matchBusca =
        banner.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        banner.subtitulo?.toLowerCase().includes(busca.toLowerCase()) ||
        banner.pagina.toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativo" && banner.ativo) ||
        (filtroStatus === "inativo" && !banner.ativo);

      const matchPagina =
        filtroPagina === "todos" || banner.pagina === filtroPagina;

      return matchBusca && matchStatus && matchPagina;
    });
  }, [banners, busca, filtroStatus, filtroPagina]);

  const getStatusBadge = (banner: EcommerceBanner) => {
    if (!banner.ativo) {
      return (
        <Badge
          style={{
            background: "#F5F5F5",
            color: "#555555",
            border: "1px solid #E0E0E0",
            borderRadius: "6px",
          }}
        >
          Inativo
        </Badge>
      );
    }

    const now = new Date();
    const inicio = banner.dataInicio ? new Date(banner.dataInicio) : null;
    const fim = banner.dataFim ? new Date(banner.dataFim) : null;

    if (inicio && inicio > now) {
      return (
        <Badge
          style={{
            background: "rgba(30,144,255,0.1)",
            color: "#1E90FF",
            border: "1px solid #1E90FF",
            borderRadius: "6px",
          }}
        >
          Agendado
        </Badge>
      );
    }

    if (fim && fim < now) {
      return (
        <Badge
          style={{
            background: "rgba(255,107,53,0.1)",
            color: "#FF6B35",
            border: "1px solid #FF6B35",
            borderRadius: "6px",
          }}
        >
          Expirado
        </Badge>
      );
    }

    return (
      <Badge
        style={{
          background: "rgba(26,209,193,0.1)",
          color: "#1AD1C1",
          border: "1px solid #1AD1C1",
          borderRadius: "6px",
        }}
      >
        Ativo
      </Badge>
    );
  };

  const getPaginaNome = (pagina: string) => {
    const nomes: Record<string, string> = {
      home: "Home",
      planos: "Planos",
      comparador: "Comparador",
      checkout: "Checkout",
    };
    return nomes[pagina] || pagina;
  };

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
            Banners do E-commerce
          </h1>
          <p style={{ color: "#555555" }}>
            Gerencie os banners exibidos nas páginas do e-commerce
          </p>
        </div>
        <Button
          onClick={abrirDialogNovo}
          className="gap-2"
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
          <Plus className="w-4 h-4" />
          Novo Banner
        </Button>
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
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#555555" }}
              />
              <Input
                placeholder="Buscar banners..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroPagina} onValueChange={setFiltroPagina}>
              <SelectTrigger>
                <SelectValue placeholder="Página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Páginas</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="planos">Planos</SelectItem>
                <SelectItem value="comparador">Comparador</SelectItem>
                <SelectItem value="checkout">Checkout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Banners */}
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
                <TableHead className="w-[50px]">Ordem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bannersFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    Nenhum banner encontrado
                  </TableCell>
                </TableRow>
              ) : (
                bannersFiltrados.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-mono">{banner.ordem}</TableCell>
                    <TableCell>
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: "#111111" }}
                        >
                          {banner.titulo}
                        </div>
                        {banner.subtitulo && (
                          <div
                            className="text-sm truncate max-w-xs"
                            style={{ color: "#555555" }}
                          >
                            {banner.subtitulo}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPaginaNome(banner.pagina)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {banner.imagemUrl ? (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-slate-500">
                            Com imagem
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-slate-300" />
                          <span className="text-sm text-slate-400">
                            Sem imagem
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {banner.dataInicio ? (
                          <div>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(banner.dataInicio).toLocaleDateString(
                              "pt-BR"
                            )}
                            {banner.dataFim && (
                              <>
                                {" → "}
                                {new Date(banner.dataFim).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem período</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(banner)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirDialogEditar(banner)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletar(banner.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Banner" : "Novo Banner"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <Label htmlFor="titulo">
                  Título <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Compare e Escolha o Plano Perfeito"
                  required
                />
              </div>

              {/* Subtítulo */}
              <div className="md:col-span-2">
                <Label htmlFor="subtitulo">Subtítulo</Label>
                <Textarea
                  id="subtitulo"
                  value={form.subtitulo}
                  onChange={(e) =>
                    setForm({ ...form, subtitulo: e.target.value })
                  }
                  placeholder="Texto complementar do banner"
                  rows={2}
                />
              </div>

              {/* Imagem Desktop */}
              <div className="md:col-span-2">
                <Label htmlFor="imagemUrl">
                  URL da Imagem (Desktop){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="imagemUrl"
                  value={form.imagemUrl}
                  onChange={(e) =>
                    setForm({ ...form, imagemUrl: e.target.value })
                  }
                  placeholder="https://exemplo.com/banner.jpg"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tamanho recomendado: 1920x300px
                </p>
              </div>

              {/* Imagem Mobile */}
              <div className="md:col-span-2">
                <Label htmlFor="imagemMobileUrl">URL da Imagem (Mobile)</Label>
                <Input
                  id="imagemMobileUrl"
                  value={form.imagemMobileUrl}
                  onChange={(e) =>
                    setForm({ ...form, imagemMobileUrl: e.target.value })
                  }
                  placeholder="https://exemplo.com/banner-mobile.jpg (opcional)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tamanho recomendado: 768x250px (opcional)
                </p>
              </div>

              {/* Página */}
              <div>
                <Label htmlFor="pagina">
                  Página <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.pagina}
                  onValueChange={(value) => setForm({ ...form, pagina: value })}
                >
                  <SelectTrigger id="pagina">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="planos">Planos</SelectItem>
                    <SelectItem value="comparador">Comparador</SelectItem>
                    <SelectItem value="checkout">Checkout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Posição */}
              <div>
                <Label htmlFor="posicao">Posição</Label>
                <Select
                  value={form.posicao}
                  onValueChange={(value) =>
                    setForm({ ...form, posicao: value })
                  }
                >
                  <SelectTrigger id="posicao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topo">Topo</SelectItem>
                    <SelectItem value="meio">Meio</SelectItem>
                    <SelectItem value="rodape">Rodapé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Link Destino */}
              <div>
                <Label htmlFor="linkDestino">Link de Destino</Label>
                <Input
                  id="linkDestino"
                  value={form.linkDestino}
                  onChange={(e) =>
                    setForm({ ...form, linkDestino: e.target.value })
                  }
                  placeholder="/planos ou https://..."
                />
              </div>

              {/* Texto do Link */}
              <div>
                <Label htmlFor="linkTexto">Texto do Botão/Link</Label>
                <Input
                  id="linkTexto"
                  value={form.linkTexto}
                  onChange={(e) =>
                    setForm({ ...form, linkTexto: e.target.value })
                  }
                  placeholder="Ver Planos"
                />
              </div>

              {/* Data Início */}
              <div>
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) =>
                    setForm({ ...form, dataInicio: e.target.value })
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  Deixe vazio para sempre ativo
                </p>
              </div>

              {/* Data Fim */}
              <div>
                <Label htmlFor="dataFim">Data de Término</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={form.dataFim}
                  onChange={(e) =>
                    setForm({ ...form, dataFim: e.target.value })
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  Deixe vazio para sem expiração
                </p>
              </div>

              {/* Ordem */}
              <div>
                <Label htmlFor="ordem">Ordem de Exibição</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={form.ordem}
                  onChange={(e) =>
                    setForm({ ...form, ordem: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Menor número = maior prioridade
                </p>
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, ativo: checked })
                  }
                />
                <Label htmlFor="ativo">Banner Ativo</Label>
              </div>
            </div>

            {/* Preview */}
            {form.imagemUrl && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <Label className="text-sm font-medium mb-2 block">
                  Preview
                </Label>
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img
                    src={form.imagemUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/40 flex items-center justify-center">
                    <div className="text-center text-white space-y-2 px-4">
                      <h3 className="text-xl font-bold">
                        {form.titulo || "Título do Banner"}
                      </h3>
                      {form.subtitulo && (
                        <p className="text-sm">{form.subtitulo}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editando ? "Salvar Alterações" : "Criar Banner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
