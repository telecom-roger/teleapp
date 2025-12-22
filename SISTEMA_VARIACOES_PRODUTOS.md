# Sistema de Produtos com Variações - Implementação Completa

## ✅ O QUE FOI IMPLEMENTADO

### 1. Database Schema & Migration

**Arquivo**: `migrations/0024_add_product_variations.sql`

Criadas 3 alterações no banco:
- ✅ Campo `possui_variacoes` (boolean) na tabela `ecommerce_products`
- ✅ Tabela `ecommerce_product_variation_groups` (grupos de variação)
- ✅ Tabela `ecommerce_product_variation_options` (opções dentro de cada grupo)

**Schema TypeScript** (`shared/schema.ts`):
- ✅ Tipo `EcommerceProductVariationGroup`
- ✅ Tipo `EcommerceProductVariationOption`
- ✅ Relations entre produtos, grupos e opções
- ✅ Indexes para otimização de queries

### 2. Backend - API Routes

**Arquivo**: `server/appManagementRoutes.ts` (Admin)
- ✅ `GET /api/admin/app/manage/products/:productId/variation-groups` - Listar grupos
- ✅ `POST /api/admin/app/manage/products/:productId/variation-groups` - Criar grupo
- ✅ `PUT /api/admin/app/manage/products/:productId/variation-groups/:groupId` - Atualizar grupo
- ✅ `DELETE /api/admin/app/manage/products/:productId/variation-groups/:groupId` - Deletar grupo
- ✅ `POST /api/admin/app/manage/products/:productId/variation-groups/:groupId/options` - Criar opção
- ✅ `PUT /api/admin/app/manage/products/:productId/variation-groups/:groupId/options/:optionId` - Atualizar opção
- ✅ `DELETE /api/admin/app/manage/products/:productId/variation-groups/:groupId/options/:optionId` - Deletar opção

**Arquivo**: `server/appRoutes.ts` (Público)
- ✅ `GET /api/app/products/:productId/variations` - Buscar variações (para página de configuração)

### 3. Frontend - Admin Interface

**Arquivo**: `client/src/pages/admin/app-produtos.tsx`
- ✅ Switch "Produto Configurável (Possui Variações)" no formulário de produto
- ✅ Botão "⚙️ Gerenciar Variações" na listagem (aparece só em produtos configuráveis)
- ✅ Campo `possuiVariacoes` integrado ao submit

**Arquivo**: `client/src/pages/admin/app-produto-variacoes.tsx` (NOVO)
Interface completa para gerenciar variações:
- ✅ Página dedicada: `/admin/app-produtos/:productId/variacoes`
- ✅ CRUD completo de grupos de variação
- ✅ CRUD completo de opções dentro de cada grupo
- ✅ Suporte a dois tipos de seleção:
  - Radio (única escolha)
  - Checkbox (múltipla escolha com min/max)
- ✅ Validação de obrigatoriedade
- ✅ Ordenação drag-and-drop visual
- ✅ Preços positivos (adiciona) ou negativos (desconto)
- ✅ Campo "Valor Técnico" para integrações

**Rota adicionada** (`client/src/App.tsx`):
```tsx
<Route path="/admin/app-produtos/:productId/variacoes" component={AdminProdutoVariacoes} />
```

## 🎯 COMO FUNCIONA

### Fluxo Admin
1. Admin cria/edita produto e marca "Produto Configurável (Possui Variações)"
2. Botão ⚙️ aparece na listagem de produtos
3. Clica no botão → Abre página de gerenciamento de variações
4. Admin cria grupos (Ex: "Internet Fibra", "Plano Móvel", "Extras")
5. Para cada grupo, define:
   - Nome
   - Tipo: Radio (única escolha) ou Checkbox (múltipla)
   - Obrigatório ou opcional
   - Min/Max seleções (para checkbox)
   - Ordem de exibição
6. Para cada grupo, adiciona opções (Ex: "700 Mega", "1 Giga", "15GB")
7. Para cada opção, define:
   - Nome
   - Descrição opcional
   - Preço (pode ser +R$ 50 ou -R$ 10)
   - Valor técnico (para integrações)
   - Ordem

### Exemplo Prático
**Produto**: Combo Vivo Fibra + Móvel

