import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Briefcase, Check, HelpCircle, X, Wifi, Smartphone, Tv, Package, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { FiltrosAvancados } from "./FiltrosAvancados";

const OPERADORA_COLORS: Record<string, { name: string }> = {
  V: { name: "VIVO" },
  C: { name: "CLARO" },
  T: { name: "TIM" },
};

interface FiltrosHierarquicosProps {
  // Nível 1 - Decisões principais
  tipoPessoaFiltro: "PF" | "PJ";
  setTipoPessoa: (tipo: "PF" | "PJ") => void;
  tipoContratacao: "linha_nova" | "portabilidade";
  setTipoContratacao: (tipo: "linha_nova" | "portabilidade") => void;
  linhas: number | null;
  setLinhas: (linhas: number) => void;
  
  // Nível 2 - Filtros estratégicos
  operadorasFiltro: string[];
  setOperadora: (ops: string[]) => void;
  toggleOperadora: (op: string) => void;
  categoriasFiltro: string[];
  setCategoria: (cats: string[]) => void;
  toggleCategoria: (cat: string) => void;
  categorias: Array<{ id: string; nome: string; slug: string }>;
  
  // Ações
  limparFiltros: () => void;
  filtrosAtivos: number;
  
  // UI States
  mostrarCampoPersonalizado: boolean;
  setMostrarCampoPersonalizado: (show: boolean) => void;
  linhasPersonalizado: string;
  setLinhasPersonalizado: (value: string) => void;
  tooltipOperadoraOpen: boolean;
  setTooltipOperadoraOpen: (open: boolean) => void;
  tooltipCategoriaOpen: boolean;
  setTooltipCategoriaOpen: (open: boolean) => void;
}

const getIconeCategoria = (slug: string) => {
  const icons: Record<string, any> = {
    fibra: Wifi,
    movel: Smartphone,
    tv: Tv,
    combo: Package,
    sva: Shield,
    aparelho: Zap,
  };
  return icons[slug] || Package;
};

export function FiltrosHierarquicos(props: FiltrosHierarquicosProps) {
  const {
    tipoPessoaFiltro,
    setTipoPessoa,
    tipoContratacao,
    setTipoContratacao,
    linhas,
    setLinhas,
    operadorasFiltro,
    setOperadora,
    toggleOperadora,
    categoriasFiltro,
    setCategoria,
    toggleCategoria,
    categorias,
    limparFiltros,
    filtrosAtivos,
    mostrarCampoPersonalizado,
    setMostrarCampoPersonalizado,
    linhasPersonalizado,
    setLinhasPersonalizado,
    tooltipOperadoraOpen,
    setTooltipOperadoraOpen,
    tooltipCategoriaOpen,
    setTooltipCategoriaOpen,
  } = props;

  return (
    <div className="space-y-6">
      {/* Card: Decisões Principais */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Para quem é o plano */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-900">
              Escolha seu Perfil
            </label>
            <div className="flex gap-2">
              {[
                { value: "PF" as const, label: "Pessoa Física", icon: User },
                { value: "PJ" as const, label: "Empresas", icon: Briefcase },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoPessoa(tipo.value)}
                  className={cn(
                    "flex-1 h-12 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2",
                    tipoPessoaFiltro === tipo.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  <tipo.icon className="w-4 h-4" />
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de contratação */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-900">
              Linha nova ou portabilidade
            </label>
            <div className="flex gap-2">
              {[
                { value: "linha_nova" as const, label: "Linha Nova" },
                { value: "portabilidade" as const, label: "Portabilidade" },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => {
                    console.log("🔄 Usuário alterou tipo de contratação:", tipo.value);
                    setTipoContratacao(tipo.value);
                  }}
                  className={cn(
                    "flex-1 h-12 px-4 rounded-xl font-medium text-sm transition-all duration-200",
                    tipoContratacao === tipo.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantas linhas */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-900">
              Quantas linhas
            </label>
            {!mostrarCampoPersonalizado ? (
              <select
                value={linhas || 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 10) {
                    setMostrarCampoPersonalizado(true);
                    setLinhasPersonalizado("10");
                    setLinhas(10);
                    setTimeout(() => {
                      document.getElementById("linhas-personalizado")?.focus();
                    }, 100);
                  } else {
                    setLinhas(val);
                  }
                }}
                className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "linha" : "linhas"}
                  </option>
                ))}
                <option value={10}>10+ linhas</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  id="linhas-personalizado"
                  type="number"
                  min="10"
                  max="999"
                  value={linhasPersonalizado}
                  onChange={(e) => {
                    setLinhasPersonalizado(e.target.value);
                    const val = Number(e.target.value);
                    if (val >= 10) {
                      setLinhas(val);
                    }
                  }}
                  className="flex-1 h-12 px-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Qtd de linhas..."
                />
                <button
                  onClick={() => {
                    setMostrarCampoPersonalizado(false);
                    setLinhas(1);
                  }}
                  className="h-12 px-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card: Tipo de plano e Operadora */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de serviço */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-base font-semibold text-gray-900">
                Qual tipo de plano você busca
              </label>
              <Badge className="text-xs text-gray-500 bg-gray-100 border-0">
                Seleção múltipla
              </Badge>
              <TooltipProvider>
                <Tooltip open={tooltipCategoriaOpen} onOpenChange={setTooltipCategoriaOpen}>
                  <TooltipTrigger asChild>
                    <button className="focus:outline-none">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Você pode escolher mais de uma opção.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoria([])}
                className={cn(
                  "h-10 px-4 rounded-full text-sm font-medium transition-all",
                  categoriasFiltro.length === 0
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                )}
              >
                Todos
              </button>
              {categorias
                .filter((cat) => ['movel', 'fibra', 'combo'].includes(cat.slug))
                .map((cat) => {
                  const Icon = getIconeCategoria(cat.slug);
                  const isSelected = categoriasFiltro.includes(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.slug)}
                      className={cn(
                        "h-10 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                        isSelected
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.nome}
                    </button>
                  );
                })}
            </div>
          </div>
          
          {/* Operadora */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-base font-semibold text-gray-900">
                Operadora
              </label>
              <Badge className="text-xs text-gray-500 bg-gray-100 border-0">
                Seleção múltipla
              </Badge>
              <TooltipProvider>
                <Tooltip open={tooltipOperadoraOpen} onOpenChange={setTooltipOperadoraOpen}>
                  <TooltipTrigger asChild>
                    <button className="focus:outline-none">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Você pode escolher mais de uma opção.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setOperadora([])}
                className={cn(
                  "h-10 px-4 rounded-full text-sm font-medium transition-all",
                  operadorasFiltro.length === 0
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                )}
              >
                Todas
              </button>
              {Object.entries(OPERADORA_COLORS).map(([key, config]) => {
                const isSelected = operadorasFiltro.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleOperadora(key)}
                    className={cn(
                      "h-10 px-4 rounded-full text-sm font-medium transition-all",
                      isSelected
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    )}
                  >
                    {config.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 NÍVEL 3 - Filtros Avançados + Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <FiltrosAvancados
          categorias={categorias}
          categoriasFiltro={categoriasFiltro}
          toggleCategoria={toggleCategoria}
        />
        
        {filtrosAtivos > 0 && (
          <Button
            onClick={limparFiltros}
            variant="outline"
            size="sm"
            className="h-10 px-6 font-medium"
          >
            Recomeçar
          </Button>
        )}
      </div>
    </div>
  );
}
