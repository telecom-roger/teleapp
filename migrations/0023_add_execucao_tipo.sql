-- Migration: Add execucao_tipo field to ecommerce_orders
-- This field stores the execution type when order is in "em_andamento" status

ALTER TABLE ecommerce_orders 
ADD COLUMN IF NOT EXISTS execucao_tipo VARCHAR(50);

-- Add comment to explain the field
COMMENT ON COLUMN ecommerce_orders.execucao_tipo IS 'Tipo de execução quando status = em_andamento: instalacao, entrega, ativacao_remota, provisionamento, outro';
