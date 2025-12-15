/**
 * Hook de Badges Dinâmicos
 * Calcula badge principal que EXPLICA por que o plano faz sentido
 *
 * REGRAS:
 * - Apenas UM badge por plano
 * - Badge alinhado com contexto ativo e score
 * - Textos randomizados fixados por sessão
 * - Diferenciação entre PF e PJ
 */

import { useMemo } from "react";
import type { EcommerceProduct } from "@shared/schema";
import type { ContextoAtivo } from "@/types/contexto";
import { calcularScoreContextual } from "./useScoreContextual";
import { useContextoInteligenteStore } from "@/stores/contextoInteligenteStore";

export interface BadgeDinamico {
  texto: string;
  variante: "default" | "success" | "info" | "warning" | "primary";
  prioridade: number;
  motivo?: string; // Para debug
}

// ==================== TEXTOS DINÂMICOS ====================

const TEXTOS_BADGES = {
  // Score > 80 - Pessoa Física
  topIdealPF: [
    "Sob medida",
    "Match perfeito",
    "Escolha estratégica",
    "Top performance",
    "Alinhado a você",
  ],
  
  // Score > 80 - Pessoa Jurídica
  topIdealPJ: [
    "Ideal para sua empresa",
    "Sob medida para sua equipe",
    "Alinhado ao negócio",
    "Escolha otimizada",
  ],
  
  // Score > 60 - Pessoa Física
  recomendadoPF: [
    "Altamente relevante",
    "Sugestão inteligente",
    "Combinação ideal",
    "Planejado para você",
  ],
  
  // Score > 60 - Pessoa Jurídica
  recomendadoPJ: [
    "Indicado para empresas",
    "Ótima escolha empresarial",
    "Preço otimizado",
    "Ideal para sua empresa",
  ],
  
  // Score > 40 - Pessoa Física
  boaOpcaoPF: [
    "Boa alternativa",
    "Compatível com você",
    "Ajuste interessante",
    "Plano relevante",
    "Vale conferir",
  ],
  
  // Score > 40 - Pessoa Jurídica
  boaOpcaoPJ: [
    "Uso corporativo",
    "Compatível com equipe",
    "Ajuste operacional",
    "Boa aderência",
  ],
  
  // Contexto/Personalização - Pessoa Física
  contextualizadoPF: [
    "Baseado no seu uso",
    "Para o seu perfil",
    "Planejado para você",
    "Alinhado às escolhas",
    "Sugestão personalizada",
  ],
  
  // Contexto/Personalização - Pessoa Jurídica
  contextualizadoPJ: [
    "Baseado na operação",
    "Para seu negócio",
    "Planejado para equipe",
    "Alinhado às prioridades",
    "Sugestão personalizada",
  ],
  
  // Múltiplas Linhas - Variações de texto
  multiplinhasVariacoes: [
    "{linhas} linhas {total} total",
    "Pacote {linhas} linhas por {total}",
    "{linhas} linhas • {total}",
    "Combo {linhas} linhas {total}",
  ],
};

/**
 * Seleciona texto aleatório e salva em sessionStorage para consistência
 */
