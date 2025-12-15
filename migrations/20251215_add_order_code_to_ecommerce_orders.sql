-- 1. Adiciona a coluna como NULLABLE
ALTER TABLE ecommerce_orders ADD COLUMN order_code VARCHAR(16) UNIQUE;

-- 2. Preenche valores para registros existentes (exemplo: usando o id como base)
UPDATE ecommerce_orders SET order_code = LEFT(REPLACE(id::text, '-', ''), 16) WHERE order_code IS NULL;

-- 3. Torna a coluna NOT NULL
ALTER TABLE ecommerce_orders ALTER COLUMN order_code SET NOT NULL;
