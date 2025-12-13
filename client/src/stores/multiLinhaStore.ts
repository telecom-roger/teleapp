import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EcommerceProduct } from "@shared/schema";

// Representa uma linha individual (plano + adicionais)
export interface LinhaPlano {
  id: string; // ID único da linha (UUID)
  numeroLinha: number; // 1, 2, 3...
  plano: EcommerceProduct;
  adicionais: AdicionalSelecionado[];
}

export interface AdicionalSelecionado {
  id: string;
  nome: string;
  tipo: string; // 'apps-ilimitados', 'gb-extra', 'equipamento', 'licenca', 'servico'
  preco: number; // em centavos
  gbExtra?: number; // Se aplicável (GB extras)
}

interface MultiLinhaState {
  linhas: LinhaPlano[];
  isResumoOpen: boolean;
  
  // Actions - Linhas
  addLinha: (plano: EcommerceProduct) => void;
  removeLinha: (linhaId: string) => void;
  updatePlano: (linhaId: string, novoPlano: EcommerceProduct) => void;
  
  // Actions - Adicionais
  addAdicional: (linhaId: string, adicional: AdicionalSelecionado) => void;
  removeAdicional: (linhaId: string, adicionalId: string) => void;
  
  // Actions - UI
  openResumo: () => void;
  closeResumo: () => void;
  toggleResumo: () => void;
  
  // Clear
  clearAll: () => void;
  
  // Computed - Totais
  getTotalPreco: () => number;
  getTotalGB: () => number;
  getNumeroLinhas: () => number;
  getResumoDetalhado: () => ResumoDetalhado;
}

export interface ResumoDetalhado {
  totalPreco: number;
  totalGB: number;
  numeroLinhas: number;
  linhas: {
    numero: number;
    plano: string;
    operadora: string;
    precoPlano: number;
    gbPlano: number;
    adicionais: {
      nome: string;
      preco: number;
      gb?: number;
    }[];
    subtotalLinha: number;
    subtotalGB: number;
  }[];
}

// Função auxiliar para extrair GB de uma string como "50GB", "100 GB", "Ilimitado"
function extrairGB(franquia: string | null): number {
  if (!franquia) return 0;
  
  const franquiaLower = franquia.toLowerCase();
  
  // Se for ilimitado, retorna um valor alto simbólico para exibição
  if (franquiaLower.includes("ilimitado") || franquiaLower.includes("unlimited")) {
    return 999999; // Valor alto para representar ilimitado
  }
  
  // Tenta extrair número seguido de GB
  const match = franquia.match(/(\d+)\s*GB/i);
  return match ? parseInt(match[1]) : 0;
}

export const useMultiLinhaStore = create<MultiLinhaState>()(
  persist(
    (set, get) => ({
      linhas: [],
      isResumoOpen: false,

      // ===== LINHAS =====
      addLinha: (plano: EcommerceProduct) => {
        const { linhas } = get();
        const novaLinha: LinhaPlano = {
          id: crypto.randomUUID(),
          numeroLinha: linhas.length + 1,
          plano,
          adicionais: [],
        };
        set({ linhas: [...linhas, novaLinha], isResumoOpen: true });
      },

      removeLinha: (linhaId) => {
        const { linhas } = get();
        const novasLinhas = linhas
          .filter((l) => l.id !== linhaId)
          .map((l, index) => ({ ...l, numeroLinha: index + 1 })); // Renumerar
        set({ linhas: novasLinhas });
      },

      updatePlano: (linhaId: string, novoPlano: EcommerceProduct) => {
        set({
          linhas: get().linhas.map((linha: LinhaPlano) =>
            linha.id === linhaId ? { ...linha, plano: novoPlano } : linha
          ),
        });
      },

      // ===== ADICIONAIS =====
      addAdicional: (linhaId: string, adicional: AdicionalSelecionado) => {
        set({
          linhas: get().linhas.map((linha: LinhaPlano) => {
            if (linha.id === linhaId) {
              // Verificar se já existe
              const jaExiste = linha.adicionais.some((a: AdicionalSelecionado) => a.id === adicional.id);
              if (jaExiste) return linha;
              
              return {
                ...linha,
                adicionais: [...linha.adicionais, adicional],
              };
            }
            return linha;
          }),
        });
      },

      removeAdicional: (linhaId: string, adicionalId: string) => {
        set({
          linhas: get().linhas.map((linha: LinhaPlano) => {
            if (linha.id === linhaId) {
              return {
                ...linha,
                adicionais: linha.adicionais.filter((a: AdicionalSelecionado) => a.id !== adicionalId),
              };
            }
            return linha;
          }),
        });
      },

      // ===== UI =====
      openResumo: () => set({ isResumoOpen: true }),
      closeResumo: () => set({ isResumoOpen: false }),
      toggleResumo: () => set({ isResumoOpen: !get().isResumoOpen }),

      clearAll: () => set({ linhas: [], isResumoOpen: false }),

      // ===== COMPUTED =====
      getTotalPreco: () => {
        return get().linhas.reduce((total, linha) => {
          const precoPlano = linha.plano.preco;
          const precoAdicionais = linha.adicionais.reduce((sum, ad) => sum + ad.preco, 0);
          return total + precoPlano + precoAdicionais;
        }, 0);
      },

      getTotalGB: () => {
        return get().linhas.reduce((total: number, linha: LinhaPlano) => {
          const gbPlano = extrairGB(linha.plano.franquia || "");
          const gbAdicionais = linha.adicionais.reduce((sum: number, ad: AdicionalSelecionado) => sum + (ad.gbExtra || 0), 0);
          return total + gbPlano + gbAdicionais;
        }, 0);
      },

      getNumeroLinhas: () => {
        return get().linhas.length;
      },

      getResumoDetalhado: () => {
        const { linhas } = get();
        
        const resumoLinhas = linhas.map((linha) => {
          const precoPlano = linha.plano.preco;
          const gbPlano = extrairGB(linha.plano.franquia);
          
          const adicionaisResumo = linha.adicionais.map((ad) => ({
            nome: ad.nome,
            preco: ad.preco,
            gb: ad.gbExtra,
          }));
          
          const precoAdicionais = linha.adicionais.reduce((sum, ad) => sum + ad.preco, 0);
          const gbAdicionais = linha.adicionais.reduce((sum, ad) => sum + (ad.gbExtra || 0), 0);
          
          return {
            numero: linha.numeroLinha,
            plano: linha.plano.nome,
            operadora: linha.plano.operadora,
            precoPlano,
            gbPlano,
            adicionais: adicionaisResumo,
            subtotalLinha: precoPlano + precoAdicionais,
            subtotalGB: gbPlano + gbAdicionais,
          };
        });
        
        const totalPreco = resumoLinhas.reduce((sum: number, l: any) => sum + l.subtotalLinha, 0);
        const totalGB = resumoLinhas.reduce((sum: number, l: any) => sum + l.subtotalGB, 0);
        
        return {
          totalPreco,
          totalGB,
          numeroLinhas: linhas.length,
          linhas: resumoLinhas,
        };
      },
    }),
    {
      name: "multi-linha-storage",
    }
  )
);
