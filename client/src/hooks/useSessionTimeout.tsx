import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

// Configurações
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes
const WARNING_THRESHOLD = TIMEOUT_DURATION - WARNING_TIME;

// Eventos que contam como atividade
const ACTIVITY_EVENTS = [
  'mousedown',
  // 'mousemove', // REMOVIDO - muito sensível
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

interface SessionTimeoutOptions {
  onTimeout?: () => void;
  onWarning?: () => void;
  enableWarning?: boolean;
  excludeRoutes?: string[]; // Rotas onde não deve aplicar timeout
}

export function useSessionTimeout({
  onTimeout,
  onWarning,
  enableWarning = true,
  excludeRoutes = ['/'],
}: SessionTimeoutOptions = {}) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_DURATION);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Verificar se deve aplicar timeout na rota atual
  const shouldApplyTimeout = useCallback(() => {
    if (!location) return true;
    
    // Verificação especial para home (match exato)
    if (location === '/') return false;
    
    // Para outras rotas, verifica se começa com alguma rota excluída
    const shouldApply = !excludeRoutes
      .filter(route => route !== '/') // Remove '/' da verificação de startsWith
      .some(route => location.startsWith(route));
    
    console.log('🔍 [SESSION TIMEOUT] Rota:', location, '| Aplica timeout:', shouldApply);
    return shouldApply;
  }, [location, excludeRoutes]);

  // Limpar todos os timers
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timeoutRef.current = null;
    warningRef.current = null;
    countdownRef.current = null;
  }, []);

  // Limpar sessão e redirecionar
  const expireSession = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);

    // Limpar estados do localStorage e sessionStorage
    try {
      // Limpar carrinho
      sessionStorage.removeItem('ecommerce_cart');
      sessionStorage.removeItem('checkout_state');
      sessionStorage.removeItem('selected_ddds');
      sessionStorage.removeItem('checkout_form');
      
      // Limpar drafts temporários
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('draft_') || key.startsWith('temp_')) {
          sessionStorage.removeItem(key);
        }
      });

      // FORÇAR LOGOUT - Limpar autenticação
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('session');
      
      // INVALIDAR CACHE DO REACT QUERY
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // FAZER LOGOUT VIA API
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Silenciar erros
    }

    // Callback personalizado
    if (onTimeout) {
      onTimeout();
    }

    // Redirecionar para home
    setLocation('/');
  }, [setLocation, onTimeout, clearAllTimers, queryClient]);

  // Mostrar aviso
  const showTimeoutWarning = useCallback(() => {
    if (!enableWarning || !shouldApplyTimeout()) return;

    setShowWarning(true);

    if (onWarning) {
      onWarning();
    }

    // Cancelar o timer principal antigo e criar um novo sincronizado com o countdown
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Criar novo timer principal que expira EXATAMENTE quando o countdown zerar
    timeoutRef.current = setTimeout(() => {
      expireSession();
    }, WARNING_TIME);

    // Iniciar contagem regressiva visual
    let remainingTime = WARNING_TIME;
    setTimeRemaining(remainingTime);

    countdownRef.current = setInterval(() => {
      remainingTime -= 1000;
      setTimeRemaining(Math.max(0, remainingTime));

      if (remainingTime <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    }, 1000);
  }, [enableWarning, shouldApplyTimeout, onWarning, expireSession]);

  // Resetar timer de inatividade (só deve ser chamado durante navegação normal, NÃO quando modal aberto)
  const resetTimer = useCallback(() => {
    if (!shouldApplyTimeout()) return;

    lastActivityRef.current = Date.now();
    clearAllTimers();
    setTimeRemaining(TIMEOUT_DURATION);

    timeoutRef.current = setTimeout(() => {
      expireSession();
    }, TIMEOUT_DURATION);

    if (enableWarning) {
      warningRef.current = setTimeout(() => {
        showTimeoutWarning();
      }, WARNING_THRESHOLD);
    }
  }, [shouldApplyTimeout, expireSession, showTimeoutWarning, enableWarning, clearAllTimers]);

  // Continuar sessão (chamado pelo botão do modal)
  const continueSession = useCallback(() => {
    setShowWarning(false);
    clearAllTimers();
    
    lastActivityRef.current = Date.now();
    setTimeRemaining(TIMEOUT_DURATION);

    timeoutRef.current = setTimeout(() => {
      expireSession();
    }, TIMEOUT_DURATION);

    if (enableWarning) {
      warningRef.current = setTimeout(() => {
        showTimeoutWarning();
      }, WARNING_THRESHOLD);
    }
  }, [clearAllTimers, expireSession, showTimeoutWarning, enableWarning]);

  // Detectar atividade do usuário
  useEffect(() => {
    if (!shouldApplyTimeout()) {
      clearAllTimers();
      return;
    }

    const handleActivity = () => {
      if (showWarning) {
        return;
      }
      
      resetTimer();
    };

    // Adicionar listeners de atividade
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer apenas na primeira montagem
    if (!timeoutRef.current && !warningRef.current) {
      resetTimer();
    }

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [shouldApplyTimeout, showWarning]);

  // Calcular tempo restante formatado
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeRemaining,
    formatTimeRemaining,
    continueSession,
    resetTimer,
    isActive: shouldApplyTimeout(),
  };
}
