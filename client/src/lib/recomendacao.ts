// Sistema de recomendação inteligente para produtos
// Calcula score baseado em filtros do usuário e retorna produtos ordenados

import type { EcommerceProduct } from "@shared/schema";

/**
 * Converte string de quantidade de linhas para número médio
 * Exemplos: "1" -> 1, "2" -> 2, "3-5" -> 4, "6+" -> 8, "20+" -> 25
 */
function parseQuantidadeLinhas(quantidade: string): number {
  if (quantidade.includes("-")) {
    const [min, max] = quantidade.split("-").map(Number);
    return Math.floor((min + max) / 2); // Retorna o valor médio
  }
  if (quantidade.includes("+")) {
    const base = parseInt(quantidade);
    return base + Math.floor(base * 0.3); // Adiciona 30% para representar "+"
  }
  return parseInt(quantidade) || 1;
}

export interface FiltrosRecomendacao {
  tipoPessoa: "PF" | "PJ";
  modalidade?: "novo" | "portabilidade" | null;
  quantidadeLinhas?: string | null; // "1", "2", "3-5", "6+", "1-5", "6-10", etc.
  categoria?: string | null;
  operadora?: string | null;
  uso?: string[]; // trabalho, streaming, jogos, basico, equipe
  numDispositivos?: number;
}

export interface ProdutoComScore extends EcommerceProduct {
  scoreCalculado: number;
  razaoRecomendacao: string;
  badgeRecomendacao: string;
}

/**
 * Calcula o score de um produto baseado nos filtros do usuário
 * Score varia de 0 a 100
 */
function calcularScore(produto: any, filtros: FiltrosRecomendacao): number {
  let score = produto.scoreBase || 50; // Score base do produto

  // ✅ 1. Tipo de pessoa (peso: 25)
  if (filtros.tipoPessoa === produto.tipoPessoa) {
    score += 25;
  } else if (produto.tipoPessoa === "ambos") {
    score += 15; // Produtos "ambos" são menos relevantes
  } else {
    score -= 20; // Penaliza produtos incompatíveis
  }

  // ✅ 2. Modalidade (peso: 15)
  if (filtros.modalidade && produto.modalidade) {
    if (filtros.modalidade === produto.modalidade) {
      score += 15;
    } else if (produto.modalidade === "ambos") {
      score += 8;
    } else {
      score -= 10;
    }
  }

  // ✅ 3. Categoria (peso: 20)
  if (filtros.categoria) {
    if (produto.categoria === filtros.categoria) {
      score += 20;
    } else {
      score -= 15;
    }
  }

  // ✅ 4. Operadora (peso: 10)
  if (filtros.operadora) {
    if (produto.operadora === filtros.operadora) {
      score += 10;
    } else {
      score -= 5;
    }
  }

  // ✅ 5. Uso recomendado (peso: 15)
  if (filtros.uso && filtros.uso.length > 0 && produto.usoRecomendado) {
    const matches = filtros.uso.filter((u) =>
      produto.usoRecomendado.includes(u)
    );
    score += matches.length * 5; // +5 por cada uso compatível
  }

  // ✅ 6. Número de dispositivos/linhas (peso: 10)
  if (filtros.numDispositivos) {
    const min = produto.limiteDispositivosMin || 1;
    const max = produto.limiteDispositivosMax || 999;

    if (filtros.numDispositivos >= min && filtros.numDispositivos <= max) {
      score += 10; // Perfeitamente dentro da faixa
    } else if (filtros.numDispositivos < min) {
      score -= 8; // Plano é muito grande para o uso
    } else {
      score -= 15; // Plano é insuficiente
    }
  }

  // ✅ 6.5. Quantidade de linhas (peso: 12)
  if (filtros.quantidadeLinhas) {
    const linhasUsuario = parseQuantidadeLinhas(filtros.quantidadeLinhas);
    const linhasPlano = produto.linhasInclusas || 1;

    if (linhasPlano >= linhasUsuario) {
      score += 12; // Plano atende a quantidade de linhas

      // Bonus se for exatamente o que precisa (sem desperdício)
      if (linhasPlano === linhasUsuario) {
        score += 3;
      }
    } else {
      // Penaliza se o plano não tem linhas suficientes
      score -= 10;
    }
  }

  // ✅ 7. Produto em destaque (peso: 5)
  if (produto.destaque) {
    score += 5;
  }

  // ✅ 8. Preço (normalizado de 0-10, menor preço = maior score)
  // Assumindo preços entre 2000 (R$ 20) e 50000 (R$ 500)
  if (produto.preco) {
    const precoNormalizado = Math.max(
      0,
      Math.min(10, 10 - produto.preco / 5000)
    );
    score += precoNormalizado;
  }

  return Math.max(0, Math.min(100, score)); // Limita entre 0 e 100
}

/**
 * Gera texto explicativo do por quê o produto é recomendado
 */
