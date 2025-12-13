-- Script de teste para e-commerce

-- 1. Adicionar coluna origin se não existir
ALTER TABLE clients ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'system';
UPDATE clients SET origin = 'system' WHERE origin IS NULL;

-- 2. Inserir produtos de exemplo (se não existirem)
INSERT INTO ecommerce_products (nome, descricao, categoria, operadora, velocidade, preco, tipo_pessoa, ativo)
SELECT * FROM (VALUES
  ('Fibra 500MB + TV', 'Internet de 500 Mbps + TV com 100 canais', 'combo', 'V', '500 Mbps', 12900, 'PF', true),
  ('Fibra 300MB Residencial', 'Internet Fibra Óptica 300 Mbps', 'fibra', 'V', '300 Mbps', 8900, 'PF', true),
  ('Fibra 600MB Empresarial', 'Internet Fibra Óptica 600 Mbps para empresas', 'fibra', 'C', '600 Mbps', 24900, 'PJ', true),
  ('Móvel 20GB', 'Plano móvel com 20GB de internet', 'movel', 'T', '4G/5G', 4990, 'PF', true),
  ('Office 365 Business', 'Pacote Office completo na nuvem', 'office', 'C', 'Cloud', 5900, 'PJ', true)
) AS v(nome, descricao, categoria, operadora, velocidade, preco, tipo_pessoa, ativo)
WHERE NOT EXISTS (
  SELECT 1 FROM ecommerce_products LIMIT 1
);

-- 3. Verificar produtos criados
SELECT id, nome, preco/100.0 as preco_reais, tipo_pessoa, ativo FROM ecommerce_products;
