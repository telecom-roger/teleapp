# Sistema de Upsell Inteligente

## 📋 Visão Geral

Sistema que oferece SVAs (Serviços de Valor Agregado) de forma sequencial e contextual ao longo da jornada do cliente, respeitando prioridades e limites definidos.

**✨ Funciona para clientes logados E não logados!**

## 🎯 Regra de Ouro

**A lista de SVAs funciona como uma fila ordenada consumida ao longo da jornada, sem repetição dentro do mesmo pedido.**

## 💬 Sistema de Textos Randomizados

Os textos são **gerados automaticamente** usando 10 templates randomizados, substituindo variáveis:
- `[nome_servico]` → Nome do SVA
- `[preco]` → Preço formatado (ex: R$ 25,00)

### Templates Disponíveis:
1. "Pode ser útil para você: O serviço [nome_servico] está disponível para complementar seu plano por [preco]."
2. "Serviço opcional: Caso queira, você pode adicionar [nome_servico] por [preco]."
3. "Um complemento disponível: O [nome_servico] pode ser adicionado à sua contratação por [preco]."
4. "Se fizer sentido para você: Adicione o serviço [nome_servico] por [preco] e complemente seu plano."
5. "Complemento para este plano: O serviço [nome_servico] está disponível por [preco]."
6. "Clientes com este plano costumam adicionar [nome_servico] como um complemento opcional por [preco]."
7. "Disponível para sua contratação: O serviço [nome_servico] pode ser incluído por [preco], se desejar."
8. "Você decide: O serviço [nome_servico] está disponível por [preco] e pode ser adicionado agora ou depois."
9. "Adicional opcional: [nome_servico] por [preco], caso queira ampliar sua contratação."
10. "Sugestão relacionada ao seu plano: O serviço [nome_servico] está disponível por [preco]."

**Cada exibição seleciona um texto aleatório!**

## ⚙️ Como Funciona

### 1. Estrutura de Dados

#### Produtos (ecommerce_products)
```typescript
{
  svasUpsell: ['sva-1', 'sva-2', 'sva-3'], // Array ordenado por prioridade
  // textosUpsell NÃO É MAIS USADO - textos são randomizados automaticamente
}
```

#### Pedidos (ecommerce_orders)
```typescript
{
  upsellsOffered: ['sva-1'],    // SVAs já oferecidos
  upsellsAccepted: [],          // SVAs aceitos pelo cliente
  upsellsRefused: ['sva-1']     // SVAs recusados pelo cliente
}
```

### 2. Algoritmo de Seleção

```
PARA CADA momento da jornada:
  1. Coletar todos svasUpsell dos produtos do pedido (manter ordem)
  2. Filtrar SVAs já oferecidos (upsellsOffered)
  3. Pegar o PRIMEIRO elegível da lista
  4. Verificar se total de ofertas < LIMITE (3)
  5. Se SIM → Mostrar upsell
  6. Se NÃO → Não mostrar mais ofertas
```

### 3. Momentos de Oferta

| Momento | Local | Autenticação | Índice |
|---------|-------|--------------|--------|
| **Pós-Checkout** | Após conclusão do pedido (obrigado.tsx) | Não requerida | 0 |
| **Painel** | Detalhes do pedido (customer-orders.tsx) | Requerida (customer) | 1+ |

**Nota:** Clientes não logados veem upsell na página de obrigado. Clientes logados veem no painel também.

## 📊 Exemplos Práticos

### Exemplo 1: Recusa Sequencial

```
Lista: ['sva-1', 'sva-2', 'sva-3']
Limite: 3 ofertas

Checkout:
  - Oferece: sva-1
  - Cliente: RECUSA
  - Estado: upsellsOffered=['sva-1'], upsellsRefused=['sva-1']

Pós-Checkout:
  - Oferece: sva-2 (próximo não oferecido)
  - Cliente: RECUSA
  - Estado: upsellsOffered=['sva-1','sva-2'], upsellsRefused=['sva-1','sva-2']

Painel:
  - Oferece: sva-3 (próximo não oferecido)
  - Cliente: ACEITA
  - Estado: upsellsOffered=['sva-1','sva-2','sva-3'], upsellsAccepted=['sva-3']
```

### Exemplo 2: Aceite Imediato

```
Lista: ['sva-1', 'sva-2', 'sva-3']
Limite: 3 ofertas

Checkout:
  - Oferece: sva-1
  - Cliente: ACEITA
  - Estado: upsellsOffered=['sva-1'], upsellsAccepted=['sva-1']
  - Ação: SVA adicionado ao pedido, total atualizado

Pós-Checkout:
  - Oferece: sva-2 (continua oferecendo pois limite = 3)
  - Cliente: ACEITA
  - Estado: upsellsOffered=['sva-1','sva-2'], upsellsAccepted=['sva-1','sva-2']

Painel:
  - Oferece: sva-3 (última oferta, limite atingido)
  - Cliente: RECUSA
  - Estado: upsellsOffered=['sva-1','sva-2','sva-3'], upsellsRefused=['sva-3']
  - Fim: Total de 3 ofertas feitas, sistema encerra
```

