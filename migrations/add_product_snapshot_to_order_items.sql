-- Adicionar campos de snapshot do produto aos itens do pedido
-- Isso garante que temos os dados do produto mesmo se ele for alterado/deletado depois

-- Adicionar campos de produto
ALTER TABLE ecommerce_order_items 
ADD COLUMN IF NOT EXISTS product_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_descricao TEXT,
ADD COLUMN IF NOT EXISTS product_categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_operadora VARCHAR(100),
ADD COLUMN IF NOT EXISTS valor_por_linha_adicional INTEGER DEFAULT 0;

-- Atualizar registros existentes com dados dos produtos atuais
UPDATE ecommerce_order_items 
SET 
  product_nome = p.nome,
  product_descricao = p.descricao,
  product_categoria = p.categoria,
  product_operadora = p.operadora,
  valor_por_linha_adicional = COALESCE(p.valor_por_linha_adicional, 0)
FROM ecommerce_products p
WHERE ecommerce_order_items.product_id = p.id
  AND ecommerce_order_items.product_nome IS NULL;

-- Criar índices para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_categoria ON ecommerce_order_items(product_categoria);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_operadora ON ecommerce_order_items(product_operadora);

COMMENT ON COLUMN ecommerce_order_items.product_nome IS 'Nome do produto no momento do pedido (snapshot)';
COMMENT ON COLUMN ecommerce_order_items.product_descricao IS 'Descrição do produto no momento do pedido (snapshot)';
COMMENT ON COLUMN ecommerce_order_items.product_categoria IS 'Categoria do produto no momento do pedido (snapshot)';
COMMENT ON COLUMN ecommerce_order_items.product_operadora IS 'Operadora do produto no momento do pedido (snapshot)';
