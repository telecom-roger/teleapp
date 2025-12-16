-- Migration: Adicionar tabela de linhas de portabilidade
-- Created: 2025-12-16

-- Criar tabela de linhas do pedido
CREATE TABLE IF NOT EXISTS ecommerce_order_lines (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES ecommerce_products(id),
  numero VARCHAR(20) NOT NULL,
  operadora_atual VARCHAR(50),
  operadora_destino VARCHAR(50),
  svas TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) NOT NULL DEFAULT 'inicial',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_lines_order ON ecommerce_order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_lines_numero ON ecommerce_order_lines(numero);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_lines_status ON ecommerce_order_lines(status);

-- Adicionar nova etapa no fluxo de pedidos
-- Nota: Esta etapa será usada quando o pedido for de portabilidade e precisar dos dados das linhas
COMMENT ON TABLE ecommerce_order_lines IS 'Armazena as linhas de portabilidade de cada pedido. Cada linha representa um número a ser portado com seu plano e SVAs.';
