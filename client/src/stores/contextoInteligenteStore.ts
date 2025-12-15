/**
 * Store de Contexto Inteligente
 * Gerencia contexto inicial, contexto ativo e sinais comportamentais
 * Persistência em sessionStorage para manter continuidade durante a sessão
 */

import { create } from "zustand";
import type {
  ContextoAtivo,
  ContextoInicial,
  SinaisComportamentais,
  TipoPessoa,
  Modalidade,
  TipoEvento,
  EstadoContextoCompleto,
} from "@/types/contexto";

// Keys para sessionStorage
const STORAGE_KEYS = {
  CONTEXTO_INICIAL: "ecommerce_contexto_inicial",
  CONTEXTO_ATIVO: "ecommerce_contexto_ativo",
  SINAIS_COMPORTAMENTAIS: "ecommerce_sinais_comportamentais",
  VERSAO: "v1",
};

// Estado inicial do contexto ativo
const contextoAtivoInicial: ContextoAtivo = {
  categorias: [],
  operadoras: [],
  tipoPessoa: "PF",
  linhas: null,
  modalidade: null,
  fibra: false,
  combo: false,
  timestamp: Date.now(),
};

// Estado inicial dos sinais comportamentais
const sinaisInicial: SinaisComportamentais = {
  trocasOperadora: 0,
  trocasCategoria: 0,
  ajustesLinhas: [],
  tempoPorCategoria: {},
  tempoTotal: 0,
  inicioSessao: Date.now(),
  planosVisualizados: [],
  planosComparados: [],
  planosAdicionadosCarrinho: [],
  planosRemovidosCarrinho: [],
  interesseFibra: 0,
  interesseCombo: 0,
  preferenciaPorPreco: null,
};

interface ContextoInteligenteState {
  // Estados
  contextoInicial: ContextoInicial | null;
  contextoAtivo: ContextoAtivo;
  sinais: SinaisComportamentais;

  // Ações - Contexto Inicial
  setContextoInicial: (contexto: ContextoAtivo) => void;

  // Ações - Contexto Ativo
  updateContextoAtivo: (updates: Partial<ContextoAtivo>) => void;
  setCategoria: (categorias: string[]) => void;
  setOperadora: (operadoras: string[]) => void;
  setTipoPessoa: (tipo: TipoPessoa) => void;
  setLinhas: (linhas: number | null) => void;
  setModalidade: (modalidade: Modalidade | null) => void;
  setFibra: (fibra: boolean) => void;
  setCombo: (combo: boolean) => void;

  // Ações - Sinais Comportamentais
  registrarEvento: (tipo: TipoEvento, valor: any) => void;
  incrementarTempoCategoria: (categoria: string, tempo: number) => void;

  // Persistência
  carregarDaSessao: () => void;
  salvarNaSessao: () => void;
  limparContexto: () => void;

  // Utilitários
  getResumoContexto: () => {
    temContextoInicial: boolean;
    filtrosAtivos: number;
    sinaisCapturados: number;
  };
}

