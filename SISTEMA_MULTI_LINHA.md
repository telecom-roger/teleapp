# Sistema Multi-Linha com Cálculo Automático

## 📱 Visão Geral

Sistema completo de contratação multi-linha com cálculo dinâmico de preço total e GB total, incluindo adicionais/upsell. Ideal para portabilidade de múltiplas linhas, permitindo que cada linha tenha um plano diferente.

## ✨ Funcionalidades

### 1. **Seleção de Múltiplas Linhas**

- Cada linha pode ter um plano diferente
- Suporte para operadoras diferentes (VIVO, CLARO, TIM)
- Sistema inteligente de recomendação por linha

### 2. **Adicionais por Linha**

Cada linha pode ter seus próprios adicionais:

- **Apps ilimitados**: WhatsApp, Instagram, YouTube, Netflix
- **GB extras**: 5GB, 10GB, 20GB
- **Equipamentos**: Repetidor, Roteador Wi-Fi 6, Modem GPON
- **Licenças**: Office 365 Basic/Standard
- **Serviços**: Backup em nuvem, IP fixo, Suporte premium

### 3. **Cálculo Automático em Tempo Real**

- **Preço Total**: Soma de todos os planos + adicionais
- **Total GB**: Soma de franquias + GB extras
- Atualização instantânea ao adicionar/remover

### 4. **Interface Responsiva**

#### Desktop (≥1024px)

- **Sidebar fixa** à direita com resumo completo
- Visualização simultânea de produtos e resumo
- Scroll independente para muitos produtos

#### Mobile (<1024px)

- **Botão flutuante** no rodapé mostrando:
  - Número de linhas
  - Total GB
  - Preço total
- **Drawer deslizante** com detalhes completos
- Não ocupa espaço da tela principal

## 🎯 Como Usar

### Para o Usuário Final:

1. **Adicionar Linha**

   - Navegue até uma categoria (ex: `/app/fibra`)
   - Encontre o plano desejado
   - Clique em **"Nova Linha"** no card do produto
   - A linha é adicionada ao resumo automaticamente

2. **Adicionar Extras**

   - No resumo (sidebar ou drawer), localize a linha
   - Clique em **"Adicionar extras"**
   - Selecione os adicionais desejados
   - Total é recalculado automaticamente

3. **Gerenciar Linhas**

   - **Remover linha**: Clique no ✕ ao lado da linha
   - **Remover adicional**: Clique no ✕ ao lado do adicional
   - **Limpar tudo**: Clique em "Limpar tudo" no topo do resumo

4. **Visualizar Totais**
   - Desktop: Sidebar sempre visível à direita
   - Mobile: Clique no botão flutuante no rodapé

### Para Desenvolvedores:

#### Store Principal: `multiLinhaStore.ts`

```typescript
import { useMultiLinhaStore } from "@/stores/multiLinhaStore";

// Adicionar linha
const addLinha = useMultiLinhaStore((state) => state.addLinha);
addLinha(produto);

// Adicionar adicional
const addAdicional = useMultiLinhaStore((state) => state.addAdicional);
addAdicional(linhaId, {
  id: "uuid",
  nome: "WhatsApp Ilimitado",
  tipo: "apps-ilimitados",
  preco: 500, // em centavos
  gbExtra: 0,
});

// Obter resumo
const resumo = useMultiLinhaStore((state) => state.getResumoDetalhado());
// resumo.totalPreco, resumo.totalGB, resumo.numeroLinhas
```

#### Componentes Principais:

1. **ResumoMultiLinha** - Wrapper que detecta desktop/mobile
2. **ResumoMultiLinhaDesktop** - Sidebar fixa
3. **ResumoMultiLinhaMobile** - Drawer + botão flutuante
4. **ModalAdicionais** - Modal para selecionar extras
5. **CardInteligente** - Card de produto com botão "Nova Linha"

## 📊 Estrutura de Dados

### LinhaPlano

```typescript
{
  id: "uuid",
  numeroLinha: 1,
  plano: EcommerceProduct,
  adicionais: AdicionalSelecionado[]
}
```

### AdicionalSelecionado

