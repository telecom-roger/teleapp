import { createContext, useContext, useState, ReactNode } from "react";

export interface DddDistribuicao {
  ddd: string;
  quantidade: number;
}

interface CheckoutDddContextType {
  totalLinhas: number;
  setTotalLinhas: (total: number) => void;
  distribuirDdds: boolean;
  setDistribuirDdds: (distribuir: boolean) => void;
  distribuicao: DddDistribuicao[];
  setDistribuicao: (dist: DddDistribuicao[]) => void;
  addDdd: (ddd: string, quantidade: number) => void;
  removeDdd: (ddd: string) => void;
  updateDdd: (oldDdd: string, newDdd: string, quantidade: number) => void;
  resetDdds: () => void;
  isValid: () => boolean;
  linhasRestantes: () => number;
}

const CheckoutDddContext = createContext<CheckoutDddContextType | undefined>(
  undefined
);

export function CheckoutDddProvider({ children }: { children: ReactNode }) {
  const [totalLinhas, setTotalLinhas] = useState(0);
  const [distribuirDdds, setDistribuirDdds] = useState(false);
  const [distribuicao, setDistribuicao] = useState<DddDistribuicao[]>([]);

  const addDdd = (ddd: string, quantidade: number) => {
    if (distribuicao.find((d) => d.ddd === ddd)) return; // Evitar duplicados
    setDistribuicao([...distribuicao, { ddd, quantidade }]);
  };

  const removeDdd = (ddd: string) => {
    setDistribuicao(distribuicao.filter((d) => d.ddd !== ddd));
  };

  const updateDdd = (oldDdd: string, newDdd: string, quantidade: number) => {
    setDistribuicao(
      distribuicao.map((d) =>
        d.ddd === oldDdd ? { ddd: newDdd, quantidade } : d
      )
    );
  };

  const resetDdds = () => {
    setDistribuicao([]);
    // Não resetar distribuirDdds aqui, pois é controlado pela UI
  };

  const isValid = (): boolean => {
    if (totalLinhas === 0) return false;
    if (distribuicao.length === 0) return false;

    // Verificar se não há DDD duplicado
    const ddds = distribuicao.map((d) => d.ddd);
    if (new Set(ddds).size !== ddds.length) return false;

    // Verificar se todas quantidades são > 0
    if (distribuicao.some((d) => d.quantidade < 1)) return false;

    // Verificar se a soma é exatamente igual ao total
    const soma = distribuicao.reduce((acc, d) => acc + d.quantidade, 0);
    return soma === totalLinhas;
  };

  const linhasRestantes = (): number => {
    const soma = distribuicao.reduce((acc, d) => acc + d.quantidade, 0);
    return totalLinhas - soma;
  };

  return (
    <CheckoutDddContext.Provider
      value={{
        totalLinhas,
        setTotalLinhas,
        distribuirDdds,
        setDistribuirDdds,
        distribuicao,
        setDistribuicao,
        addDdd,
        removeDdd,
        updateDdd,
        resetDdds,
        isValid,
        linhasRestantes,
      }}
    >
      {children}
    </CheckoutDddContext.Provider>
  );
}

export function useCheckoutDdd() {
  const context = useContext(CheckoutDddContext);
  if (!context) {
    throw new Error("useCheckoutDdd must be used within CheckoutDddProvider");
  }
  return context;
}
