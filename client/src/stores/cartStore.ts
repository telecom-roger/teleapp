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
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: any, quantidade?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantidade: number) => void;
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
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantidade = 1) => {
        const { items } = get();
        const existingItem = items.find((item) => item.product.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
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
                permiteCalculadoraLinhas: product.permiteCalculadoraLinhas || false,
              }
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
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
            item.product.id === productId ? { ...item, linhasAdicionais: linhas } : item
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
            (item.linhasAdicionais || 0) * (item.product.valorPorLinhaAdicional || 0);
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