### Exemplo 3: Limite Atingido

```
Lista: ['sva-1', 'sva-2', 'sva-3', 'sva-4']
Limite: 2 ofertas

Checkout:
  - Oferece: sva-1
  - Cliente: RECUSA
  - Estado: Total ofertas = 1

Pós-Checkout:
  - Oferece: sva-2
  - Cliente: ACEITA
  - Estado: Total ofertas = 2 (LIMITE ATINGIDO)

Painel:
  - Não oferece nada (limite de 2 ofertas já atingido)
  - sva-3 e sva-4 não serão mostrados neste pedido
```

## 🔧 Componentes Técnicos

### Backend

#### GET `/api/ecommerce/customer/orders/:orderId/next-upsell`
- Coleta todos svasUpsell dos produtos do pedido
- Filtra já oferecidos
- Retorna primeiro elegível se under limit
- Inclui texto contextual do momento

**Resposta:**
```json
{
  "upsell": {
    "id": "sva-2",
    "nome": "Seguro Premium",
    "descricao": "Proteção completa",
    "preco": 2500,
    "texto": "Proteja seu investimento com nosso seguro",
    "momento": "pos-checkout"
  }
}
```

#### POST `/api/ecommerce/customer/orders/:orderId/upsell-response`
- Registra aceite/recusa
- Atualiza arrays de tracking
- Se aceito: adiciona SVA ao pedido e atualiza total

**Payload:**
```json
{
  "svaId": "sva-2",
  "accepted": true
}
```

### Frontend

#### UpsellCard Component
- Componente reutilizável para todos os momentos
- Busca próximo upsell via API
- Exibe de forma contextual com texto do momento
- Gerencia aceite/recusa
- Auto-oculta quando não há upsells

**Props:**
```typescript
{
  orderId: string;
  momento: "checkout" | "pos-checkout" | "painel";
}
```

## 🎨 UX/Design

### Card Visual
- **Borda azul** para destacar
- **Badge "Oferta Especial"** no topo
- **Ícone Sparkles** para chamar atenção
- **Texto contextual** baseado no momento
- **Dois botões**: "Não, obrigado" (outline) e "Sim, adicionar" (azul)

### Feedback
- Toast de sucesso ao aceitar
- Toast de confirmação ao recusar
- Atualização automática do pedido
- Card desaparece após resposta

## ⚠️ Regras Importantes

### O que NÃO acontece:
- ❌ SVA não reaparece após ser recusado
- ❌ SVA não reaparece após ser aceito
- ❌ Sistema não volta posições na lista
- ❌ Não oferece SVA já no carrinho

### O que SIM acontece:
- ✅ Lista é consumida sequencialmente
- ✅ Limite controla quantidade total de ofertas
- ✅ Aceitar não bloqueia próximas ofertas (respeitando limite)
- ✅ Cada momento usa próximo elegível
- ✅ Tracking completo em arrays separados

## 🗂️ Arquivos Modificados

### Schema & Migration
- `shared/schema.ts` - Adicionados campos upsellsOffered, upsellsAccepted, upsellsRefused
- `migrations/add-upsell-tracking.mjs` - Migration das novas colunas

### Backend
- `server/ecommerceCustomerRoutes.ts` - Endpoints next-upsell e upsell-response

### Frontend
- `client/src/components/ecommerce/UpsellCard.tsx` - Componente reutilizável
- `client/src/components/ecommerce/CartSidebar.tsx` - Removida lógica antiga
- `client/src/pages/ecommerce/checkout/obrigado.tsx` - Upsell pós-checkout
- `client/src/pages/ecommerce/customer-orders.tsx` - Upsell no painel

## 🚀 Próximos Passos

1. **Testar fluxo completo**: criar pedido, recusar/aceitar em cada momento
2. **Validar textos**: garantir que textosUpsell[0,1,2] aparecem corretamente
3. **Verificar limite**: confirmar que após 3 ofertas sistema para
4. **Testar edge cases**: lista vazia, todos recusados, todos aceitos

## 📈 Métricas Sugeridas

- Taxa de conversão por momento (checkout vs pós-checkout vs painel)
- SVAs mais aceitos/recusados
- Valor médio adicionado por upsell
- Tempo entre oferta e resposta
- Impacto no ticket médio

---

**Data de Implementação:** 17/12/2025  
**Branch:** feature/inteligencia-upsell  
**Status:** ✅ Implementado e pronto para testes
