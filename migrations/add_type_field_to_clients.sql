-- Adicionar campo type (PF/PJ) à tabela clients

DO $$ 
BEGIN
  -- Adicionar campo type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'type'
  ) THEN
    ALTER TABLE clients 
    ADD COLUMN type VARCHAR(2);
    
    COMMENT ON COLUMN clients.type IS 'Tipo de pessoa: PF (Pessoa Física) ou PJ (Pessoa Jurídica)';
  END IF;

  -- Atualizar registros existentes baseado no tipo_cliente
  UPDATE clients 
  SET type = 
    CASE 
      WHEN tipo_cliente ILIKE '%PF%' THEN 'PF'
      WHEN tipo_cliente ILIKE '%PJ%' THEN 'PJ'
      WHEN cnpj IS NOT NULL AND LENGTH(cnpj) = 14 THEN 'PJ'
      ELSE 'PF'
    END
  WHERE type IS NULL;

END $$;

-- Mostrar resultados da migração
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN type = 'PF' THEN 1 END) as clientes_pf,
  COUNT(CASE WHEN type = 'PJ' THEN 1 END) as clientes_pj,
  COUNT(CASE WHEN origin = 'system' THEN 1 END) as origin_system,
  COUNT(CASE WHEN origin = 'ecommerce' THEN 1 END) as origin_ecommerce,
  COUNT(CASE WHEN origin = 'both' THEN 1 END) as origin_both
FROM clients;
