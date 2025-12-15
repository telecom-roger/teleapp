import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: any;
  quantidade: number;
  linhasAdicionais?: number; // para PJ
  categoria?: string; // categoria do produto
  // Campos para upsell
  svasUpsell?: string[];
  textosUpsell?: string[]; // Array de textos (mudou de textoUpsell)
  permiteCalculadoraLinhas?: boolean;
  // Campo para rastrear plano principal associado (para SVAs)
  planoPrincipalId?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: any, quantidade?: number, planoPrincipalId?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantidade: number) => void;
  updateLinhas: (productId: string, linhas: number) => void;
  duplicateItem: (productId: string) => void;
  clearCart: () => void;
  limparSvasOrfaos: () => void; // Nova função para limpar SVAs sem plano associado

  // UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantidade = 1, planoPrincipalId) => {
        const { items } = get();
        
        // Para SVAs, verificar se já existe um associado ao mesmo plano principal
        const existingItem = items.find(
          (item) => item.product.id === product.id && 
          (planoPrincipalId ? item.planoPrincipalId === planoPrincipalId : !item.planoPrincipalId)
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id && 
              (planoPrincipalId ? item.planoPrincipalId === planoPrincipalId : !item.planoPrincipalId)
                ? { ...item, quantidade: item.quantidade + quantidade }
                : item
            ),
            isOpen: true, // Auto-open on add
          });
        } else {
          set({
            items: [
              ...items,
              {
                product,
                quantidade,
                linhasAdicionais: 0,
                categoria: product.categoria,
                // Incluir campos de upsell do produto
                svasUpsell: product.svasUpsell || [],
                textosUpsell: product.textosUpsell || [], // Array agora
                permiteCalculadoraLinhas:
                  product.permiteCalculadoraLinhas || false,
                planoPrincipalId: planoPrincipalId || undefined,
              },
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        const itemRemovido = items.find((item) => item.product.id === productId);
        
        if (!itemRemovido) return;
        
        // Se for um plano principal (não SVA) que tem SVAs associados
        if (itemRemovido.categoria !== "sva" && itemRemovido.svasUpsell && itemRemovido.svasUpsell.length > 0) {
          // Reduzir quantidade dos SVAs associados
          const itemsAtualizados = items
            .map((item) => {
              // Se for um SVA e estiver na lista de SVAs deste plano
              if (item.categoria === "sva" && item.planoPrincipalId === productId) {
                const novaQuantidade = item.quantidade - 1;
                if (novaQuantidade <= 0) return null; // Remover SVA
                return { ...item, quantidade: novaQuantidade };
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null && item.product.id !== productId);
          
          set({ items: itemsAtualizados });
        } else {
          // Remoção normal
          set({
            items: items.filter((item) => item.product.id !== productId),
          });
        }
      },

      updateQuantity: (productId, quantidade) => {
        if (quantidade <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantidade } : item
          ),
        });
      },

      updateLinhas: (productId, linhas) => {
        set({
          items: get().items.map((item) =>
            item.product.id === productId
              ? { ...item, linhasAdicionais: linhas }
              : item
          ),
        });
      },

      duplicateItem: (productId) => {
        const item = get().items.find((item) => item.product.id === productId);
        if (item) {
          get().addItem(item.product, item.quantidade);
        }
      },

      clearCart: () => {
        set({ items: [], isOpen: false });
      },

      limparSvasOrfaos: () => {
        const { items } = get();
        
        // Coletar IDs dos planos principais (não SVA) que existem no carrinho
        const planosExistentes = new Set(
          items
            .filter((item) => item.categoria !== "sva")
            .map((item) => item.product.id)
        );
        
        // Filtrar itens, removendo SVAs órfãos (sem plano principal associado)
        const itemsLimpos = items.filter((item) => {
          // Manter todos os planos principais
          if (item.categoria !== "sva") return true;
          
          // Para SVAs: só manter se o plano principal ainda existe
          if (item.planoPrincipalId) {
            return planosExistentes.has(item.planoPrincipalId);
          }
          
          // SVAs sem planoPrincipalId (antigos) - remover
          return false;
        });
        
        // Atualizar apenas se houver diferença
        if (itemsLimpos.length !== items.length) {
          set({ items: itemsLimpos });
        }
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.product.preco * item.quantidade;
          const linhasPrice =
            (item.linhasAdicionais || 0) *
            (item.product.valorPorLinhaAdicional || 0);
          return total + basePrice + linhasPrice;
        }, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.preco * item.quantidade,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantidade, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
