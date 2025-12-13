-- Adicionar coluna origin na tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'system';

-- Atualizar clients existentes como system
UPDATE clients SET origin = 'system' WHERE origin IS NULL;

-- Adicionar comentário
COMMENT ON COLUMN clients.origin IS 'Origem do cliente: system (CRM interno) ou ecommerce (loja online)';