export const useContextoInteligenteStore = create<ContextoInteligenteState>(
  (set, get) => ({
    // Estados iniciais
    contextoInicial: null,
    contextoAtivo: contextoAtivoInicial,
    sinais: sinaisInicial,

    // ==================== CONTEXTO INICIAL ====================

    /**
     * Captura o contexto inicial (primeira interação consciente)
     * REGRA: Só pode ser chamado UMA VEZ, nunca sobrescreve
     */
    setContextoInicial: (contexto: ContextoAtivo) => {
      const state = get();

      // Se já existe contexto inicial, não sobrescrever
      if (state.contextoInicial) {
        return;
      }

      const contextoInicial: ContextoInicial = {
        ...contexto,
        capturadoEm: Date.now(),
      };

      set({ contextoInicial });
      get().salvarNaSessao();
    },

    // ==================== CONTEXTO ATIVO ====================

    /**
     * Atualiza o contexto ativo (estado atual da jornada)
     * REGRA: Sempre reflete a última ação do usuário
     */
    updateContextoAtivo: (updates: Partial<ContextoAtivo>) => {
      const state = get();
      const contextoAnterior = state.contextoAtivo;

      const novoContexto: ContextoAtivo = {
        ...contextoAnterior,
        ...updates,
        timestamp: Date.now(),
      };

      // Registrar mudanças como sinais comportamentais
      if (
        updates.operadoras &&
        updates.operadoras.join(",") !== contextoAnterior.operadoras.join(",")
      ) {
        get().registrarEvento("mudanca_operadora", updates.operadoras);
      }

      if (
        updates.categorias &&
        updates.categorias.join(",") !== contextoAnterior.categorias.join(",")
      ) {
        get().registrarEvento("mudanca_categoria", updates.categorias);
      }

      if (
        updates.linhas !== undefined &&
        updates.linhas !== contextoAnterior.linhas
      ) {
        get().registrarEvento("ajuste_linhas", updates.linhas);
      }

      if (
        updates.fibra !== undefined &&
        updates.fibra !== contextoAnterior.fibra
      ) {
        get().registrarEvento("interesse_fibra", updates.fibra);
      }

      if (
        updates.combo !== undefined &&
        updates.combo !== contextoAnterior.combo
      ) {
        get().registrarEvento("interesse_combo", updates.combo);
      }

      set({ contextoAtivo: novoContexto });
      get().salvarNaSessao();
    },

    /**
     * Funções específicas para atualizar cada campo (conveniência)
     */
    setCategoria: (categorias: string[]) => {
      get().updateContextoAtivo({ categorias });
    },

    setOperadora: (operadoras: string[]) => {
      get().updateContextoAtivo({ operadoras });
    },

    setTipoPessoa: (tipoPessoa: TipoPessoa) => {
      get().updateContextoAtivo({ tipoPessoa });
    },

    setLinhas: (linhas: number | null) => {
      get().updateContextoAtivo({ linhas });
    },

    setModalidade: (modalidade: Modalidade | null) => {
      get().updateContextoAtivo({ modalidade });
    },

    setFibra: (fibra: boolean) => {
      get().updateContextoAtivo({ fibra });
    },

    setCombo: (combo: boolean) => {
      get().updateContextoAtivo({ combo });
    },

    // ==================== SINAIS COMPORTAMENTAIS ====================

    /**
     * Registra um evento comportamental
     * REGRA: Atualizado incrementalmente, influencia score
     */
    registrarEvento: (tipo: TipoEvento, valor: any) => {
      const state = get();
      const sinaisAtuais = state.sinais;
      let novosSinais = { ...sinaisAtuais };

      switch (tipo) {
        case "mudanca_operadora":
          novosSinais.trocasOperadora += 1;
          break;

        case "mudanca_categoria":
          novosSinais.trocasCategoria += 1;
          break;

        case "ajuste_linhas":
          novosSinais.ajustesLinhas = [...novosSinais.ajustesLinhas, valor];
          break;

        case "plano_visualizado":
          if (!novosSinais.planosVisualizados.includes(valor)) {
            novosSinais.planosVisualizados = [
              ...novosSinais.planosVisualizados,
              valor,
            ];
          }
          break;

        case "plano_comparado":
          if (!novosSinais.planosComparados.includes(valor)) {
            novosSinais.planosComparados = [
              ...novosSinais.planosComparados,
              valor,
            ];
          }
          break;

        case "plano_adicionado_carrinho":
          novosSinais.planosAdicionadosCarrinho = [
            ...novosSinais.planosAdicionadosCarrinho,
            valor,
          ];
          break;

        case "plano_removido_carrinho":
          novosSinais.planosRemovidosCarrinho = [
            ...novosSinais.planosRemovidosCarrinho,
            valor,
          ];
          break;

        case "interesse_fibra":
          if (valor === true) novosSinais.interesseFibra += 1;
          break;

        case "interesse_combo":
          if (valor === true) novosSinais.interesseCombo += 1;
          break;
      }

      // Atualizar tempo total
      novosSinais.tempoTotal = Date.now() - novosSinais.inicioSessao;

      set({ sinais: novosSinais });
      get().salvarNaSessao();
    },

    /**
     * Incrementa tempo gasto em uma categoria específica
     */
    incrementarTempoCategoria: (categoria: string, tempo: number) => {
      const state = get();
      const sinaisAtuais = state.sinais;

      const novosSinais = {
        ...sinaisAtuais,
        tempoPorCategoria: {
          ...sinaisAtuais.tempoPorCategoria,
          [categoria]: (sinaisAtuais.tempoPorCategoria[categoria] || 0) + tempo,
        },
      };

      set({ sinais: novosSinais });
      get().salvarNaSessao();
    },

    // ==================== PERSISTÊNCIA ====================

    /**
     * Carregar estado do sessionStorage
     */
    carregarDaSessao: () => {
      try {
        const contextoInicialStr = sessionStorage.getItem(
          STORAGE_KEYS.CONTEXTO_INICIAL
        );
        const contextoAtivoStr = sessionStorage.getItem(
          STORAGE_KEYS.CONTEXTO_ATIVO
        );
        const sinaisStr = sessionStorage.getItem(
          STORAGE_KEYS.SINAIS_COMPORTAMENTAIS
        );

        if (contextoInicialStr) {
          const contextoInicial = JSON.parse(contextoInicialStr);
          set({ contextoInicial });
        }

        if (contextoAtivoStr) {
          const contextoAtivo = JSON.parse(contextoAtivoStr);
          set({ contextoAtivo });
        }

        if (sinaisStr) {
          const sinais = JSON.parse(sinaisStr);
          set({ sinais });
        }
      } catch (error) {
        console.error("❌ Erro ao carregar contexto da sessão:", error);
      }
    },

    /**
     * Salvar estado no sessionStorage
     */
    salvarNaSessao: () => {
      try {
        const state = get();

        if (state.contextoInicial) {
          sessionStorage.setItem(
            STORAGE_KEYS.CONTEXTO_INICIAL,
            JSON.stringify(state.contextoInicial)
          );
        }

        sessionStorage.setItem(
          STORAGE_KEYS.CONTEXTO_ATIVO,
          JSON.stringify(state.contextoAtivo)
        );

        sessionStorage.setItem(
          STORAGE_KEYS.SINAIS_COMPORTAMENTAIS,
          JSON.stringify(state.sinais)
        );

        // console.log('💾 Contexto salvo na sessão');
      } catch (error) {
        console.error("❌ Erro ao salvar contexto na sessão:", error);
      }
    },

    /**
     * Limpar todo o contexto (reset completo)
     */
    limparContexto: () => {
      sessionStorage.removeItem(STORAGE_KEYS.CONTEXTO_INICIAL);
      sessionStorage.removeItem(STORAGE_KEYS.CONTEXTO_ATIVO);
      sessionStorage.removeItem(STORAGE_KEYS.SINAIS_COMPORTAMENTAIS);

      set({
        contextoInicial: null,
        contextoAtivo: contextoAtivoInicial,
        sinais: sinaisInicial,
      });
    },

    // ==================== UTILITÁRIOS ====================

    /**
     * Retorna resumo do estado atual do contexto
     */
    getResumoContexto: () => {
      const state = get();

      const filtrosAtivos =
        state.contextoAtivo.categorias.length +
        state.contextoAtivo.operadoras.length +
        (state.contextoAtivo.linhas ? 1 : 0) +
        (state.contextoAtivo.fibra ? 1 : 0) +
        (state.contextoAtivo.combo ? 1 : 0);

      const sinaisCapturados =
        state.sinais.trocasOperadora +
        state.sinais.trocasCategoria +
        state.sinais.planosVisualizados.length +
        state.sinais.planosComparados.length +
        state.sinais.planosAdicionadosCarrinho.length;

      return {
        temContextoInicial: state.contextoInicial !== null,
        filtrosAtivos,
        sinaisCapturados,
      };
    },
  })
);

// Carregar contexto da sessão ao inicializar
if (typeof window !== "undefined") {
  useContextoInteligenteStore.getState().carregarDaSessao();
}
