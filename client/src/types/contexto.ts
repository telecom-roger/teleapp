/**
 * Tipos para o Sistema de Contexto Inteligente
 * Motor de recomendação baseado em comportamento do usuário
 */

export type TipoPessoa = "PF" | "PJ" | "ambos";
export type Modalidade = "novo" | "portabilidade" | "ambos";

/**
 * Contexto Ativo - Estado atual da jornada do usuário
 * Representa o que o usuário quer AGORA
 * Atualizado a cada interação que altera filtros
 */
export interface ContextoAtivo {
  categorias: string[];
  operadoras: string[];
  tipoPessoa: TipoPessoa;
  linhas: number | null;
  modalidade: Modalidade | null;
  fibra: boolean;
  combo: boolean;
  timestamp: number;
}

/**
 * Contexto Inicial - Primeira decisão consciente do usuário
 * Capturado apenas UMA VEZ na primeira interação real
 * NUNCA é sobrescrito, usado apenas para desempate
 */
export interface ContextoInicial extends ContextoAtivo {
  capturadoEm: number;
}

/**
 * Sinais Comportamentais - Padrões de uso durante a jornada
 * Atualizados incrementalmente, usados para influenciar score
 */
export interface SinaisComportamentais {
  // Contadores de mudanças
  trocasOperadora: number;
  trocasCategoria: number;
  ajustesLinhas: number[];

  // Tempo de interesse (em milissegundos)
  tempoPorCategoria: Record<string, number>;
  tempoTotal: number;
  inicioSessao: number;

  // Interesse em produtos
  planosVisualizados: string[];
  planosComparados: string[];
  planosAdicionadosCarrinho: string[];
  planosRemovidosCarrinho: string[];

  // Padrões
  interesseFibra: number;
  interesseCombo: number;
  preferenciaPorPreco: "baixo" | "medio" | "alto" | null;
}

/**
 * Tipo de Evento para registro de sinais
 */
export type TipoEvento =
  | "mudanca_operadora"
  | "mudanca_categoria"
  | "ajuste_linhas"
  | "tempo_categoria"
  | "plano_visualizado"
  | "plano_comparado"
  | "plano_adicionado_carrinho"
  | "plano_removido_carrinho"
  | "interesse_fibra"
  | "interesse_combo";

/**
 * Payload de eventos
 */
export interface EventoPayload {
  tipo: TipoEvento;
  valor: any;
  timestamp: number;
}

/**
 * Estado completo do contexto (para persistência)
 */
export interface EstadoContextoCompleto {
  contextoInicial: ContextoInicial | null;
  contextoAtivo: ContextoAtivo;
  sinais: SinaisComportamentais;
  versao: string; // Para versionamento do schema
}
