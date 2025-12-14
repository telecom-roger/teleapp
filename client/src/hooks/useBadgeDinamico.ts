/**
 * Hook de Badges Dinâmicos
 * Calcula badge principal que EXPLICA por que o plano faz sentido
 *
 * REGRAS:
 * - Apenas UM badge por plano
 * - Badge alinhado com contexto ativo
 * - Nunca contradiz filtros ativos
 * - Pode usar variáveis dinâmicas
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
 * Calcula badge dinâmico para um produto
 */
export function calcularBadgeDinamico(
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo
): BadgeDinamico | null {
  const badges: BadgeDinamico[] = [];

  // ==================== PRIORIDADE 10: LINHAS ====================
  // Se usuário especificou múltiplas linhas
  if (
    contextoAtivo.linhas &&
    contextoAtivo.linhas > 1 &&
    produto.permiteCalculadoraLinhas
  ) {
    // Multiplicação simples: quantidade de linhas × preço unitário
    const valorTotal = produto.preco * contextoAtivo.linhas;

    badges.push({
      texto: `${contextoAtivo.linhas} linhas ${formatPrice(valorTotal)} total`,
      variante: "success",
      prioridade: 10,
      motivo: "calculadora-linhas",
    });
  }

  // ==================== PRIORIDADE 9: TIPO PESSOA ====================
  // Se PJ e plano é específico para PJ
  if (contextoAtivo.tipoPessoa === "PJ" && produto.tipoPessoa === "PJ") {
    badges.push({
      texto: "Ideal para empresas",
      variante: "info",
      prioridade: 9,
      motivo: "tipo-pessoa-pj",
    });
  }

  // Se PF e plano tem benefícios para pessoa física
  if (contextoAtivo.tipoPessoa === "PF" && produto.tipoPessoa === "PF") {
    if (produto.categoria === "movel" || produto.categoria === "combo") {
      badges.push({
        texto: "Indicado para uso diário",
        variante: "info",
        prioridade: 8,
        motivo: "tipo-pessoa-pf",
      });
    }
  }

  // ==================== PRIORIDADE 8: FIBRA ====================
  // Se usuário está interessado em fibra
  if (contextoAtivo.fibra && produto.categoria === "fibra") {
    const velocidade = produto.velocidade || "";
    if (velocidade) {
      badges.push({
        texto: `Fibra ${velocidade}`,
        variante: "primary",
        prioridade: 8,
        motivo: "fibra-velocidade",
      });
    }
  }

  // ==================== PRIORIDADE 7: BADGE CUSTOMIZADO ====================
  // Badge definido no banco de dados
  if (produto.badgeTexto && produto.badgeTexto.trim()) {
    // Substituir variáveis no texto
    let textoFinal = produto.badgeTexto;

    // [preco] -> preço formatado
    if (textoFinal.includes("[preco]")) {
      textoFinal = textoFinal.replace("[preco]", formatPrice(produto.preco));
    }

    // [velocidade] -> velocidade do plano
    if (textoFinal.includes("[velocidade]") && produto.velocidade) {
      textoFinal = textoFinal.replace("[velocidade]", produto.velocidade);
    }

    // [franquia] -> franquia do plano
    if (textoFinal.includes("[franquia]") && produto.franquia) {
      textoFinal = textoFinal.replace("[franquia]", produto.franquia);
    }

    // [linhas] -> quantidade de linhas do contexto
    if (textoFinal.includes("[linhas]") && contextoAtivo.linhas) {
      textoFinal = textoFinal.replace(
        "[linhas]",
        contextoAtivo.linhas.toString()
      );
    }

    badges.push({
      texto: textoFinal,
      variante: "info",
      prioridade: 7,
      motivo: "badge-customizado",
    });
  }

  // ==================== PRIORIDADE 6: DESTAQUE ====================
  // Plano em destaque administrativo
  if (produto.destaque) {
    badges.push({
      texto: "Mais popular",
      variante: "default",
      prioridade: 6,
      motivo: "destaque-admin",
    });
  }

  // ==================== PRIORIDADE 5: ECONOMIA ====================
  // Se plano tem preço competitivo (abaixo de R$ 100 para móvel/fibra)
  if (produto.preco < 10000) {
    if (produto.categoria === "movel" || produto.categoria === "fibra") {
      badges.push({
        texto: "Ótimo custo-benefício",
        variante: "success",
        prioridade: 5,
        motivo: "preco-competitivo",
      });
    }
  }

  // ==================== PRIORIDADE 4: COMBO ====================
  // Se plano é combo e usuário demonstrou interesse
  if (produto.categoria === "combo" && contextoAtivo.combo) {
    badges.push({
      texto: "Pacote completo",
      variante: "info",
      prioridade: 4,
      motivo: "combo-completo",
    });
  }

  // ==================== PRIORIDADE 3: SLA ====================
  // Se plano tem SLA (empresarial)
  if (produto.sla && contextoAtivo.tipoPessoa === "PJ") {
    badges.push({
      texto: "Com SLA garantido",
      variante: "info",
      prioridade: 3,
      motivo: "sla-empresarial",
    });
  }

  // ==================== PRIORIDADE 2: FRANQUIA ====================
  // Se plano móvel tem franquia generosa
  if (produto.categoria === "movel" && produto.franquia) {
    const franquiaLower = produto.franquia.toLowerCase();
    if (franquiaLower.includes("ilimitado")) {
      badges.push({
        texto: "Internet ilimitada",
        variante: "success",
        prioridade: 2,
        motivo: "franquia-ilimitada",
      });
    } else {
      // Extrair número de GB
      const match = produto.franquia.match(/(\d+)\s*GB/i);
      if (match && parseInt(match[1]) >= 50) {
        badges.push({
          texto: `${produto.franquia} de internet`,
          variante: "info",
          prioridade: 2,
          motivo: "franquia-generosa",
        });
      }
    }
  }

  // ==================== SELECIONAR BADGE DE MAIOR PRIORIDADE ====================
  if (badges.length === 0) return null;

  // Ordenar por prioridade (maior primeiro)
  badges.sort((a, b) => b.prioridade - a.prioridade);

  const badgeSelecionado = badges[0];

  console.log(
    `🏷️ Badge para "${produto.nome}": "${badgeSelecionado.texto}" (${badgeSelecionado.motivo})`
  );

  return badgeSelecionado;
}

/**
 * Hook para calcular badges de múltiplos produtos
 */
export function useBadgeDinamico(
  produtos: EcommerceProduct[],
  contextoAtivo: ContextoAtivo
): Map<string, BadgeDinamico | null> {
  return useMemo(() => {
    const badgesMap = new Map<string, BadgeDinamico | null>();

    produtos.forEach((produto) => {
      const badge = calcularBadgeDinamico(produto, contextoAtivo);
      badgesMap.set(produto.id, badge);
    });

    const totalComBadge = Array.from(badgesMap.values()).filter(
      (b) => b !== null
    ).length;
    console.log(
      `🏷️ ${totalComBadge} de ${produtos.length} produtos têm badges`
    );

    return badgesMap;
  }, [produtos, contextoAtivo]);
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