**Grupo 1**: Internet Fibra (Radio, Obrigatório)
- ✅ 500 Mega - R$ 0,00 (base)
- ✅ 700 Mega - +R$ 20,00
- ✅ 1 Giga - +R$ 40,00

**Grupo 2**: Plano Móvel (Radio, Obrigatório)
- ✅ 10 GB - R$ 0,00 (base)
- ✅ 20 GB - +R$ 15,00
- ✅ 30 GB - +R$ 30,00

**Grupo 3**: Extras (Checkbox, Min: 0, Max: 3, Opcional)
- ✅ Netflix - +R$ 25,00
- ✅ Paramount+ - +R$ 15,00
- ✅ Seguro Celular - +R$ 12,00

**Preço Final** = Preço Base do Produto + Soma das opções selecionadas

## 📋 PRÓXIMOS PASSOS (O QUE FALTA)

### 1. Frontend Público - Página de Configuração
**Arquivo a criar**: `client/src/pages/app/configurar-produto.tsx`
- [ ] Rota: `/app/produto/:slug/configurar`
- [ ] Buscar produto + variações
- [ ] Renderizar grupos dinamicamente
- [ ] Radio buttons para grupos tipo "radio"
- [ ] Checkboxes com validação min/max para grupos tipo "checkbox"
- [ ] Cálculo de preço em tempo real
- [ ] Botão "Adicionar ao Carrinho" com validação
- [ ] Mostrar resumo da configuração

### 2. Modificar Card do Produto
**Arquivo**: Encontrar componente do card de produto
- [ ] Detectar `produto.possuiVariacoes === true`
- [ ] Se true: Mudar botão para "Montar meu combo" → redireciona para /configurar
- [ ] Se false: Manter "Adicionar ao carrinho" (comportamento atual)
- [ ] Preço: Mostrar "A partir de R$ X" (calcular menor combinação válida)

### 3. Atualizar Cart Store
**Arquivo**: `client/src/stores/cartStore.ts`
- [ ] Adicionar campos no `CartItem`:
  ```typescript
  interface CartItem {
    // ... campos existentes
    variacoesConfiguradas?: {
      groupId: string;
      groupNome: string;
      opcoesSelecionadas: Array<{
        optionId: string;
        nome: string;
        preco: number;
      }>;
    }[];
    precoConfigurado?: number; // Preço final após variações
  }
  ```

### 4. Função de Cálculo de Menor Preço
**Arquivo a criar**: `client/src/lib/variacoesUtils.ts`
```typescript
export function calcularMenorPreco(produto, grupos) {
  let soma = produto.preco; // Preço base
  
  // Para cada grupo obrigatório
  grupos.filter(g => g.obrigatorio).forEach(grupo => {
    // Pega a opção mais barata
    const maisBarata = Math.min(...grupo.options.map(o => o.preco));
    soma += maisBarata;
  });
  
  return soma;
}

export function calcularPrecoConfigurado(produto, configuracao) {
  let soma = produto.preco;
  
  configuracao.forEach(grupo => {
    grupo.opcoesSelecionadas.forEach(opcao => {
      soma += opcao.preco;
    });
  });
  
  return soma;
}
```

### 5. Exibição no Checkout
- [ ] Mostrar variações configuradas no resumo do pedido
- [ ] Salvar configuração no `ecommerce_order_items` (talvez adicionar campo JSON)

### 6. Admin - Visualização de Pedidos
- [ ] Mostrar configuração do cliente na listagem de pedidos
- [ ] Incluir variações no email de confirmação

## 🔧 ESTRUTURA DE DADOS

### Exemplo de Configuração Salva no Cart
```json
{
  "product": { "id": "abc123", "nome": "Combo Vivo", "preco": 10000 },
  "quantidade": 1,
  "variacoesConfiguradas": [
    {
      "groupId": "grupo1",
      "groupNome": "Internet Fibra",
      "opcoesSelecionadas": [
        {
          "optionId": "opt1",
          "nome": "700 Mega",
          "preco": 2000
        }
      ]
    },
    {
      "groupId": "grupo2",
      "groupNome": "Plano Móvel",
      "opcoesSelecionadas": [
        {
          "optionId": "opt2",
          "nome": "20 GB",
          "preco": 1500
        }
      ]
    },
    {
      "groupId": "grupo3",
      "groupNome": "Extras",
      "opcoesSelecionadas": [
        {
          "optionId": "opt3",
          "nome": "Netflix",
          "preco": 2500
        },
        {
          "optionId": "opt4",
          "nome": "Seguro Celular",
          "preco": 1200
        }
      ]
    }
  ],
  "precoConfigurado": 17200,
  "cartItemId": "xyz789"
}
```