```typescript
{
  id: "uuid",
  nome: "WhatsApp Ilimitado",
  tipo: "apps-ilimitados",
  preco: 500, // centavos
  gbExtra?: 10 // opcional, para GB extras
}
```

### ResumoDetalhado

```typescript
{
  totalPreco: 27000, // centavos
  totalGB: 160,
  numeroLinhas: 2,
  linhas: [
    {
      numero: 1,
      plano: "Fibra 500 Mega",
      operadora: "V",
      precoPlano: 12900,
      gbPlano: 0,
      adicionais: [...],
      subtotalLinha: 14400,
      subtotalGB: 10
    }
  ]
}
```

## 🎨 Exemplo de Uso Completo

```typescript
// Página de categoria
import ResumoMultiLinha from "@/components/app/ResumoMultiLinha";

export default function CategoriaPage() {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
      {/* Produtos */}
      <div>
        {produtos.map((produto) => (
          <CardInteligente produto={produto} />
        ))}
      </div>

      {/* Resumo Desktop */}
      <div className="hidden lg:block">
        <ResumoMultiLinha />
      </div>

      {/* Resumo Mobile */}
      <div className="lg:hidden">
        <ResumoMultiLinha />
      </div>
    </div>
  );
}
```

## 🔧 Configuração

### Requisitos:

- Zustand (state management)
- React Query (API calls)
- Shadcn/ui (componentes)
- Tailwind CSS (estilos)

### Instalação:

Todos os arquivos já foram criados:

- ✅ `stores/multiLinhaStore.ts`
- ✅ `components/app/ResumoMultiLinha.tsx`
- ✅ `components/app/ResumoMultiLinhaDesktop.tsx`
- ✅ `components/app/ResumoMultiLinhaMobile.tsx`
- ✅ `components/app/ModalAdicionais.tsx`
- ✅ `components/app/CardInteligente.tsx` (atualizado)
- ✅ `pages/app/categoria.tsx` (atualizado)

## 📱 Screenshots Esperados

### Desktop

```
┌─────────────────────────────────┬────────────────┐
│ [Filtros PF/PJ] [Novo/Portab.]  │  ┌──────────┐  │
├─────────────────────────────────┤  │ RESUMO   │  │
│                                 │  │          │  │
│  ┌────────┐  ┌────────┐        │  │ Linha 1  │  │
│  │ Plano  │  │ Plano  │        │  │ ├─────   │  │
│  │   A    │  │   B    │        │  │          │  │
│  └────────┘  └────────┘        │  │ Linha 2  │  │
│                                 │  │ ├─────   │  │
│  ┌────────┐  ┌────────┐        │  │          │  │
│  │ Plano  │  │ Plano  │        │  │ Total:   │  │
│  │   C    │  │   D    │        │  │ R$ 270   │  │
│  └────────┘  └────────┘        │  │ 160GB    │  │
│                                 │  └──────────┘  │
└─────────────────────────────────┴────────────────┘
```

### Mobile

```
┌────────────────────┐
│ [Filtros]          │
├────────────────────┤
│  ┌──────────────┐  │
│  │   Plano A    │  │
│  │ [Nova Linha] │  │
│  └──────────────┘  │
│                    │
│  ┌──────────────┐  │
│  │   Plano B    │  │
│  └──────────────┘  │
│                    │
├────────────────────┤
│ [R$ 270 • 160GB] ← │ ← Botão flutuante fixo
└────────────────────┘
```

## 🚀 Próximos Passos

1. ✅ Sistema multi-linha implementado
2. ✅ Cálculo automático de preço e GB
3. ✅ Adicionais por linha
4. ✅ Interface responsiva (desktop + mobile)
5. ⏳ Integração com checkout
6. ⏳ Persistência no backend
7. ⏳ Analytics de conversão

## 💡 Dicas de UX

- **Sempre visível**: O usuário nunca perde de vista o total
- **Feedback imediato**: Toda ação atualiza o resumo instantaneamente
- **Transparência total**: Cada linha mostra plano + adicionais + subtotal
- **Fácil edição**: Remover linhas/adicionais é intuitivo
- **Mobile-first**: Botão flutuante não atrapalha navegação
