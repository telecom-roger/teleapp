import { X, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
  filtrosAtivosCount: number;
}

export function FilterDrawer({
  isOpen,
  onClose,
  children,
  onApply,
  onClear,
  filtrosAtivosCount,
}: FilterDrawerProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Bloquear scroll do body quando drawer aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe gesture para fechar
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;

    // Se swipe para esquerda (fechando)
    if (isLeftSwipe) {
      onClose();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 lg:hidden"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-screen z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col lg:hidden"
        style={{
          width: "85%",
          maxWidth: "380px",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderBottom: "1px solid #E0E0E0",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal
              className="w-5 h-5"
              style={{ color: "#1E90FF" }}
            />
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#111111" }}>
                Filtros
              </h3>
              {filtrosAtivosCount > 0 && (
                <p className="text-xs" style={{ color: "#555555" }}>
                  {filtrosAtivosCount}{" "}
                  {filtrosAtivosCount === 1 ? "filtro ativo" : "filtros ativos"}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="transition-colors"
            style={{ color: "#555555" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#111111")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          {children}
        </div>

        {/* Footer - Sticky Buttons */}
        <div
          className="p-4 border-t"
          style={{
            borderTop: "1px solid #E0E0E0",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClear}
              className="flex-1 h-12 font-semibold transition-all"
              style={{
                border: "1px solid #E0E0E0",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                color: "#555555",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FF6B35";
                e.currentTarget.style.backgroundColor = "rgba(255,107,53,0.05)";
                e.currentTarget.style.color = "#FF6B35";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0E0E0";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#555555";
              }}
            >
              Limpar
            </Button>
            <Button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 h-12 font-bold shadow-lg border-0 transition-all duration-200"
              style={{
                backgroundColor: "#1E90FF",
                color: "#FFFFFF",
                borderRadius: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#00CFFF";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1E90FF";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
