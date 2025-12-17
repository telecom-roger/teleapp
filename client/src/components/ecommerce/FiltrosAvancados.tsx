import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FiltrosAvancadosProps {
  categorias: Array<{ id: string; nome: string; slug: string }>;
  categoriasFiltro: string[];
  toggleCategoria: (slug: string) => void;
}

export function FiltrosAvancados({
  categorias,
  categoriasFiltro,
  toggleCategoria,
}: FiltrosAvancadosProps) {
  const [open, setOpen] = useState(false);
  
  // Filtrar apenas as categorias que NÃO estão visíveis (móvel, fibra, combo)
  const categoriasAvancadas = categorias.filter(
    (cat) => !['movel', 'fibra', 'combo'].includes(cat.slug)
  );
  
  const filtrosAtivos = categoriasAvancadas.filter((cat) => 
    categoriasFiltro.includes(cat.slug)
  ).length;

  if (categoriasAvancadas.length === 0) {
    return null; // Não mostrar o botão se não houver categorias avançadas
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-medium border border-gray-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ver soluções adicionais
          {filtrosAtivos > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
              {filtrosAtivos}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-gray-900">Mais Serviços</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {categoriasAvancadas.map((cat) => {
            const isSelected = categoriasFiltro.includes(cat.slug);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.slug)}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200 flex items-start gap-3",
                  isSelected
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all",
                    isSelected ? "bg-blue-600 border-0" : "bg-white border-2 border-gray-300"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {cat.nome}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <SheetTrigger asChild>
            <Button className="w-full h-12 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">
              Ver planos disponíveis
            </Button>
          </SheetTrigger>
        </div>
      </SheetContent>
    </Sheet>
  );
}
