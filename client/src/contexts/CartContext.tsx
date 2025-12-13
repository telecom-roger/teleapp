import React, { createContext, useContext, useState, useEffect } from "react";
import type { EcommerceProduct } from "@shared/schema";

interface CartItem {
  product: EcommerceProduct;
  quantidade: number;
  linhasAdicionais?: number; // Para PJ
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: EcommerceProduct, quantidade?: number, linhasAdicionais?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantidade: number) => void;
  updateLinhas: (productId: string, linhas: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Carregar do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ecommerce-cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Salvar no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ecommerce-cart", JSON.stringify(items));
    }
  }, [items]);
  
  const addItem = (product: EcommerceProduct, quantidade = 1, linhasAdicionais = 0) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantidade: item.quantidade + quantidade, linhasAdicionais }
            : item
        );
      }
      return [...prev, { product, quantidade, linhasAdicionais }];
    });
  };
  
  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantidade } : item
      )
    );
  };
  
  const updateLinhas = (productId: string, linhas: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, linhasAdicionais: linhas } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  const total = items.reduce((sum, item) => {
    let itemTotal = item.product.preco * item.quantidade;
    // Adicionar custo de linhas adicionais para PJ
    if (item.linhasAdicionais && item.product.valorPorLinhaAdicional) {
      itemTotal += item.linhasAdicionais * item.product.valorPorLinhaAdicional;
    }
    return sum + itemTotal;
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateLinhas,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}
