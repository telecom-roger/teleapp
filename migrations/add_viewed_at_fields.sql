-- Add last_viewed_at and last_viewed_by_admin_at fields to ecommerce_orders
-- These fields track when orders were last viewed to manage notification badges

DO $$ 
BEGIN
  -- Add last_viewed_at column (for customer views)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ecommerce_orders' AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE ecommerce_orders 
    ADD COLUMN last_viewed_at TIMESTAMP;
    
    COMMENT ON COLUMN ecommerce_orders.last_viewed_at IS 'Última vez que o cliente visualizou este pedido';
  END IF;

  -- Add last_viewed_by_admin_at column (for admin views)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ecommerce_orders' AND column_name = 'last_viewed_by_admin_at'
  ) THEN
    ALTER TABLE ecommerce_orders 
    ADD COLUMN last_viewed_by_admin_at TIMESTAMP;
    
    COMMENT ON COLUMN ecommerce_orders.last_viewed_by_admin_at IS 'Última vez que um admin visualizou este pedido';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_last_viewed 
ON ecommerce_orders(last_viewed_at);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_admin_viewed 
ON ecommerce_orders(last_viewed_by_admin_at);

-- Show migration results
SELECT 
  COUNT(*) as total_orders,
  COUNT(last_viewed_at) as orders_with_client_view,
  COUNT(last_viewed_by_admin_at) as orders_with_admin_view
FROM ecommerce_orders;
