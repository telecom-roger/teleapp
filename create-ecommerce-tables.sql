-- Criar tabelas do e-commerce

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS ecommerce_products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50) NOT NULL,
  operadora VARCHAR(10) NOT NULL,
  velocidade VARCHAR(50),
  preco INTEGER NOT NULL,
  valor_por_linha_adicional INTEGER DEFAULT 0,
  tipo_pessoa VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  caracteristicas TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_categoria ON ecommerce_products(categoria);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_operadora ON ecommerce_products(operadora);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_ativo ON ecommerce_products(ativo);

-- Tabela de etapas do Kanban
CREATE TABLE IF NOT EXISTS ecommerce_stages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  cor VARCHAR(20) DEFAULT 'slate',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_stages_ordem ON ecommerce_stages(ordem);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tipo_pessoa VARCHAR(2) NOT NULL,
  
  -- Dados PF
  nome_completo TEXT,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  data_nascimento DATE,
  
  -- Dados PJ
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj VARCHAR(18),
  inscricao_estadual VARCHAR(20),
  
  -- Contato
  email VARCHAR(255),
  telefone VARCHAR(20),
  telefone_secundario VARCHAR(20),
  
  -- Endereço
  cep VARCHAR(10),
  endereco TEXT,
  numero VARCHAR(20),
  complemento TEXT,
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  
  -- Pedido
  etapa VARCHAR(50) NOT NULL DEFAULT 'novo_pedido',
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  dados_adicionais JSONB DEFAULT '{}'::JSONB,
  termos_aceitos BOOLEAN DEFAULT false,
  metodo_pagamento VARCHAR(50),
  responsavel_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_client ON ecommerce_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_etapa ON ecommerce_orders(etapa);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_created ON ecommerce_orders(created_at);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS ecommerce_order_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES ecommerce_products(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  linhas_adicionais INTEGER DEFAULT 0,
  preco_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_order ON ecommerce_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_product ON ecommerce_order_items(product_id);

-- Tabela de documentos do pedido
CREATE TABLE IF NOT EXISTS ecommerce_order_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_order_documents_order ON ecommerce_order_documents(order_id);

-- Inserir produtos de exemplo
INSERT INTO ecommerce_products (nome, descricao, categoria, operadora, velocidade, preco, tipo_pessoa, ativo, destaque)
VALUES
  ('Fibra 500MB + TV', 'Internet de 500 Mbps + TV com 100 canais', 'combo', 'V', '500 Mbps', 12900, 'PF', true, true),
  ('Fibra 300MB Residencial', 'Internet Fibra Óptica 300 Mbps', 'fibra', 'V', '300 Mbps', 8900, 'PF', true, false),
  ('Fibra 600MB Empresarial', 'Internet Fibra Óptica 600 Mbps para empresas', 'fibra', 'C', '600 Mbps', 24900, 'PJ', true, false),
  ('Móvel 20GB', 'Plano móvel com 20GB de internet', 'movel', 'T', '4G/5G', 4990, 'PF', true, false),
  ('Office 365 Business', 'Pacote Office completo na nuvem', 'office', 'C', 'Cloud', 5900, 'PJ', true, false)
ON CONFLICT DO NOTHING;

-- Inserir etapas do Kanban
INSERT INTO ecommerce_stages (titulo, descricao, ordem, cor)
VALUES
  ('Novo Pedido', 'Pedidos recém criados aguardando análise', 0, 'blue'),
  ('Em Análise', 'Pedidos em análise pela equipe', 1, 'yellow'),
  ('Documentos Pendentes', 'Aguardando envio de documentos', 2, 'orange'),
  ('Aprovado', 'Pedido aprovado, aguardando instalação', 3, 'green'),
  ('Em Instalação', 'Equipe técnica agendada/instalando', 4, 'purple'),
  ('Concluído', 'Pedido concluído com sucesso', 5, 'emerald'),
  ('Cancelado', 'Pedido cancelado', 6, 'red')
ON CONFLICT DO NOTHING;
