import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EcommerceProduct, EcommerceCategory } from "@shared/schema";

export default function AdminProdutos() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<EcommerceProduct | null>(null);
  const [svasSelecionados, setSvasSelecionados] = useState<string[]>([]);
  const [textosUpsell, setTextosUpsell] = useState<string[]>([""]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroOperadora, setFiltroOperadora] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTipoPessoa, setFiltroTipoPessoa] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<"nome" | "preco" | "operadora">(
    "nome"
  );

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  const { data: produtos = [], isLoading } = useQuery<EcommerceProduct[]>({
    queryKey: ["/api/admin/ecommerce/manage/products"],
    enabled: isAuthenticated,
  });

  // Buscar apenas produtos SVA para o multi-select
  const produtosSVA = useMemo(() => {
    return produtos.filter((p) => p.categoria === "sva");
  }, [produtos]);

  const { data: categorias = [] } = useQuery<EcommerceCategory[]>({
    queryKey: ["/api/admin/ecommerce/manage/categories"],
    enabled: isAuthenticated,
  });

  const criarMutation = useMutation({
    mutationFn: async (data: Partial<EcommerceProduct>) => {
      const res = await apiRequest(
        "POST",
        "/api/admin/ecommerce/manage/products",
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/products"],
      });
      toast({ title: "Produto criado com sucesso!" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar produto", variant: "destructive" });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EcommerceProduct>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/ecommerce/manage/products/${id}`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/products"],
      });
      toast({ title: "Produto atualizado!" });
      setDialogOpen(false);
      setEditando(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "DELETE",
        `/api/admin/ecommerce/manage/products/${id}`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/ecommerce/manage/products"],
      });
      toast({ title: "Produto deletado" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validar categorias
    if (categoriasSelecionadas.length === 0) {
      toast({ 
        title: "Erro", 
        description: "Selecione pelo menos uma categoria",
        variant: "destructive"
      });
      return;
    }

    const data = {
      nome: formData.get("nome") as string,
      descricao: formData.get("descricao") as string,
      categoria: categoriasSelecionadas[0], // Primeira categoria como principal (para retrocompatibilidade)
      categorias: categoriasSelecionadas, // Array de todas as categorias
      operadora: formData.get("operadora") as string,
      velocidade: (formData.get("velocidade") as string) || null,
      franquia: (formData.get("franquia") as string) || null,
      preco: parseInt(formData.get("preco") as string) * 100, // converter para centavos
      precoInstalacao:
        parseInt((formData.get("precoInstalacao") as string) || "0") * 100,
      fidelidade: parseInt((formData.get("fidelidade") as string) || "0"),
      tipoPessoa: formData.get("tipoPessoa") as string,
      ativo: formData.get("ativo") === "on",
      destaque: formData.get("destaque") === "on",
      beneficios: (formData.get("beneficios") as string)
        .split("\n")
        .filter((b) => b.trim()),
      diferenciais: (formData.get("diferenciais") as string)
        .split("\n")
        .filter((d) => d.trim()),
      // NOVOS CAMPOS - Calculadora e Upsell
      permiteCalculadoraLinhas:
        formData.get("permiteCalculadoraLinhas") === "on",
      precisaEnderecoInstalacao:
        formData.get("precisaEnderecoInstalacao") === "on",
      textosUpsell: textosUpsell.filter((t) => t.trim() !== ""), // Filtrar textos vazios
      svasUpsell: svasSelecionados, // Usar os SVAs selecionados via checkboxes
      // NOVOS CAMPOS - Sistema de Recomendação Inteligente
      modalidade: (formData.get("modalidade") as string) || "ambos",
      usoRecomendado: (formData.get("usoRecomendado") as string)
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u),
      limiteDispositivosMin: formData.get("limiteDispositivosMin")
        ? parseInt(formData.get("limiteDispositivosMin") as string)
        : null,
      limiteDispositivosMax: formData.get("limiteDispositivosMax")
        ? parseInt(formData.get("limiteDispositivosMax") as string)
        : null,
      badgeTexto: (formData.get("badgeTexto") as string) || null,
      textoDecisao: (formData.get("textoDecisao") as string) || null,
      scoreBase: parseInt(formData.get("scoreBase") as string) || 50,
    };

    // DEBUG: Mostrar dados antes de enviar
    console.log("📤 Enviando dados:", {
      ...data,
      categorias: data.categorias,
      textosUpsell: data.textosUpsell,
      svasUpsell: data.svasUpsell,
      permiteCalculadoraLinhas: data.permiteCalculadoraLinhas,
      beneficios: data.beneficios,
      diferenciais: data.diferenciais,
    });

    if (editando) {
      atualizarMutation.mutate({ id: editando.id, data });
    } else {
      criarMutation.mutate(data);
    }
  };

  const formatPreco = (centavos: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(centavos / 100);
  };

  // Produtos filtrados e ordenados
  const produtosFiltrados = useMemo(() => {
    let resultado = produtos;

    // Busca por nome
    if (busca) {
      resultado = resultado.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          p.descricao?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por operadora
    if (filtroOperadora !== "todos") {
      resultado = resultado.filter((p) => p.operadora === filtroOperadora);
    }

    // Filtro por categoria
    if (filtroCategoria !== "todos") {
      resultado = resultado.filter((p) => p.categoria === filtroCategoria);
    }

    // Filtro por status
    if (filtroStatus === "ativo") {
      resultado = resultado.filter((p) => p.ativo);
    } else if (filtroStatus === "inativo") {
      resultado = resultado.filter((p) => !p.ativo);
    }

    // Filtro por tipo pessoa
    if (filtroTipoPessoa !== "todos") {
      resultado = resultado.filter(
        (p) => p.tipoPessoa === filtroTipoPessoa || p.tipoPessoa === "ambos"
      );
    }

    // Ordenação
    resultado = [...resultado].sort((a, b) => {
      if (ordenacao === "nome") {
        return a.nome.localeCompare(b.nome);
      } else if (ordenacao === "preco") {
        return a.preco - b.preco;
      } else if (ordenacao === "operadora") {
        return a.operadora.localeCompare(b.operadora);
      }
      return 0;
    });

    return resultado;
  }, [
    produtos,
    busca,
    filtroOperadora,
    filtroCategoria,
    filtroStatus,
    filtroTipoPessoa,
    ordenacao,
  ]);

  // Paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indexInicio, indexFim);

  // Reset página quando filtros mudam
  const resetPagina = () => setPaginaAtual(1);

  // Estatísticas
  const stats = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => p.ativo).length;
    const precoMedio =
      produtos.length > 0
        ? produtos.reduce((sum, p) => sum + p.preco, 0) / produtos.length
        : 0;
    const porOperadora = produtos.reduce((acc, p) => {
      acc[p.operadora] = (acc[p.operadora] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, ativos, precoMedio, porOperadora };
  }, [produtos]);

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div
      className="p-4 md:p-8 space-y-6"
      style={{ background: "#FAFAFA", minHeight: "100vh" }}
    >
      {/* Header com Estatísticas */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#111111" }}>
              Produtos E-commerce
            </h1>
            <p style={{ color: "#555555" }}>
              Gerencie os planos e ofertas disponíveis
            </p>
          </div>
          <Button
            onClick={() => {
              setEditando(null);
              setSvasSelecionados([]);
              setCategoriasSelecionadas([]);
              setTextosUpsell([""]);
              setDialogOpen(true);
            }}
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
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    Total de Produtos
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#111111" }}
                  >
                    {stats.total}
                  </p>
                </div>
                <Package className="h-8 w-8" style={{ color: "#1E90FF" }} />
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
                    Produtos Ativos
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#111111" }}
                  >
                    {stats.ativos}
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
                    Preço Médio
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#111111" }}
                  >
                    {formatPreco(stats.precoMedio)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8" style={{ color: "#1E90FF" }} />
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
              <div>
                <p className="text-sm mb-2" style={{ color: "#555555" }}>
                  Por Operadora
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.porOperadora).map(([op, count]) => (
                    <div key={op} className="flex justify-between text-sm">
                      <span
                        className="font-medium"
                        style={{ color: "#111111" }}
                      >
                        {op === "V" ? "VIVO" : op === "C" ? "CLARO" : "TIM"}:
                      </span>
                      <span style={{ color: "#555555" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" style={{ color: "#1E90FF" }} />
            <h3 className="font-semibold" style={{ color: "#111111" }}>
              Filtros
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Operadora */}
            <div>
              <Select
                value={filtroOperadora}
                onValueChange={(v) => {
                  setFiltroOperadora(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Operadoras</SelectItem>
                  <SelectItem value="V">VIVO</SelectItem>
                  <SelectItem value="C">CLARO</SelectItem>
                  <SelectItem value="T">TIM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <Select
                value={filtroCategoria}
                onValueChange={(v) => {
                  setFiltroCategoria(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Select
                value={filtroStatus}
                onValueChange={(v) => {
                  setFiltroStatus(v);
                  resetPagina();
                }}
              >
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

            {/* Tipo Pessoa */}
            <div>
              <Select
                value={filtroTipoPessoa}
                onValueChange={(v) => {
                  setFiltroTipoPessoa(v);
                  resetPagina();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-slate-600">
              Mostrando <span className="font-semibold">{indexInicio + 1}</span>{" "}
              -{" "}
              <span className="font-semibold">
                {Math.min(indexFim, produtosFiltrados.length)}
              </span>{" "}
              de{" "}
              <span className="font-semibold">{produtosFiltrados.length}</span>{" "}
              produtos
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  Itens por página:
                </span>
                <Select
                  value={itensPorPagina.toString()}
                  onValueChange={(v) => {
                    setItensPorPagina(Number(v));
                    resetPagina();
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Ordenar por:</span>
                <Select
                  value={ordenacao}
                  onValueChange={(v: any) => setOrdenacao(v)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="preco">Preço</SelectItem>
                    <SelectItem value="operadora">Operadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card
        style={{
          background: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent className="pt-6">
          \n{" "}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Velocidade/Franquia</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosPaginados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-slate-500 py-8"
                  >
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtosPaginados.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: "#111111" }}
                        >
                          {produto.nome}
                        </div>
                        {produto.destaque && (
                          <Badge
                            style={{
                              background: "#FF6B35",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "6px",
                            }}
                            className="mt-1"
                          >
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {produto.operadora === "V"
                          ? "VIVO"
                          : produto.operadora === "C"
                          ? "CLARO"
                          : "TIM"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{produto.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {produto.velocidade && (
                          <div style={{ color: "#111111" }}>
                            {produto.velocidade}
                          </div>
                        )}
                        {produto.franquia && (
                          <div style={{ color: "#555555" }}>
                            {produto.franquia}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="font-semibold"
                        style={{ color: "#111111" }}
                      >
                        {formatPreco(produto.preco)}
                      </div>
                      {produto.fidelidade > 0 && (
                        <div className="text-xs" style={{ color: "#555555" }}>
                          {produto.fidelidade} meses
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {produto.tipoPessoa === "PF"
                          ? "PF"
                          : produto.tipoPessoa === "PJ"
                          ? "PJ"
                          : "Ambos"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {produto.ativo ? (
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
                          onClick={() => {
                            setEditando(produto);
                            setSvasSelecionados(produto.svasUpsell || []);
                            // @ts-ignore - categorias pode não existir em produtos antigos
                            setCategoriasSelecionadas(produto.categorias || [produto.categoria]);
                            // @ts-ignore - textosUpsell pode não existir em produtos antigos
                            setTextosUpsell(
                              produto.textosUpsell &&
                                produto.textosUpsell.length > 0
                                ? produto.textosUpsell
                                : [""]
                            );
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar este produto?"
                              )
                            ) {
                              deletarMutation.mutate(produto.id);
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
          {/* Controles de Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600">
                Página <span className="font-semibold">{paginaAtual}</span> de{" "}
                <span className="font-semibold">{totalPaginas}</span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((page) => {
                      // Mostrar: primeira, última, atual e ±1 da atual
                      return (
                        page === 1 ||
                        page === totalPaginas ||
                        Math.abs(page - paginaAtual) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Adicionar "..." entre números não consecutivos
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <Button
                            variant={
                              page === paginaAtual ? "default" : "outline"
                            }
                            size="icon"
                            onClick={() => setPaginaAtual(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaAtual === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input name="nome" defaultValue={editando?.nome} required />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                name="descricao"
                defaultValue={editando?.descricao || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Categorias (selecione uma ou mais)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {categorias.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`cat-${cat.slug}`}
                        checked={categoriasSelecionadas.includes(cat.slug)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoriasSelecionadas([...categoriasSelecionadas, cat.slug]);
                          } else {
                            setCategoriasSelecionadas(
                              categoriasSelecionadas.filter((c) => c !== cat.slug)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`cat-${cat.slug}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cat.nome}
                      </label>
                    </div>
                  ))}
                </div>
                {categoriasSelecionadas.length === 0 && (
                  <p className="text-sm text-red-500">
                    Selecione pelo menos uma categoria
                  </p>
                )}
              </div>

              <div>
                <Label>Operadora</Label>
                <Select
                  name="operadora"
                  defaultValue={editando?.operadora || "V"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V">VIVO</SelectItem>
                    <SelectItem value="C">CLARO</SelectItem>
                    <SelectItem value="T">TIM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Velocidade</Label>
                <Input
                  name="velocidade"
                  defaultValue={editando?.velocidade || ""}
                  placeholder="Ex: 500 Mbps"
                />
              </div>

              <div>
                <Label>Franquia</Label>
                <Input
                  name="franquia"
                  defaultValue={editando?.franquia || ""}
                  placeholder="Ex: Ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  name="preco"
                  type="number"
                  step="0.01"
                  defaultValue={editando ? editando.preco / 100 : ""}
                  required
                />
              </div>

              <div>
                <Label>Instalação (R$)</Label>
                <Input
                  name="precoInstalacao"
                  type="number"
                  step="0.01"
                  defaultValue={
                    editando?.precoInstalacao
                      ? editando.precoInstalacao / 100
                      : 0
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fidelidade (meses)</Label>
                <Input
                  name="fidelidade"
                  type="number"
                  defaultValue={editando?.fidelidade || 0}
                />
              </div>

              <div>
                <Label>Tipo Pessoa</Label>
                <Select
                  name="tipoPessoa"
                  defaultValue={editando?.tipoPessoa || "ambos"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Benefícios (um por linha)</Label>
              <Textarea
                name="beneficios"
                defaultValue={editando?.beneficios?.join("\n") || ""}
                rows={4}
              />
            </div>

            <div>
              <Label>Diferenciais (um por linha) - Colapsáveis no card</Label>
              <Textarea
                name="diferenciais"
                defaultValue={editando?.diferenciais?.join("\n") || ""}
                rows={4}
                placeholder="Recursos extras que aparecem colapsados..."
              />
            </div>

            {/* NOVOS CAMPOS - SISTEMA DE RECOMENDAÇÃO INTELIGENTE */}
            <div className="border-t pt-4 mt-4">
              \n{" "}
              <h3 className="text-sm font-semibold mb-3">
                Sistema de Recomendação Inteligente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modalidade</Label>
                  <Select
                    name="modalidade"
                    defaultValue={editando?.modalidade || "ambos"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo Número</SelectItem>
                      <SelectItem value="portabilidade">
                        Portabilidade
                      </SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Score Base (0-100)</Label>
                  <Input
                    name="scoreBase"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={editando?.scoreBase || 50}
                  />
                </div>
              </div>
              <div>
                <Label>Uso Recomendado (separado por vírgulas)</Label>
                <Input
                  name="usoRecomendado"
                  defaultValue={editando?.usoRecomendado?.join(", ") || ""}
                  placeholder="Ex: trabalho, streaming, jogos"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Opções: trabalho, streaming, jogos, basico, equipe
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Limite Mínimo de Dispositivos</Label>
                  <Input
                    name="limiteDispositivosMin"
                    type="number"
                    min="0"
                    defaultValue={editando?.limiteDispositivosMin || ""}
                  />
                </div>

                <div>
                  <Label>Limite Máximo de Dispositivos</Label>
                  <Input
                    name="limiteDispositivosMax"
                    type="number"
                    min="0"
                    defaultValue={editando?.limiteDispositivosMax || ""}
                  />
                </div>
              </div>
              <div>
                <Label>Badge de Destaque</Label>
                <Input
                  name="badgeTexto"
                  defaultValue={editando?.badgeTexto || ""}
                  placeholder="Ex: Mais Vendido, Ultra Velocidade"
                />
              </div>
              <div>
                <Label>Texto de Decisão (Por que escolher este plano?)</Label>
                <Textarea
                  name="textoDecisao"
                  defaultValue={editando?.textoDecisao || ""}
                  rows={3}
                  placeholder="Ex: Ideal para quem precisa de alta velocidade e franquia ilimitada"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  name="ativo"
                  defaultChecked={editando?.ativo !== false}
                />
                <Label>Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  name="destaque"
                  defaultChecked={editando?.destaque || false}
                />
                <Label>Destaque</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  name="permiteCalculadoraLinhas"
                  defaultChecked={editando?.permiteCalculadoraLinhas || false}
                />
                <Label>Calculadora de Linhas</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  name="precisaEnderecoInstalacao"
                  defaultChecked={editando?.precisaEnderecoInstalacao || false}
                />
                <Label>Precisa Endereço Instalação</Label>
              </div>
            </div>

            {/* Upsell - Múltiplos Textos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Textos do Upsell (opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTextosUpsell([...textosUpsell, ""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Texto
                </Button>
              </div>
              <div className="space-y-2">
                {textosUpsell.map((texto, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="shrink-0 min-w-[100px] justify-center">
                        {index === 0 ? "Checkout" : index === 1 ? "Pós-Checkout" : index === 2 ? "Painel" : `Momento ${index + 1}`}
                      </Badge>
                      <Input
                        value={texto}
                        onChange={(e) => {
                          const novosTextos = [...textosUpsell];
                          novosTextos[index] = e.target.value;
                          setTextosUpsell(novosTextos);
                        }}
                        placeholder={
                          index === 0 
                            ? "Ex: Antes de finalizar, aproveite nosso [nome_servico]!" 
                            : index === 1 
                            ? "Ex: Parabéns! Adicione [nome_servico] ao seu pedido"
                            : "Ex: Aproveite para incluir [nome_servico] agora!"
                        }
                        className="flex-1"
                      />
                    </div>
                    {textosUpsell.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setTextosUpsell(
                            textosUpsell.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>Momento 1 (Checkout):</strong> Exibido durante a finalização do pedido</p>
                <p>• <strong>Momento 2 (Pós-Checkout):</strong> Exibido após confirmação do pedido</p>
                <p>• <strong>Momento 3 (Painel):</strong> Exibido nos detalhes do pedido no painel do cliente</p>
                <p>• Sistema oferece SVAs sequencialmente, um por vez, respeitando a ordem e limite de 3 ofertas</p>
                <p>
                  • Use variáveis:{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    [nome_servico]
                  </code>{" "}
                  e <code className="bg-slate-100 px-1 rounded">[preco]</code>
                </p>
                <p>• Exemplo: "Adicione [nome_servico] por apenas [preco]!"</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>SVAs para Upsell</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto bg-slate-50 space-y-2">
                {produtosSVA.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto SVA cadastrado ainda. Crie produtos com
                    categoria "sva" primeiro.
                  </p>
                ) : (
                  produtosSVA.map((sva) => (
                    <div
                      key={sva.id}
                      className="flex items-start space-x-3 p-2 rounded-md hover:bg-white transition-colors"
                    >
                      <Checkbox
                        id={`sva-${sva.id}`}
                        checked={svasSelecionados.includes(sva.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSvasSelecionados([...svasSelecionados, sva.id]);
                          } else {
                            setSvasSelecionados(
                              svasSelecionados.filter((id) => id !== sva.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`sva-${sva.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium text-slate-900">
                          {sva.nome}
                        </div>
                        <div className="text-xs text-slate-600">
                          {(sva.preco / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                          /mês
                          {sva.descricao &&
                            ` • ${sva.descricao.substring(0, 50)}...`}
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {svasSelecionados.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {svasSelecionados.length} SVA
                  {svasSelecionados.length > 1 ? "s" : ""} selecionado
                  {svasSelecionados.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
