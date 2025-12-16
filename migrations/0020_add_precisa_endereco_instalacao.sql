-- Migration: Adicionar campo precisa_endereco_instalacao na tabela ecommerce_products
-- Data: 2025-12-16
-- Descrição: Permite controlar por produto se é necessário solicitar endereço de instalação no checkout

-- Adicionar coluna
ALTER TABLE ecommerce_products 
ADD COLUMN IF NOT EXISTS precisa_endereco_instalacao BOOLEAN DEFAULT false;

-- Atualizar produtos de categorias que normalmente precisam de instalação
UPDATE ecommerce_products 
SET precisa_endereco_instalacao = true 
WHERE categoria IN ('fibra', 'banda larga', 'link dedicado', 'internet-dedicada')
  OR LOWER(categoria) LIKE '%fibra%'
  OR LOWER(categoria) LIKE '%banda larga%'
  OR LOWER(categoria) LIKE '%link dedicado%';

-- Comentário na coluna
COMMENT ON COLUMN ecommerce_products.precisa_endereco_instalacao IS 'Indica se o produto requer endereço de instalação no checkout';
