-- Migration simplificada: Múltiplos textos de upsell
-- Execução manual com psql ou parte por parte

-- PASSO 1: Alterar schema
ALTER TABLE ecommerce_products DROP COLUMN IF EXISTS texto_upsell;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS textos_upsell text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN ecommerce_products.textos_upsell IS 'Array de textos de upsell. Sistema escolhe um aleatoriamente. Aceita variáveis: [nome_servico], [preco]';
