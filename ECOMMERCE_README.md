# 🛍️ Módulo E-commerce - Planos de Telecom

## 📋 Visão Geral

Módulo completo de vendas online de planos de telecom integrado ao sistema existente.

**Status:** ✅ MVP Funcional (Sessão 1 Completa)  
**Última Atualização:** 12/12/2025

---

## 🚀 Quick Start

### 1. Inicializar Etapas do Kanban (Primeira Vez)

```bash
# Conectar ao PostgreSQL e executar:
psql -d seu_banco -f scripts/init-ecommerce-stages.sql
```

### 2. Acessar o E-commerce

**Público:**
- Home: `http://localhost:5000/ecommerce`
- Planos: `http://localhost:5000/ecommerce/planos`

**Admin (requer login):**
- Produtos: `http://localhost:5000/admin/ecommerce-produtos`
- Pedidos: `http://localhost:5000/admin/ecommerce-pedidos`

---

## 📡 APIs Disponíveis

### Produtos (Public)

```bash
# Listar produtos
GET /api/ecommerce/products
Query params: ?categoria=fibra&operadora=V&tipoPessoa=PF&ativo=true

# Detalhes de um produto
GET /api/ecommerce/products/:id
```

### Produtos (Admin - Requer Auth)

```bash
# Criar produto
POST /api/ecommerce/products
{
  "nome": "Fibra 500 Mega",
  "categoria": "fibra",
  "operadora": "V",
  "velocidade": "500 Mbps",
  "preco": 9900,  // em centavos
  "tipoPessoa": "PF",
  "ativo": true
}

# Atualizar produto
PUT /api/ecommerce/products/:id

# Deletar produto
DELETE /api/ecommerce/products/:id
```

### Pedidos

```bash
# Criar pedido (público)
POST /api/ecommerce/orders
{
  "tipoPessoa": "PF",
  "cpf": "12345678901",
  "nomeCompleto": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999999999",
  "cep": "01310100",
  "endereco": "Av. Paulista",
  "numero": "1000",
  "items": [
    {
      "productId": "uuid-produto",
      "quantidade": 1,
      "precoUnitario": 9900,
      "subtotal": 9900
    }
  ],
  "total": 9900
}

# Listar pedidos (admin)
GET /api/ecommerce/orders
Query params: ?etapa=novo_pedido&tipoPessoa=PF

# Detalhes pedido (admin)
GET /api/ecommerce/orders/:id
```

### CEP (Público)

```bash
GET /api/cep/01310100
# Retorna: { cep, endereco, bairro, cidade, uf }
```

---

## 🗄️ Estrutura do Banco

### Tabelas

- `ecommerce_products` - Catálogo de planos
- `ecommerce_orders` - Pedidos recebidos
- `ecommerce_order_items` - Itens dos pedidos
- `ecommerce_stages` - Etapas do Kanban
- `ecommerce_order_documents` - Documentos anexados
- `clients.origin` - Diferencia origem (system/ecommerce)

### Campos Importantes

**ecommerce_products:**
- `preco` - Em centavos (ex: 9900 = R$ 99,00)
- `operadora` - V, C ou T
- `tipoPessoa` - PF, PJ ou ambos

**ecommerce_orders:**
- `etapa` - Status atual no fluxo
- `origin` - system ou ecommerce

---

## 🎨 Identidade Visual

### Operadoras (Sem Logos Oficiais)

| Operadora | Label         | Cor    | Hex      |
|-----------|---------------|--------|----------|
| V         | Operadora V   | Roxo   | #9333ea  |
| C         | Operadora C   | Vermelho | #dc2626  |
| T         | Operadora T   | Azul   | #2563eb  |

**⚠️ Importante:** Não usar logos oficiais. Usar apenas cores e labels.

---

## 🔒 Validações

### CPF
- Algoritmo completo de validação
- Remove caracteres não numéricos
- Verifica dígitos verificadores

### CNPJ
- Algoritmo completo de validação
- Remove caracteres não numéricos
- Verifica dígitos verificadores

### CEP
- Integração com ViaCEP
- Autocomplete de endereço

---

## 🔐 Segurança e Criação de Usuário

### Fluxo de Novo Cliente

