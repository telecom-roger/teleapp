/**
 * Hook de Score Contextual
 * Calcula pontuação dinâmica baseada em:
 * - Contexto ativo (40 pontos)
 * - Sinais comportamentais (30 pontos)
 * - Contexto inicial como desempate (10 pontos)
 * - Score base do produto (até 20 pontos)
 *
 * REGRA: Score só é calculado APÓS filtro hard de compatibilidade
 */

import { useMemo } from "react";
import type { EcommerceProduct } from "@shared/schema";
import type {
  ContextoAtivo,
  ContextoInicial,
  SinaisComportamentais,
} from "@/types/contexto";

export interface ProdutoComScore extends EcommerceProduct {
  scoreContextual: number;
  detalhesScore?: {
    scoreBase: number;
    pontuacaoContextoAtivo: number;
    pontuacaoSinais: number;
    pontuacaoContextoInicial: number;
    total: number;
  };
}

/**
 * Calcula score contextual para um produto individual
 */
export function calcularScoreContextual(
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo,
  contextoInicial: ContextoInicial | null,
  sinais: SinaisComportamentais
): number {
  let score = 0;
  let pontuacaoBase = 0;
  let pontuacaoContextoAtivo = 0;
  let pontuacaoSinais = 0;
  let pontuacaoContextoInicial = 0;

  // ==================== SCORE BASE (até 20 pontos) ====================
  // Score fixo definido no banco de dados
  if (produto.scoreBase) {
    pontuacaoBase = Math.min(produto.scoreBase / 5, 20); // Normaliza 0-100 para 0-20
  }

  // ==================== CONTEXTO ATIVO (até 40 pontos) ====================
  // Alinhamento com seleção atual - MAIOR PESO

  // Operadora selecionada (10 pontos)
  if (contextoAtivo.operadoras.length > 0) {
    if (contextoAtivo.operadoras.includes(produto.operadora)) {
      pontuacaoContextoAtivo += 10;
    }
  }

  // Categoria selecionada (10 pontos)
  if (contextoAtivo.categorias.length > 0) {
    if (contextoAtivo.categorias.includes(produto.categoria)) {
      pontuacaoContextoAtivo += 10;
    }
  }

  // Linhas - quanto mais próximo, melhor (10 pontos)
  if (contextoAtivo.linhas && contextoAtivo.linhas > 0) {
    const linhasPlano = produto.linhasInclusas || 1;
    if (linhasPlano === contextoAtivo.linhas) {
      pontuacaoContextoAtivo += 10; // Exatamente o que pediu
    } else if (Math.abs(linhasPlano - contextoAtivo.linhas) <= 1) {
      pontuacaoContextoAtivo += 5; // Próximo (±1 linha)
    }
  }

  // Uso recomendado definido (5 pontos)
  if (produto.usoRecomendado && produto.usoRecomendado.length > 0) {
    pontuacaoContextoAtivo += 5;
  }

  // Destaque do produto (5 pontos)
  if (produto.destaque) {
    pontuacaoContextoAtivo += 5;
  }

  // ==================== SINAIS COMPORTAMENTAIS (até 30 pontos) ====================
  // Padrões de uso durante a jornada
  
  // Verificar se sinais existe antes de usar
  if (sinais) {
    // Plano já visualizado (8 pontos)
    if (sinais.planosVisualizados?.includes(produto.id)) {
      pontuacaoSinais += 8;
    }

    // Plano comparado anteriormente (6 pontos)
    if (sinais.planosComparados?.includes(produto.id)) {
      pontuacaoSinais += 6;
    }

    // Plano já foi adicionado ao carrinho (4 pontos)
    if (sinais.planosAdicionadosCarrinho?.includes(produto.id)) {
      pontuacaoSinais += 4;
    }

    // Tempo gasto na categoria deste plano (até 8 pontos)
    const tempoCategoriaMs = sinais.tempoPorCategoria?.[produto.categoria] || 0;
    if (tempoCategoriaMs > 60000) {
      pontuacaoSinais += 8; // +1 minuto
    } else if (tempoCategoriaMs > 30000) {
      pontuacaoSinais += 4; // +30 segundos
    }

    // Interesse em fibra + plano é fibra (4 pontos)
    if (
      sinais.interesseFibra > 0 &&
      ["fibra", "combo"].includes(produto.categoria)
    ) {
      pontuacaoSinais += 4;
    }
  }

  // ==================== CONTEXTO INICIAL (até 10 pontos) ====================
  // Usado APENAS para desempate - menor peso
  if (contextoInicial) {
    // Categoria inicial (5 pontos)
    if (contextoInicial.categorias.includes(produto.categoria)) {
      pontuacaoContextoInicial += 5;
    }

    // Operadora inicial (5 pontos)
    if (contextoInicial.operadoras.includes(produto.operadora)) {
      pontuacaoContextoInicial += 5;
    }
  }

  // ==================== TOTAL ====================
  score =
    pontuacaoBase +
    pontuacaoContextoAtivo +
    pontuacaoSinais +
    pontuacaoContextoInicial;

  // Cap em 100
  score = Math.min(score, 100);

  return score;
}