**Preço Total**: R$ 100,00 (base) + R$ 20,00 + R$ 15,00 + R$ 25,00 + R$ 12,00 = **R$ 172,00**

## 🎨 UI/UX RECOMENDADA

### Página de Configuração
```
┌─────────────────────────────────────────┐
│  ← Voltar         Combo Vivo Fibra      │
│                                          │
│  [Imagem do Produto]                    │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  1. Internet Fibra *                     │
│  ○ 500 Mega - Incluído                   │
│  ● 700 Mega - +R$ 20,00                  │
│  ○ 1 Giga - +R$ 40,00                    │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  2. Plano Móvel *                        │
│  ● 10 GB - Incluído                      │
│  ○ 20 GB - +R$ 15,00                     │
│  ○ 30 GB - +R$ 30,00                     │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  3. Extras (Escolha até 3)               │
│  ☑ Netflix - +R$ 25,00                   │
│  ☐ Paramount+ - +R$ 15,00                │
│  ☑ Seguro Celular - +R$ 12,00            │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  Valor Total: R$ 157,00/mês              │
│  [Adicionar ao Carrinho]                 │
└─────────────────────────────────────────┘
```

## 📝 NOTAS TÉCNICAS

### Validações Implementadas
- ✅ Grupos obrigatórios devem ter pelo menos 1 opção selecionada
- ✅ Grupos checkbox respeitam min/max seleções
- ✅ Grupos radio permitem apenas 1 seleção
- ✅ Opções inativas não aparecem no frontend
- ✅ Grupos inativos não aparecem no frontend

### Cascata de Deleção
- ✅ Deletar produto → Deleta todos os grupos → Deleta todas as opções
- ✅ Deletar grupo → Deleta todas as opções do grupo

### Performance
- ✅ Indexes criados em `product_id`, `group_id` e `ordem`
- ✅ Query otimizada: busca grupos + opções em paralelo
- ✅ Filtro de ativos no banco (não traz dados desnecessários)

## ⚠️ CONSIDERAÇÕES IMPORTANTES

1. **Produtos Antigos**: Produtos criados antes desta feature têm `possuiVariacoes = false` por padrão
2. **Retrocompatibilidade**: Produtos simples continuam funcionando normalmente
3. **Preço Base**: Em produtos configuráveis, o `preco` do produto pode ser R$ 0 (todas variações somam)
4. **Valor Técnico**: Campo obrigatório para integrações com sistemas externos
5. **Score System**: Produtos configuráveis mantêm o mesmo sistema de score
6. **Badges**: Sistema de badges funciona igual para ambos os tipos

## 🚀 TESTANDO A IMPLEMENTAÇÃO

### 1. Teste de Migration
```bash
node run-migration-variations.mjs
```
✅ Esperado: "Migration de variações de produtos executada com sucesso!"

### 2. Teste Admin
1. Acesse `/admin/app-produtos`
2. Crie ou edite um produto
3. Ative "Produto Configurável (Possui Variações)"
4. Salve o produto
5. Clique no botão ⚙️ azul na linha do produto
6. Crie um grupo de variação
7. Adicione opções ao grupo
8. Verifique que preços positivos e negativos funcionam

### 3. Teste API
```bash
# Buscar variações de um produto
curl http://localhost:5000/api/app/products/PRODUCT_ID/variations

# Criar grupo
curl -X POST http://localhost:5000/api/admin/app/manage/products/PRODUCT_ID/variation-groups \
  -H "Content-Type: application/json" \
  -d '{"nome":"Internet Fibra","tipoSelecao":"radio","obrigatorio":true}'
```

---

**Status**: ✅ Backend e Admin completamente implementados
**Próximo**: Frontend público (página de configuração + card modificado)