function gerarRazaoRecomendacao(
  produto: any,
  filtros: FiltrosRecomendacao
): string {
  const razoes: string[] = [];

  if (filtros.tipoPessoa === "PF") {
    if (produto.velocidade) razoes.push(`Velocidade de ${produto.velocidade}`);
    if (produto.franquia) razoes.push(`${produto.franquia} de dados`);
  } else {
    if (produto.sla) razoes.push("Com garantia de SLA");
    if (produto.linhasInclusas > 1)
      razoes.push(`${produto.linhasInclusas} linhas inclusas`);
  }

  if (filtros.uso && produto.usoRecomendado) {
    const matches = filtros.uso.filter((u) =>
      produto.usoRecomendado.includes(u)
    );
    if (matches.length > 0) {
      razoes.push(`Ideal para ${matches.join(", ")}`);
    }
  }

  if (filtros.numDispositivos) {
    const min = produto.limiteDispositivosMin || 1;
    const max = produto.limiteDispositivosMax || 999;
    if (filtros.numDispositivos >= min && filtros.numDispositivos <= max) {
      razoes.push(
        `Perfeito para ${filtros.numDispositivos} dispositivo${
          filtros.numDispositivos > 1 ? "s" : ""
        }`
      );
    }
  }

  if (filtros.quantidadeLinhas) {
    const linhasUsuario = parseQuantidadeLinhas(filtros.quantidadeLinhas);
    const linhasPlano = produto.linhasInclusas || 1;

    if (linhasPlano >= linhasUsuario) {
      if (linhasPlano === 1) {
        razoes.push("Perfeito para linha individual");
      } else {
        razoes.push(`Suporta até ${linhasPlano} linhas`);
      }
    }
  }

  return razoes.length > 0 ? razoes.join(" • ") : "Plano recomendado para você";
}

/**
 * Gera badge contextual baseado no tipo de cliente e score
 */
function gerarBadgeRecomendacao(
  produto: any,
  filtros: FiltrosRecomendacao,
  posicao: number
): string {
  // Se o produto tem badge customizado, usa ele
  if (produto.badgeTexto) {
    return produto.badgeTexto;
  }

  // Badges contextuais baseados em posição e tipo
  if (posicao === 0) {
    return filtros.tipoPessoa === "PF"
      ? "✨ Melhor para você"
      : "🏆 Ideal para sua empresa";
  }

  if (posicao === 1) {
    return filtros.tipoPessoa === "PF"
      ? "⚡ Mais rápido"
      : "💼 Perfeito para equipes";
  }

  if (posicao === 2) {
    return filtros.tipoPessoa === "PF"
      ? "💰 Melhor custo-benefício"
      : "📊 Recomendado para negócios";
  }

  if (produto.destaque) {
    return "🔥 Destaque";
  }

  return "";
}

/**
 * Função principal: recomenda produtos baseado nos filtros
 * Retorna array de produtos com score calculado, ordenado por relevância
 */
export function recomendarProdutos(
  produtos: any[],
  filtros: FiltrosRecomendacao,
  limite?: number
): ProdutoComScore[] {
  // Filtrar apenas produtos ativos
  let produtosAtivos = produtos.filter((p) => p.ativo);

  // 🔥 FILTRAR por compatibilidade OBRIGATÓRIA antes de calcular scores
  produtosAtivos = produtosAtivos.filter((produto) => {
    // Tipo de pessoa - obrigatório
    if (
      filtros.tipoPessoa &&
      produto.tipoPessoa !== "ambos" &&
      produto.tipoPessoa !== filtros.tipoPessoa
    ) {
      return false;
    }

    // Categoria - filtro obrigatório se especificado
    if (filtros.categoria && produto.categoria !== filtros.categoria) {
      return false;
    }

    // Operadora - filtro obrigatório se especificado
    if (filtros.operadora && produto.operadora !== filtros.operadora) {
      return false;
    }

    return true;
  });

  // Calcular score para cada produto
  const produtosComScore: ProdutoComScore[] = produtosAtivos.map((produto) => {
    const score = calcularScore(produto, filtros);

    return {
      ...produto,
      scoreCalculado: score,
      razaoRecomendacao: gerarRazaoRecomendacao(produto, filtros),
      badgeRecomendacao: "", // Será preenchido após ordenação
    };
  });

  // Ordenar por score (maior primeiro)
  produtosComScore.sort((a, b) => b.scoreCalculado - a.scoreCalculado);

  // Adicionar badges baseados na posição
  produtosComScore.forEach((produto, index) => {
    produto.badgeRecomendacao = gerarBadgeRecomendacao(produto, filtros, index);
  });

  // Limitar quantidade se especificado
  return limite ? produtosComScore.slice(0, limite) : produtosComScore;
}

/**
 * Retorna apenas os top 3 produtos recomendados
 */
export function obterTopRecomendacoes(
  produtos: any[],
  filtros: FiltrosRecomendacao
): ProdutoComScore[] {
  return recomendarProdutos(produtos, filtros, 3);
}

/**
 * Verifica se um produto é compatível com os filtros básicos
 */
export function isProdutoCompativel(
  produto: any,
  filtros: FiltrosRecomendacao
): boolean {
  // Tipo de pessoa
  if (
    filtros.tipoPessoa &&
    produto.tipoPessoa !== "ambos" &&
    produto.tipoPessoa !== filtros.tipoPessoa
  ) {
    return false;
  }

  // Categoria
  if (filtros.categoria && produto.categoria !== filtros.categoria) {
    return false;
  }

  // Operadora
  if (filtros.operadora && produto.operadora !== filtros.operadora) {
    return false;
  }

  return true;
}
