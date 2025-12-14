/**
 * Componente EmptyStatePlanos
 * Exibido quando nenhum plano é compatível com os filtros ativos
 *
 * REGRAS:
 * - Explica claramente por que não há resultados
 * - Lista critérios ativos
 * - Oferece sugestões de ajustes (aplicadas imediatamente)
 * - Nunca mostra planos incompatíveis
 */

import { SearchX, Filter, Users, Signal, Package } from "lucide-react";
import type { ContextoAtivo } from "@/types/contexto";

interface EmptyStatePlanosProps {
  contextoAtivo: ContextoAtivo;
  onRemoverOperadora: () => void;
  onReduzirLinhas: () => void;
  onRemoverCategoria: () => void;
  onVerTodos: () => void;
  criteriosBloqueadores?: string[];
}

const OPERADORA_NAMES: Record<string, string> = {
  V: "Vivo",
  C: "Claro",
  T: "TIM",
};

export default function EmptyStatePlanos({
  contextoAtivo,
  onRemoverOperadora,
  onReduzirLinhas,
  onRemoverCategoria,
  onVerTodos,
  criteriosBloqueadores = [],
}: EmptyStatePlanosProps) {
  // Montar lista de critérios ativos
  const criterios: string[] = [];

  if (contextoAtivo.linhas && contextoAtivo.linhas > 0) {
    criterios.push(
      `${contextoAtivo.linhas} ${
        contextoAtivo.linhas === 1 ? "linha" : "linhas"
      }`
    );
  }

  if (contextoAtivo.categorias.length > 0) {
    const categoriaFormatada = contextoAtivo.categorias
      .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
      .join(", ");
    criterios.push(categoriaFormatada);
  }

  if (contextoAtivo.operadoras.length > 0) {
    const operadorasFormatadas = contextoAtivo.operadoras
      .map((op) => OPERADORA_NAMES[op] || op)
      .join(", ");
    criterios.push(`Operadora ${operadorasFormatadas}`);
  }

  if (contextoAtivo.fibra) {
    criterios.push("Fibra óptica");
  }

  if (contextoAtivo.combo) {
    criterios.push("Combo completo");
  }

  if (contextoAtivo.tipoPessoa !== "ambos") {
    criterios.push(
      contextoAtivo.tipoPessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"
    );
  }

  // Definir sugestões baseadas em critérios bloqueadores
  const sugestoes = [];

  // 1. Remover operadora (prioridade alta)
  if (
    contextoAtivo.operadoras.length > 0 &&
    criteriosBloqueadores.includes("operadora")
  ) {
    sugestoes.push({
      label: "Remover filtro de operadora",
      icon: Signal,
      onClick: onRemoverOperadora,
      descricao: "Ver planos de todas as operadoras",
    });
  }

  // 2. Reduzir linhas (prioridade média)
  if (
    contextoAtivo.linhas &&
    contextoAtivo.linhas > 1 &&
    criteriosBloqueadores.includes("linhas")
  ) {
    sugestoes.push({
      label: "Ajustar quantidade de linhas",
      icon: Users,
      onClick: onReduzirLinhas,
      descricao: `Reduzir para ${Math.max(
        1,
        contextoAtivo.linhas - 1
      )} linha(s)`,
    });
  }

  // 3. Remover/trocar categoria (prioridade média)
  if (
    contextoAtivo.categorias.length > 0 &&
    criteriosBloqueadores.includes("categoria")
  ) {
    sugestoes.push({
      label: "Ver outras categorias",
      icon: Package,
      onClick: onRemoverCategoria,
      descricao: "Explorar combos e outros planos",
    });
  }

  // 4. Ver todos (sempre disponível)
  sugestoes.push({
    label: "Ver todos os planos",
    icon: Filter,
    onClick: onVerTodos,
    descricao: "Remover todos os filtros",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Ícone */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <SearchX style={{ width: "40px", height: "40px", color: "#999999" }} />
      </div>

      {/* Título */}
      <h3
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111111",
          marginBottom: "12px",
        }}
      >
        Nenhum plano encontrado
      </h3>

      {/* Descrição */}
      <p
        style={{
          fontSize: "16px",
          color: "#666666",
          marginBottom: "24px",
          lineHeight: "1.5",
        }}
      >
        Não temos planos que atendem todos esses critérios:
      </p>

      {/* Lista de critérios ativos */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 32px 0",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {criterios.map((criterio, index) => (
          <li
            key={index}
            style={{
              fontSize: "14px",
              color: "#888888",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#1E90FF",
              }}
            />
            {criterio}
          </li>
        ))}
      </ul>

      {/* Sugestões */}
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#555555",
            marginBottom: "16px",
          }}
        >
          Experimente:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sugestoes.map((sugestao, index) => {
            const Icon = sugestao.icon;
            return (
              <button
                key={index}
                onClick={sugestao.onClick}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "2px solid #E0E0E0",
                  borderRadius: "12px",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1E90FF";
                  e.currentTarget.style.backgroundColor = "#F8FBFF";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E0E0E0";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#F0F8FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    style={{ width: "20px", height: "20px", color: "#1E90FF" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#111111",
                      marginBottom: "4px",
                    }}
                  >
                    {sugestao.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888888" }}>
                    {sugestao.descricao}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensagem de rodapé */}
      <p
        style={{
          fontSize: "13px",
          color: "#AAAAAA",
          marginTop: "32px",
          fontStyle: "italic",
        }}
      >
        Ajuste os filtros para encontrar o plano ideal para você
      </p>
    </div>
  );
}
