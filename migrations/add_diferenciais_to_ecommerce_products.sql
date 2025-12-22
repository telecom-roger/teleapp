-- Adiciona o campo diferenciais (array de texto) na tabela ecommerce_products
ALTER TABLE ecommerce_products ADD COLUMN diferenciais text[] DEFAULT ARRAY[]::text[];
