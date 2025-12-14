-- Adicionar campo diferenciais aos produtos do e-commerce
-- Data: 2025-12-13

ALTER TABLE ecommerce_products 
ADD COLUMN IF NOT EXISTS diferenciais text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN ecommerce_products.diferenciais IS 'Array de diferenciais do produto (colapsável), separado dos benefícios principais';
