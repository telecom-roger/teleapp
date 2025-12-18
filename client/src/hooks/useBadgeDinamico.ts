/**
 * Hook de Badges Dinâmicos
 * Calcula badge principal que EXPLICA por que o plano faz sentido
 *
 * REGRAS:
 * - Apenas UM badge por plano
 * - Badge alinhado com contexto ativo
 * - Nunca contradiz filtros ativos
 * - Randomização inteligente: escolhe texto aleatório dentro do grupo de prioridade
 * - Mantém consistência durante a sessão (mesmo produto + contexto = mesmo badge)
 */

import { useMemo } from "react";
import type { EcommerceProduct } from "@shared/schema";
import type { ContextoAtivo } from "@/types/contexto";

export interface BadgeDinamico {
  texto: string;
  variante: "default" | "success" | "info" | "warning" | "primary";
  prioridade: number;
  motivo?: string; // Para debug
}

/**
 * Formata preço em reais
 */
function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Gera hash simples de string para seed consistente
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seleciona texto aleatório de array baseado em seed (consistente)
 */
function escolherTextoAleatorio(textos: string[], seed: string): string {
  const hash = hashString(seed);
  const index = hash % textos.length;
  return textos[index];
}

/**
 * Substitui variáveis no texto
 */
function substituirVariaveis(
  texto: string,
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo
): string {
  let resultado = texto;

  // ⚠️ IMPORTANTE: Substituir padrões compostos ANTES das variáveis individuais
  // Cálculo de preço total para múltiplas linhas [linhas]x[preco]
  if (contextoAtivo.linhas && produto.preco) {
    const total = produto.preco * contextoAtivo.linhas;
    resultado = resultado.replace(/\[linhas\]x\[preco\]/g, formatPrice(total));
  }

  // Agora substituir variáveis individuais
  // [linhas]
  if (contextoAtivo.linhas) {
    resultado = resultado.replace(/\[linhas\]/g, contextoAtivo.linhas.toString());
  }

  // [preco]
  resultado = resultado.replace(/\[preco\]/g, formatPrice(produto.preco));

  // [velocidade]
  if (produto.velocidade) {
    resultado = resultado.replace(/\[velocidade\]/g, produto.velocidade);
  }

  // [franquia]
  if (produto.franquia) {
    resultado = resultado.replace(/\[franquia\]/g, produto.franquia);
  }

  return resultado;
}

/**
 * Calcula badge dinâmico para um produto
 */
