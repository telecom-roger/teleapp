-- Adiciona campos faltantes na tabela ecommerce_orders
-- Migration: add_ecommerce_orders_fields
-- Data: 2025-12-13

-- Adicionar coluna taxa_instalacao se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ecommerce_orders' 
    AND column_name = 'taxa_instalacao'
  ) THEN
    ALTER TABLE ecommerce_orders 
    ADD COLUMN taxa_instalacao INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar coluna economia se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ecommerce_orders' 
    AND column_name = 'economia'
  ) THEN
    ALTER TABLE ecommerce_orders 
    ADD COLUMN economia INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Criar índice no responsavel_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ecommerce_orders' 
    AND indexname = 'idx_ecommerce_orders_responsavel'
  ) THEN
    CREATE INDEX idx_ecommerce_orders_responsavel ON ecommerce_orders(responsavel_id);
  END IF;
END $$;

COMMENT ON COLUMN ecommerce_orders.taxa_instalacao IS 'Taxa de instalação em centavos';
COMMENT ON COLUMN ecommerce_orders.economia IS 'Economia oferecida ao cliente em centavos';
