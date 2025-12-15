-- Migration: Add ecommerce_order_requested_documents table
-- This table tracks which documents are required for each order
-- and their validation status

CREATE TABLE IF NOT EXISTS ecommerce_order_requested_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- rg, cpf, cnpj, contrato_social, comprovante_endereco, procuracao, cnh, outros
  nome VARCHAR(255) NOT NULL, -- Display name for the client (e.g., "RG", "CPF", "Comprovante de Endereço")
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, enviado, aprovado, reprovado
  observacoes TEXT, -- Rejection reason or additional instructions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_requested_documents_order ON ecommerce_order_requested_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_requested_documents_status ON ecommerce_order_requested_documents(status);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ecommerce_order_requested_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ecommerce_order_requested_documents_updated_at
  BEFORE UPDATE ON ecommerce_order_requested_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_ecommerce_order_requested_documents_updated_at();
