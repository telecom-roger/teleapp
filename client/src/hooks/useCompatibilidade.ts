/**
 * Hook de Compatibilidade (Hard Filter)
 * Exclui planos incompatíveis ANTES de qualquer score ou badge
 *
 * REGRA ABSOLUTA: Se um critério não for atendido, o plano é EXCLUÍDO
 * Compatibilidade vem antes de qualquer inteligência
 */

import { useMemo } from "react";
import type { EcommerceProduct } from "@shared/schema";
import type { ContextoAtivo } from "@/types/contexto";

/**
 * Verifica se um plano é compatível com o contexto ativo
 * Retorna apenas planos que atendem TODOS os critérios
 */
export function useCompatibilidade(
  produtos: EcommerceProduct[] | undefined,
  contextoAtivo: ContextoAtivo
): EcommerceProduct[] {
  return useMemo(() => {
    if (!produtos || produtos.length === 0) return [];

    const produtosCompativeis = produtos.filter((produto) => {
      // ==================== 1. OPERADORA ====================
      // SE usuário selecionou operadora(s), plano DEVE ser de uma delas
      if (contextoAtivo.operadoras.length > 0) {
        if (!contextoAtivo.operadoras.includes(produto.operadora)) {
          return false;
        }
      }

      // ==================== 2. CATEGORIA ====================
      // SE usuário selecionou categoria(s), plano DEVE ser de uma delas
      if (contextoAtivo.categorias.length > 0) {
        if (!contextoAtivo.categorias.includes(produto.categoria)) {
          return false;
        }
      }

      // ==================== 3. TIPO PESSOA ====================
      // Plano deve ser compatível com o tipo de pessoa selecionado
      if (
        produto.tipoPessoa !== "ambos" &&
        produto.tipoPessoa !== contextoAtivo.tipoPessoa
      ) {
        return false;
      }

      // ==================== 4. LINHAS ====================
      // SE usuário especificou quantidade de linhas, plano DEVE suportar
      if (contextoAtivo.linhas !== null && contextoAtivo.linhas > 0) {
        // Verificar se plano suporta a quantidade solicitada
        const linhasMaximas = produto.permiteCalculadoraLinhas
          ? 999 // Sem limite prático se permite calculadora
          : produto.linhasInclusas || 1;

        if (contextoAtivo.linhas > linhasMaximas) {
          return false;
        }
      }

      // ==================== 5. FIBRA ====================
      // SE usuário exigiu fibra, plano DEVE ser de categoria fibra ou combo com fibra
      if (contextoAtivo.fibra === true) {
        const categoriasFibra = ["fibra", "combo", "internet-dedicada"];
        if (!categoriasFibra.includes(produto.categoria)) {
          return false;
        }
      }

      // ==================== 6. COMBO ====================
      // SE usuário exigiu combo, plano DEVE ser categoria combo
      if (contextoAtivo.combo === true) {
        if (produto.categoria !== "combo") {
          return false;
        }
      }

      // ==================== 7. MODALIDADE ====================
      // SE usuário especificou modalidade, plano DEVE suportar
      if (contextoAtivo.modalidade && contextoAtivo.modalidade !== "ambos") {
        if (
          produto.modalidade !== "ambos" &&
          produto.modalidade !== contextoAtivo.modalidade
        ) {
          return false;
        }
      }

      // ==================== 8. PRODUTO ATIVO ====================
      // Sempre excluir produtos inativos
      if (!produto.ativo) {
        return false;
      }

      // ✅ PLANO É COMPATÍVEL
      return true;
    });

    return produtosCompativeis;
  }, [produtos, contextoAtivo]);
}

/**
 * Verifica se um único produto é compatível (útil para validações pontuais)
 */
export function verificarCompatibilidade(
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo
): boolean {
  // Operadora
  if (contextoAtivo.operadoras.length > 0) {
    if (!contextoAtivo.operadoras.includes(produto.operadora)) return false;
  }

  // Categoria
  if (contextoAtivo.categorias.length > 0) {
    if (!contextoAtivo.categorias.includes(produto.categoria)) return false;
  }

  // Tipo Pessoa
  if (
    produto.tipoPessoa !== "ambos" &&
    produto.tipoPessoa !== contextoAtivo.tipoPessoa
  ) {
    return false;
  }

  // Linhas
  if (contextoAtivo.linhas !== null && contextoAtivo.linhas > 0) {
    const linhasMaximas = produto.permiteCalculadoraLinhas
      ? 999
      : produto.linhasInclusas || 1;
    if (contextoAtivo.linhas > linhasMaximas) return false;
  }

  // Fibra
  if (contextoAtivo.fibra === true) {
    const categoriasFibra = ["fibra", "combo", "internet-dedicada"];
    if (!categoriasFibra.includes(produto.categoria)) return false;
  }

  // Combo
  if (contextoAtivo.combo === true) {
    if (produto.categoria !== "combo") return false;
  }

  // Modalidade
  if (contextoAtivo.modalidade && contextoAtivo.modalidade !== "ambos") {
    if (
      produto.modalidade !== "ambos" &&
      produto.modalidade !== contextoAtivo.modalidade
    ) {
      return false;
    }
  }

  // Ativo
  if (!produto.ativo) return false;

  return true;
}

/**
 * Retorna critérios que estão bloqueando resultados
 * Útil para gerar sugestões no estado vazio
 */
export function getCriteriosBloqueadores(
  produtos: EcommerceProduct[] | undefined,
  contextoAtivo: ContextoAtivo
): string[] {
  if (!produtos) return [];

  const bloqueadores: string[] = [];

  // Testar cada critério individualmente
  const contextoSemOperadora = { ...contextoAtivo, operadoras: [] };
  const contextoSemCategoria = { ...contextoAtivo, categorias: [] };
  const contextoSemLinhas = { ...contextoAtivo, linhas: null };
  const contextoSemFibra = { ...contextoAtivo, fibra: false };

  const resultadosSemOperadora = produtos.filter((p) =>
    verificarCompatibilidade(p, contextoSemOperadora)
  );
  const resultadosSemCategoria = produtos.filter((p) =>
    verificarCompatibilidade(p, contextoSemCategoria)
  );
  const resultadosSemLinhas = produtos.filter((p) =>
    verificarCompatibilidade(p, contextoSemLinhas)
  );
  const resultadosSemFibra = produtos.filter((p) =>
    verificarCompatibilidade(p, contextoSemFibra)
  );

  // Se remover operadora aumenta resultados, ela está bloqueando
  if (
    contextoAtivo.operadoras.length > 0 &&
    resultadosSemOperadora.length > 0
  ) {
    bloqueadores.push("operadora");
  }

  // Se remover categoria aumenta resultados, ela está bloqueando
  if (
    contextoAtivo.categorias.length > 0 &&
    resultadosSemCategoria.length > 0
  ) {
    bloqueadores.push("categoria");
  }

  // Se remover linhas aumenta resultados, está bloqueando
  if (contextoAtivo.linhas && resultadosSemLinhas.length > 0) {
    bloqueadores.push("linhas");
  }

  // Se remover fibra aumenta resultados, está bloqueando
  if (contextoAtivo.fibra && resultadosSemFibra.length > 0) {
    bloqueadores.push("fibra");
  }

  return bloqueadores;
}