/**
 * Hook para calcular score de múltiplos produtos
 */
export function useScoreContextual(
  produtos: EcommerceProduct[],
  contextoAtivo: ContextoAtivo,
  contextoInicial: ContextoInicial | null,
  sinais: SinaisComportamentais,
  incluirDetalhes: boolean = false
): ProdutoComScore[] {
  return useMemo(() => {
    if (!produtos || produtos.length === 0) return [];

    const produtosComScore: ProdutoComScore[] = produtos.map((produto) => {
      const scoreContextual = calcularScoreContextual(
        produto,
        contextoAtivo,
        contextoInicial,
        sinais
      );

      const resultado: ProdutoComScore = {
        ...produto,
        scoreContextual,
      };

      if (incluirDetalhes) {
        // Calcular detalhes separadamente para debug
        let pontuacaoBase = produto.scoreBase
          ? Math.min(produto.scoreBase / 5, 20)
          : 0;
        let pontuacaoContextoAtivo = 0;
        let pontuacaoSinais = 0;
        let pontuacaoContextoInicial = 0;

        // Contexto ativo
        if (contextoAtivo.operadoras.includes(produto.operadora))
          pontuacaoContextoAtivo += 10;
        if (contextoAtivo.categorias.includes(produto.categoria))
          pontuacaoContextoAtivo += 10;
        if (Array.isArray(produto.usoRecomendado) && produto.usoRecomendado.length > 0) pontuacaoContextoAtivo += 5;
        if (produto.destaque) pontuacaoContextoAtivo += 5;

        // Sinais
        if (sinais.planosVisualizados.includes(produto.id))
          pontuacaoSinais += 8;
        if (sinais.planosComparados.includes(produto.id)) pontuacaoSinais += 6;

        // Contexto inicial
        if (contextoInicial) {
          if (contextoInicial.categorias.includes(produto.categoria))
            pontuacaoContextoInicial += 5;
          if (contextoInicial.operadoras.includes(produto.operadora))
            pontuacaoContextoInicial += 5;
        }

        resultado.detalhesScore = {
          scoreBase: pontuacaoBase,
          pontuacaoContextoAtivo,
          pontuacaoSinais,
          pontuacaoContextoInicial,
          total: scoreContextual,
        };
      }

      return resultado;
    });

    return produtosComScore;
  }, [produtos, contextoAtivo, contextoInicial, sinais, incluirDetalhes]);
}

/**
 * Ordena produtos por score contextual
 */
export function ordenarPorScore(
  produtos: ProdutoComScore[]
): ProdutoComScore[] {
  return [...produtos].sort((a, b) => {
    // Primeiro por score contextual
    if (b.scoreContextual !== a.scoreContextual) {
      return b.scoreContextual - a.scoreContextual;
    }

    // Desempate: destaque
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;

    // Desempate: menor preço
    return a.preco - b.preco;
  });
}
