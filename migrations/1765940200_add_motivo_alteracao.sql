-- Add motivo_alteracao column to ecommerce_orders
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS motivo_alteracao TEXT;