export function calcularBadgeDinamico(
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo,
  scoreContextual?: number // Opcional: para badges de score alto
): BadgeDinamico | null {
  const badges: BadgeDinamico[] = [];
  const produtoCategorias = (produto as any).categorias || [produto.categoria];
  
  // Seed para randomização consistente (produto + contexto)
  const seed = `${produto.id}-${contextoAtivo.linhas || 0}-${contextoAtivo.tipoPessoa}-${contextoAtivo.fibra}-${contextoAtivo.combo}`;

  // ==================== PRIORIDADE 10: LINHAS / PREÇO ====================
  if (
    contextoAtivo.linhas &&
    contextoAtivo.linhas > 1 &&
    produto.permiteCalculadoraLinhas
  ) {
    const textos = [
      "Ideal para [linhas] linhas",
      "Melhor custo para [linhas]",
      "Plano ideal para [linhas] linhas",
      "Economia total para [linhas] linhas",
    ];
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-linhas");
    const textoFinal = substituirVariaveis(textoEscolhido, produto, contextoAtivo);

    badges.push({
      texto: textoFinal,
      variante: "success",
      prioridade: 10,
      motivo: "linhas-preco",
    });
  }

  // ==================== PRIORIDADE 9: EMPRESARIAL (PJ) ====================
  if (contextoAtivo.tipoPessoa === "PJ" && produto.tipoPessoa === "PJ") {
    const textos = [
      "Ideal para empresas",
      "Plano profissional",
      "Solução para negócios",
      "Desempenho para sua empresa",
      "Plano pensado para uso corporativo",
    ];
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-pj");

    badges.push({
      texto: textoEscolhido,
      variante: "info",
      prioridade: 9,
      motivo: "empresarial-pj",
    });
  }

  // ==================== PRIORIDADE 8: FIBRA / VELOCIDADE ====================
  if (contextoAtivo.fibra && produtoCategorias.includes("fibra")) {
    const textos = produto.velocidade
      ? [
          "Fibra de [velocidade]",
          "Alta velocidade em fibra óptica",
          "Velocidade ideal para sua rotina",
          "Conexão rápida e estável",
        ]
      : [
          "Internet fibra para alta performance",
          "Alta velocidade em fibra óptica",
          "Conexão rápida e estável",
        ];
    
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-fibra");
    const textoFinal = substituirVariaveis(textoEscolhido, produto, contextoAtivo);

    badges.push({
      texto: textoFinal,
      variante: "primary",
      prioridade: 8,
      motivo: "fibra-velocidade",
    });
  }

  // ==================== PRIORIDADE 7: BADGE CUSTOMIZADO ====================
  if (produto.badgeTexto && produto.badgeTexto.trim()) {
    const textoFinal = substituirVariaveis(
      produto.badgeTexto,
      produto,
      contextoAtivo
    );

    badges.push({
      texto: textoFinal,
      variante: "info",
      prioridade: 7,
      motivo: "badge-customizado",
    });
  }

  // ==================== PRIORIDADE 6: POPULARIDADE / DESTAQUE ====================
  if (produto.destaque) {
    const textos = [
      "Mais escolhido pelos clientes",
      "Plano mais popular",
      "Preferido dos usuários",
      "Alta procura",
      "Escolha frequente",
    ];
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-destaque");

    badges.push({
      texto: textoEscolhido,
      variante: "default",
      prioridade: 6,
      motivo: "destaque-popularidade",
    });
  }

  // ==================== PRIORIDADE 5: CUSTO-BENEFÍCIO ====================
  if (produto.preco < 10000) {
    const temMovelOuFibra = produtoCategorias.some((cat: string) =>
      ["movel", "fibra"].includes(cat)
    );
    if (temMovelOuFibra) {
      const textos = [
        "Ótimo custo-benefício",
        "Mais por menos",
        "Preço competitivo",
      ];
      const textoEscolhido = escolherTextoAleatorio(textos, seed + "-economia");

      badges.push({
        texto: textoEscolhido,
        variante: "success",
        prioridade: 5,
        motivo: "custo-beneficio",
      });
    }
  }

  // ==================== PRIORIDADE 4: COMBO ====================
  if (contextoAtivo.combo && produtoCategorias.includes("combo")) {
    const textos = [
      "Pacote completo",
      "Tudo em um só plano",
      "Mais serviços em um único pacote",
      "Combo pensado para você",
    ];
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-combo");

    badges.push({
      texto: textoEscolhido,
      variante: "info",
      prioridade: 4,
      motivo: "combo-completo",
    });
  }

  // ==================== PRIORIDADE 3: RECOMENDAÇÃO INTELIGENTE (SCORE ALTO) ====================
  if (scoreContextual && scoreContextual >= 85) {
    const textos = [
      "Recomendado para você",
      "Melhor opção para seu perfil",
      "Escolha inteligente",
      "Alinhado ao seu uso",
      "Plano ideal para seu contexto",
    ];
    const textoEscolhido = escolherTextoAleatorio(textos, seed + "-score");

    badges.push({
      texto: textoEscolhido,
      variante: "primary",
      prioridade: 3,
      motivo: "score-alto",
    });
  }

  // ==================== PRIORIDADE 2: INTERNET ILIMITADA (MÓVEL) ====================
  const temMovel = produtoCategorias.includes("movel");
  if (temMovel && produto.franquia) {
    const franquiaLower = produto.franquia.toLowerCase();
    if (franquiaLower.includes("ilimitado") || franquiaLower.includes("ilimitada")) {
      const textos = [
        "Internet ilimitada",
        "Uso sem preocupações",
        "Sem limite de dados",
        "Navegue à vontade",
        "Dados ilimitados",
      ];
      const textoEscolhido = escolherTextoAleatorio(textos, seed + "-ilimitado");

      badges.push({
        texto: textoEscolhido,
        variante: "success",
        prioridade: 2,
        motivo: "internet-ilimitada",
      });
    }
  }

  // ==================== SELECIONAR BADGE DE MAIOR PRIORIDADE ====================
  if (badges.length === 0) return null;

  // Ordenar por prioridade (maior primeiro)
  badges.sort((a, b) => b.prioridade - a.prioridade);

  return badges[0];
}

/**
 * Hook para calcular badges de múltiplos produtos
 */
export function useBadgeDinamico(
  produtos: EcommerceProduct[],
  contextoAtivo: ContextoAtivo,
  scoresMap?: Map<string, number> // Opcional: scores contextuais
): Map<string, BadgeDinamico | null> {
  return useMemo(() => {
    const badgesMap = new Map<string, BadgeDinamico | null>();

    produtos.forEach((produto) => {
      const score = scoresMap?.get(produto.id);
      const badge = calcularBadgeDinamico(produto, contextoAtivo, score);
      badgesMap.set(produto.id, badge);
    });

    const totalComBadge = Array.from(badgesMap.values()).filter(
      (b) => b !== null
    ).length;
    console.log(
      `🏷️ ${totalComBadge} de ${produtos.length} produtos têm badges`
    );

    return badgesMap;
  }, [produtos, contextoAtivo, scoresMap]);
}

/**
 * Hook conveniente para obter badge de um único produto
 */
export function useBadgeProduto(
  produto: EcommerceProduct | undefined,
  contextoAtivo: ContextoAtivo
): BadgeDinamico | null {
  return useMemo(() => {
    if (!produto) return null;
    return calcularBadgeDinamico(produto, contextoAtivo);
  }, [produto, contextoAtivo]);
}