function selecionarTextoFixo(
  textos: string[],
  chave: string
): string {
  const STORAGE_KEY = `badge_texto_${chave}`;
  
  // Verificar se já existe texto salvo
  const textoSalvo = sessionStorage.getItem(STORAGE_KEY);
  if (textoSalvo && textos.includes(textoSalvo)) {
    return textoSalvo;
  }
  
  // Sortear novo texto
  const textoEscolhido = textos[Math.floor(Math.random() * textos.length)];
  
  // Salvar para próximas renderizações
  sessionStorage.setItem(STORAGE_KEY, textoEscolhido);
  
  return textoEscolhido;
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
 * Calcula badge dinâmico para um produto baseado em score contextual
 */
export function calcularBadgeDinamico(
  produto: EcommerceProduct,
  contextoAtivo: ContextoAtivo,
  score: number
): BadgeDinamico | null {
  const badges: BadgeDinamico[] = [];
  const isPJ = contextoAtivo.tipoPessoa === "PJ";
  
  // Chave única para este produto + contexto
  const chaveBase = `${produto.id}_${isPJ ? 'pj' : 'pf'}`;

  // ==================== PRIORIDADE 10: LINHAS (COM VARIAÇÕES) ====================
  if (
    contextoAtivo.linhas &&
    contextoAtivo.linhas > 1 &&
    produto.permiteCalculadoraLinhas
  ) {
    const valorTotal = produto.preco * contextoAtivo.linhas;
    const template = selecionarTextoFixo(
      TEXTOS_BADGES.multiplinhasVariacoes,
      `${chaveBase}_linhas`
    );
    
    const texto = template
      .replace("{linhas}", String(contextoAtivo.linhas))
      .replace("{total}", formatPrice(valorTotal));
    
    badges.push({
      texto,
      variante: "success",
      prioridade: 10,
      motivo: "calculadora-linhas",
    });
  }

  // ==================== PRIORIDADE 9: SCORE > 80 (TOP/IDEAL) ====================
  if (score > 80) {
    const textos = isPJ ? TEXTOS_BADGES.topIdealPJ : TEXTOS_BADGES.topIdealPF;
    const texto = selecionarTextoFixo(textos, `${chaveBase}_top80`);
    
    badges.push({
      texto,
      variante: "success",
      prioridade: 9,
      motivo: "score-top-ideal",
    });
  }

  // ==================== PRIORIDADE 8: SCORE > 60 (RECOMENDADO) ====================
  else if (score > 60) {
    const textos = isPJ ? TEXTOS_BADGES.recomendadoPJ : TEXTOS_BADGES.recomendadoPF;
    const texto = selecionarTextoFixo(textos, `${chaveBase}_rec60`);
    
    badges.push({
      texto,
      variante: "info",
      prioridade: 8,
      motivo: "score-recomendado",
    });
  }

  // ==================== PRIORIDADE 7: SCORE > 40 (BOA OPÇÃO) ====================
  else if (score > 40) {
    const textos = isPJ ? TEXTOS_BADGES.boaOpcaoPJ : TEXTOS_BADGES.boaOpcaoPF;
    const texto = selecionarTextoFixo(textos, `${chaveBase}_boa40`);
    
    badges.push({
      texto,
      variante: "primary",
      prioridade: 7,
      motivo: "score-boa-opcao",
    });
  }

  // ==================== PRIORIDADE 6: CONTEXTO/PERSONALIZAÇÃO ====================
  // Se há contexto ativo (usuário já interagiu)
  const temContexto = contextoAtivo.categorias.length > 0 || 
                      contextoAtivo.operadoras.length > 0 ||
                      contextoAtivo.linhas !== null;
                      
  if (temContexto && score > 30) {
    const textos = isPJ ? TEXTOS_BADGES.contextualizadoPJ : TEXTOS_BADGES.contextualizadoPF;
    const texto = selecionarTextoFixo(textos, `${chaveBase}_ctx`);
    
    badges.push({
      texto,
      variante: "info",
      prioridade: 6,
      motivo: "contexto-personalizado",
    });
  }

  // ==================== PRIORIDADE 5: BADGE CUSTOMIZADO (DB) ====================
  if (produto.badgeTexto && produto.badgeTexto.trim()) {
    let textoFinal = produto.badgeTexto;

    // Substituir variáveis no texto
    if (textoFinal.includes("[preco]")) {
      textoFinal = textoFinal.replace("[preco]", formatPrice(produto.preco));
    }
    if (textoFinal.includes("[velocidade]") && produto.velocidade) {
      textoFinal = textoFinal.replace("[velocidade]", produto.velocidade);
    }
    if (textoFinal.includes("[franquia]") && produto.franquia) {
      textoFinal = textoFinal.replace("[franquia]", produto.franquia);
    }
    if (textoFinal.includes("[linhas]") && contextoAtivo.linhas) {
      textoFinal = textoFinal.replace("[linhas]", contextoAtivo.linhas.toString());
    }

    badges.push({
      texto: textoFinal,
      variante: "info",
      prioridade: 5,
      motivo: "badge-customizado-db",
    });
  }

  // ==================== PRIORIDADE 4: DESTAQUE ====================
  if (produto.destaque) {
    badges.push({
      texto: "Mais popular",
      variante: "warning",
      prioridade: 4,
      motivo: "destaque-admin",
    });
  }

  // ==================== PRIORIDADE 3: IDEAL PARA EMPRESAS ====================
  if (isPJ && produto.tipoPessoa === "PJ") {
    badges.push({
      texto: "Ideal para empresas",
      variante: "info",
      prioridade: 3,
      motivo: "tipo-pessoa-pj",
    });
  }

  // ==================== PRIORIDADE 2: CUSTO-BENEFÍCIO ====================
  // Preço competitivo (abaixo de R$ 100)
  if (produto.preco < 10000 && (produto.categoria === "movel" || produto.categoria === "fibra" || produto.categoria === "combo")) {
    badges.push({
      texto: "Ótimo custo-benefício",
      variante: "success",
      prioridade: 2,
      motivo: "preco-competitivo",
    });
  }

  // ==================== SELECIONAR BADGE DE MAIOR PRIORIDADE ====================
  if (badges.length === 0) return null;

  badges.sort((a, b) => b.prioridade - a.prioridade);
  const badgeSelecionado = badges[0];

  return badgeSelecionado;
}

/**
 * Hook para calcular badges de múltiplos produtos COM SCORE
 */
export function useBadgeDinamico(
  produtos: EcommerceProduct[],
  contextoAtivo: ContextoAtivo
): Map<string, BadgeDinamico | null> {
  // Buscar contexto inicial e sinais do store
  const { contextoInicial, sinais } = useContextoInteligenteStore();
  
  return useMemo(() => {
    const badgesMap = new Map<string, BadgeDinamico | null>();

    produtos.forEach((produto) => {
      // Calcular score usando a função diretamente
      const score = calcularScoreContextual(
        produto,
        contextoAtivo,
        contextoInicial,
        sinais
      );
      
      const badge = calcularBadgeDinamico(produto, contextoAtivo, score);
      badgesMap.set(produto.id, badge);
    });

    return badgesMap;
  }, [produtos, contextoAtivo, contextoInicial, sinais]);
}

/**
 * Hook conveniente para obter badge de um único produto
 */
export function useBadgeProduto(
  produto: EcommerceProduct | undefined,
  contextoAtivo: ContextoAtivo
): BadgeDinamico | null {
  // Buscar contexto inicial e sinais do store
  const { contextoInicial, sinais } = useContextoInteligenteStore();
  
  return useMemo(() => {
    if (!produto) return null;
    
    const score = calcularScoreContextual(
      produto,
      contextoAtivo,
      contextoInicial,
      sinais
    );
    
    return calcularBadgeDinamico(produto, contextoAtivo, score);
  }, [produto, contextoAtivo, contextoInicial, sinais]);
}
