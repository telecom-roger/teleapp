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
  cartItemId?: string; // ID único para permitir SVAs duplicados
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: any, quantidade?: number) => void;
  removeItem: (productId: string, cartItemId?: string) => void;
  updateQuantity: (productId: string, quantidade: number, cartItemId?: string) => void;
  updateLinhas: (productId: string, linhas: number) => void;
  duplicateItem: (productId: string) => void;
  clearCart: () => void;

  // UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
  getTotalLinhas: () => number;
  canAddMoreSva: (productId: string) => boolean;
  getSvaCount: (productId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantidade = 1) => {
        const { items } = get();
        const isSva = product.categoria?.toLowerCase().includes('sva');
        
        // Para SVAs, sempre criar um novo item (permitir duplicados)
        if (isSva) {
          const totalLinhas = get().getTotalLinhas();
          const currentSvaCount = get().getSvaCount(product.id);
          
          // Verificar se ainda pode adicionar mais deste SVA
          if (currentSvaCount + quantidade > totalLinhas) {
            console.warn(`Não é possível adicionar mais deste SVA. Limite: ${totalLinhas} linhas`);
            return;
          }
          
          set({
            items: [
              ...items,
              {
                product,
                quantidade,
                linhasAdicionais: 0,
                categoria: product.categoria,
                svasUpsell: product.svasUpsell || [],
                textosUpsell: product.textosUpsell || [],
                permiteCalculadoraLinhas: product.permiteCalculadoraLinhas || false,
                cartItemId: `${product.id}-${Date.now()}-${Math.random()}`, // ID único
              },
            ],
            isOpen: true,
          });
        } else {
          // Para produtos normais (não SVA), somar quantidade se já existir
          const existingItem = items.find(
            (item) => item.product.id === product.id && !item.categoria?.toLowerCase().includes('sva')
          );

          if (existingItem) {
            set({
              items: items.map((item) =>
                item.product.id === product.id && item.cartItemId === existingItem.cartItemId
                  ? { ...item, quantidade: item.quantidade + quantidade }
                  : item
              ),
              isOpen: true,
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
                  svasUpsell: product.svasUpsell || [],
                  textosUpsell: product.textosUpsell || [],
                  permiteCalculadoraLinhas: product.permiteCalculadoraLinhas || false,
                  cartItemId: `${product.id}-${Date.now()}-${Math.random()}`,
                },
              ],
              isOpen: true,
            });
          }
        }
      },

      removeItem: (productId, cartItemId) => {
        if (cartItemId) {
          // Remover item específico pelo cartItemId (para SVAs duplicados)
          set({
            items: get().items.filter((item) => item.cartItemId !== cartItemId),
          });
        } else {
          // Remover todos os itens com este productId (comportamento antigo)
          set({
            items: get().items.filter((item) => item.product.id !== productId),
          });
        }
      },

      updateQuantity: (productId, quantidade, cartItemId) => {
        if (quantidade <= 0) {
          get().removeItem(productId, cartItemId);
          return;
        }
        
        set({
          items: get().items.map((item) => {
            if (cartItemId) {
              return item.cartItemId === cartItemId ? { ...item, quantidade } : item;
            } else {
              return item.product.id === productId ? { ...item, quantidade } : item;
            }
          }),
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

      getTotalLinhas: () => {
        return get().items.reduce((total, item) => {
          const isSva = item.categoria?.toLowerCase().includes('sva');
          if (!isSva) {
            return total + item.quantidade + (item.linhasAdicionais || 0);
          }
          return total;
        }, 0);
      },

      canAddMoreSva: (productId) => {
        const totalLinhas = get().getTotalLinhas();
        const currentSvaCount = get().getSvaCount(productId);
        return currentSvaCount < totalLinhas;
      },

      getSvaCount: (productId) => {
        return get().items.reduce((count, item) => {
          if (item.product.id === productId && item.categoria?.toLowerCase().includes('sva')) {
            return count + item.quantidade;
          }
          return count;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
