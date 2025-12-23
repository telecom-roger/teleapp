# Sistema de Timeout de Sessão por Inatividade

## 📋 Visão Geral

Sistema automático que expira sessões de usuários após **30 minutos de inatividade**, garantindo segurança e evitando dados inconsistentes no sistema.

## ⏱️ Configuração

- **Timeout Total**: 30 minutos (1.800.000 ms)
- **Aviso Prévio**: 5 minutos antes (aos 25 minutos)
- **Eventos Monitorados**: `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`

## 🎯 Funcionalidades

### 1. Detecção de Atividade
- Monitora eventos de interação do usuário
- Reseta automaticamente o timer a cada atividade detectada
- Timer é pausado em rotas excluídas (home pública, login, registro)

### 2. Aviso de Expiração
- Modal exibido 5 minutos antes da expiração
- Contagem regressiva em tempo real
- Botão "Continuar Sessão" para resetar o timer
- Não pode ser fechado clicando fora ou ESC (forçar decisão)

### 3. Expiração da Sessão
Ao expirar, o sistema:
- ✅ Limpa carrinho de compras (`ecommerce_cart`)
- ✅ Limpa estado do checkout (`checkout_state`)
- ✅ Limpa seleções de DDD (`selected_ddds`)
- ✅ Limpa formulário do checkout (`checkout_form`)
- ✅ Limpa todos os drafts temporários (prefixos `draft_` e `temp_`)
- ✅ Redireciona usuário para página inicial (`/`)
- ✅ Registra log da ação

## 🏗️ Arquitetura

### Hook Principal: `useSessionTimeout`

```typescript
const {
  showWarning,        // Boolean: se deve mostrar modal de aviso
  timeRemaining,      // Number: ms restantes
  formatTimeRemaining, // Function: formata tempo (MM:SS)
  continueSession,    // Function: reseta timer e fecha modal
  resetTimer,         // Function: reseta timer manualmente
  isActive,           // Boolean: se timeout está ativo na rota atual
} = useSessionTimeout({
  enableWarning: true,
  excludeRoutes: ['/', '/login', '/register'],
  onTimeout: () => { /* callback customizado */ },
  onWarning: () => { /* callback quando mostra aviso */ },
});
```

### Componente: `SessionTimeoutWarning`

Modal de aviso estilizado com:
- Ícone de alerta
- Contagem regressiva visual
- Lista do que será perdido
- Botão de ação clara
- Impossível fechar sem decisão

## 📍 Integração

### App.tsx

```typescript
// No AppContent, antes do return
const {
  showWarning,
  formatTimeRemaining,
  continueSession,
} = useSessionTimeout({
  enableWarning: true,
  excludeRoutes: ['/', '/login', '/register'],
  onTimeout: () => {
    console.log('🔴 Sessão expirada');
  },
});

// No JSX, antes de fechar o componente
<SessionTimeoutWarning
  open={showWarning}
  timeRemaining={formatTimeRemaining()}
  onContinue={continueSession}
/>
```

## 🚫 Rotas Excluídas (Sem Timeout)

Por padrão, as seguintes rotas **NÃO** aplicam timeout:
- `/` - Home pública
- `/login` - Login
- `/register` - Registro

Usuários nessas páginas podem ficar inativos indefinidamente.

## 🔒 Segurança

### Frontend
- Timer gerenciado no cliente
- Limpeza completa de estados temporários
- Redirecionamento forçado

### Backend (Recomendado - não implementado nesta versão)
- Validação de token/sessão com TTL
- Rejeitar requests com sessão expirada (401/419)
- Sincronização com timeout do frontend

## 🧪 Cenários de Teste

| Cenário | Comportamento Esperado |
|---------|------------------------|
| Usuário ativo por 40 min | Não expira (timer resetado a cada interação) |
| Usuário inativo por 30 min | Expira, limpa dados, redireciona |
| Usuário inativo por 25 min | Mostra aviso |
| Clica "Continuar sessão" | Reseta timer, fecha modal, continua onde estava |
| Inativo em /login | Não aplica timeout |
| Inativo no checkout | Aplica timeout, limpa carrinho ao expirar |
| Scroll na página | Reseta timer |
| Digita em campo | Reseta timer |

## 📊 Logs

O sistema registra no console:
- `⚠️ [SESSION TIMEOUT] Aviso de expiração` - Quando mostra o modal
- `✅ [SESSION TIMEOUT] Sessão continuada pelo usuário` - Quando clica continuar
- `🔴 [SESSION TIMEOUT] Sessão expirada por inatividade` - Quando expira
- `✅ [SESSION TIMEOUT] Estados temporários limpos` - Após limpar dados

## 🎨 Customização

### Alterar Tempo de Timeout

Edite `useSessionTimeout.tsx`:
```typescript
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000;      // 5 minutos antes
```

### Adicionar Rotas Excluídas

No `App.tsx`:
```typescript
excludeRoutes: [
  '/',
  '/login',
  '/register',
  '/politica-privacidade', // nova rota
]
```

### Customizar Modal

Edite `SessionTimeoutWarning.tsx` para alterar:
- Textos
- Cores
- Layout
- Botões adicionais

## 💡 Boas Práticas Implementadas

✅ Timer resetado em qualquer interação (UX suave)  
✅ Aviso antecipado (usuário não perde trabalho de surpresa)  
✅ Modal forçado (decisão consciente)  
✅ Limpeza completa (sem dados órfãos)  
✅ Logs detalhados (debugging)  
✅ Rotas excluídas (páginas públicas sem timeout)  
✅ Contagem regressiva visual (transparência)  
✅ Não aplicar em páginas públicas (melhor UX)  

## 🚀 Próximas Melhorias (Opcional)

- [ ] Sincronização com backend (validação de token)
- [ ] Métricas de timeout (quantos usuários expiraram)
- [ ] Toast de notificação além do modal
- [ ] Salvar rascunho antes de expirar (opcional)
- [ ] Diferentes tempos para diferentes rotas
- [ ] Configuração de timeout no perfil do usuário

## 📝 Notas Técnicas

- Sistema 100% TypeScript
- Usa hooks do React (useEffect, useCallback, useRef)
- Gerenciamento de estado local (useState)
- Cleanup automático de timers
- Passive event listeners (performance)
- Formatação de tempo com padding zero
