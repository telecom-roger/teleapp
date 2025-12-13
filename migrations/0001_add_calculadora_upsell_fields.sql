-- Migration: Add calculator and upsell fields to ecommerce_products
-- Created: 2025-12-13

-- Adicionar campo de calculadora de múltiplas linhas
ALTER TABLE ecommerce_products 
ADD COLUMN permite_calculadora_linhas BOOLEAN DEFAULT false;

-- Adicionar campo de texto personalizado do upsell
ALTER TABLE ecommerce_products 
ADD COLUMN texto_upsell TEXT;

-- Adicionar campo de lista de SVAs para upsell
ALTER TABLE ecommerce_products 
ADD COLUMN svas_upsell TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Comentários para documentação
COMMENT ON COLUMN ecommerce_products.permite_calculadora_linhas IS 'Define se o produto permite usar a calculadora de múltiplas linhas';
COMMENT ON COLUMN ecommerce_products.texto_upsell IS 'Texto personalizado exibido no modal de upsell. Se vazio, usa texto padrão.';
COMMENT ON COLUMN ecommerce_products.svas_upsell IS 'Array de IDs dos produtos SVA que podem ser oferecidos como upsell';

-- Atualizar produtos de móvel e office para permitir calculadora por padrão
UPDATE ecommerce_products 
SET permite_calculadora_linhas = true 
WHERE categoria IN ('movel', 'office');