1. API recebe pedido
2. Valida CPF/CNPJ
3. Verifica se cliente já existe (por CPF/CNPJ ou email)
4. **Se não existir:**
   - Cria cliente com `origin: "ecommerce"`
   - Gera senha temporária (8 caracteres)
   - Cria usuário com hash bcrypt
   - **TODO:** Envia email com credenciais

### Senha Temporária

```javascript
// Formato: 8 caracteres (letras + números + especiais)
// Exemplo: "aB3$xY9!"
```

---

## 📂 Arquivos Criados

```
server/
  ecommerceRoutes.ts         ← APIs completas

client/src/
  components/ecommerce/
    EcommerceHeader.tsx      ← Header público
    EcommerceFooter.tsx      ← Footer público
  
  pages/
    ecommerce/
      home.tsx               ← Home pública
      planos.tsx             ← Lista de planos
    
    admin/
      ecommerce-produtos.tsx ← Admin CRUD produtos
      ecommerce-pedidos.tsx  ← Admin lista pedidos

scripts/
  init-ecommerce-stages.sql  ← Inicializar etapas

ECOMMERCE_PROGRESS.md        ← Checkpoint de desenvolvimento
ECOMMERCE_README.md          ← Este arquivo
```

---

## ✅ Checklist de Funcionalidades (MVP)

### Backend
- ✅ CRUD Produtos completo
- ✅ CRUD Pedidos completo
- ✅ Validação CPF/CNPJ
- ✅ Integração ViaCEP
- ✅ Criação automática de cliente
- ✅ Criação automática de usuário

### Frontend Público
- ✅ Home page com categorias
- ✅ Lista de planos com filtros
- ✅ Cards de produtos responsivos
- ✅ Header e Footer

### Frontend Admin
- ✅ CRUD visual de produtos
- ✅ Listagem de pedidos

---

## ⏳ Próximas Funcionalidades (Sessão 2)

- ❌ Sidebar/Carrinho de compras
- ❌ Fluxo de checkout completo (5 páginas)
- ❌ Upload de documentos funcional
- ❌ Kanban visual no admin
- ❌ Sistema de emails automáticos
- ❌ Dashboard com métricas
- ❌ Comparador lado a lado

---

## 🧪 Como Testar

### 1. Criar Produto de Teste

```bash
# Login no sistema como admin
# Acessar: /admin/ecommerce-produtos
# Clicar em "Novo Produto"
# Preencher:
Nome: Fibra 500 Mega
Categoria: fibra
Operadora: V
Velocidade: 500 Mbps
Preço: 99.90
Tipo Pessoa: PF
Ativo: ON
```

### 2. Ver Produto no Site

```bash
# Acessar: /ecommerce/planos
# Filtrar por PF
# Ver produto aparecer
```

### 3. Testar APIs

```bash
# Via Thunder Client ou Postman
GET http://localhost:5000/api/ecommerce/products
GET http://localhost:5000/api/cep/01310100
```

---

## 🐛 Troubleshooting

### Produtos não aparecem
- Verificar se `ativo = true`
- Verificar filtro `tipoPessoa`
- Checar console do navegador

### Erro 401 no admin
- Fazer login no sistema
- Verificar role do usuário

### CEP não retorna
- Verificar conexão com internet
- ViaCEP pode estar fora
- Tentar CEP diferente

---

## 📝 Observações Importantes

### LGPD
- Campo `origin` rastreia fonte dos dados
- Footer com links de privacidade
- Coleta mínima de dados

### Performance
- Índices criados nas tabelas
- Queries otimizadas
- Paginação preparada

### Isolamento
- Não afeta Kanban atual
- Rotas separadas `/api/ecommerce/*`
- Páginas públicas isoladas

---

## 🆘 Suporte

Para dúvidas ou problemas:

1. Consultar `ECOMMERCE_PROGRESS.md` para detalhes técnicos
2. Verificar logs do servidor
3. Checar erros no console do navegador
4. Revisar schemas em `shared/schema.ts` (linhas 745-893)

---

**Desenvolvido em:** 12/12/2025  
**Versão:** 1.0 (MVP)  
**Status:** ✅ Funcional e Testável
