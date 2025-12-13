-- Migration: Adicionar campos para recomendação inteligente e adicionais
-- Data: 2025-01-13

-- 1️⃣ Adicionar novos campos em ecommerce_products
ALTER TABLE ecommerce_products
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(20) DEFAULT 'ambos',
  ADD COLUMN IF NOT EXISTS uso_recomendado TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS limite_dispositivos_min INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS limite_dispositivos_max INTEGER DEFAULT 999,
  ADD COLUMN IF NOT EXISTS badge_texto TEXT,
  ADD COLUMN IF NOT EXISTS texto_decisao TEXT,
  ADD COLUMN IF NOT EXISTS score_base INTEGER DEFAULT 50;

-- 2️⃣ Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_tipo_pessoa ON ecommerce_products(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_modalidade ON ecommerce_products(modalidade);

-- 3️⃣ Criar tabela de adicionais (produtos complementares)
CREATE TABLE IF NOT EXISTS ecommerce_adicionais (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL, -- apps-ilimitados, gb-extra, aparelho, equipamento, licenca, servico
  preco INTEGER NOT NULL, -- em centavos
  tipo_cobranca VARCHAR(20) DEFAULT 'mensal', -- mensal, unico
  categoria VARCHAR(50), -- Para qual categoria de produto é compatível
  operadora VARCHAR(10), -- V, C, T (null = todas)
  tipo_pessoa VARCHAR(10) DEFAULT 'ambos', -- PF, PJ, ambos
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  icone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_adicionais_tipo ON ecommerce_adicionais(tipo);
CREATE INDEX IF NOT EXISTS idx_ecommerce_adicionais_categoria ON ecommerce_adicionais(categoria);
CREATE INDEX IF NOT EXISTS idx_ecommerce_adicionais_ativo ON ecommerce_adicionais(ativo);

-- 4️⃣ Criar tabela de relacionamento produto x adicional
CREATE TABLE IF NOT EXISTS ecommerce_product_adicionais (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  product_id VARCHAR NOT NULL REFERENCES ecommerce_products(id) ON DELETE CASCADE,
  adicional_id VARCHAR NOT NULL REFERENCES ecommerce_adicionais(id) ON DELETE CASCADE,
  recomendado BOOLEAN DEFAULT FALSE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_adicionais_product ON ecommerce_product_adicionais(product_id);
CREATE INDEX IF NOT EXISTS idx_product_adicionais_adicional ON ecommerce_product_adicionais(adicional_id);

-- 5️⃣ Inserir exemplos de adicionais
INSERT INTO ecommerce_adicionais (nome, descricao, tipo, preco, tipo_cobranca, categoria, tipo_pessoa, ativo, icone, ordem) VALUES
  -- Apps ilimitados (móvel)
  ('WhatsApp Ilimitado', 'Use WhatsApp sem consumir franquia', 'apps-ilimitados', 500, 'mensal', 'movel', 'PF', TRUE, 'MessageCircle', 1),
  ('Instagram + Facebook Ilimitados', 'Acesso ilimitado às redes sociais', 'apps-ilimitados', 800, 'mensal', 'movel', 'PF', TRUE, 'Instagram', 2),
  ('YouTube + Netflix Ilimitados', 'Streaming sem descontar da franquia', 'apps-ilimitados', 1200, 'mensal', 'movel', 'PF', TRUE, 'Youtube', 3),
  
  -- GB Extra
  ('5 GB Extras', 'Adicione 5 GB à sua franquia mensal', 'gb-extra', 1500, 'mensal', 'movel', 'ambos', TRUE, 'Database', 4),
  ('10 GB Extras', 'Adicione 10 GB à sua franquia mensal', 'gb-extra', 2500, 'mensal', 'movel', 'ambos', TRUE, 'Database', 5),
  ('20 GB Extras', 'Adicione 20 GB à sua franquia mensal', 'gb-extra', 4000, 'mensal', 'movel', 'ambos', TRUE, 'Database', 6),
  
  -- Equipamentos
  ('Roteador Wi-Fi 6', 'Roteador de alta performance', 'equipamento', 15000, 'unico', 'fibra', 'ambos', TRUE, 'Wifi', 7),
  ('Repetidor de Sinal', 'Amplie o alcance do seu Wi-Fi', 'equipamento', 8000, 'unico', 'fibra', 'ambos', TRUE, 'Radio', 8),
  ('Modem GPON', 'Modem compatível com fibra óptica', 'equipamento', 20000, 'unico', 'fibra', 'ambos', TRUE, 'Box', 9),
  
  -- Licenças (PJ)
  ('Office 365 Business Basic', '1 licença Microsoft 365', 'licenca', 2200, 'mensal', 'office', 'PJ', TRUE, 'Briefcase', 10),
  ('Office 365 Business Standard', '1 licença com apps desktop', 'licenca', 4500, 'mensal', 'office', 'PJ', TRUE, 'Briefcase', 11),
  
  -- Serviços (PJ)
  ('Suporte Técnico Premium', 'Atendimento prioritário 24/7', 'servico', 10000, 'mensal', NULL, 'PJ', TRUE, 'HeadphonesIcon', 12),
  ('IP Fixo', 'Endereço IP dedicado', 'servico', 5000, 'mensal', 'fibra', 'PJ', TRUE, 'Globe', 13),
  ('Backup em Nuvem 100GB', 'Armazenamento seguro na nuvem', 'servico', 3000, 'mensal', NULL, 'PJ', TRUE, 'Cloud', 14)
ON CONFLICT DO NOTHING;

-- 6️⃣ Comentários explicativos
COMMENT ON COLUMN ecommerce_products.modalidade IS 'novo, portabilidade ou ambos';
COMMENT ON COLUMN ecommerce_products.uso_recomendado IS 'Array com: trabalho, streaming, jogos, basico, equipe';
COMMENT ON COLUMN ecommerce_products.badge_texto IS 'Texto do badge: Melhor para você, Ideal para empresa, etc';
COMMENT ON COLUMN ecommerce_products.texto_decisao IS 'Explicação curta do porque é recomendado';
COMMENT ON COLUMN ecommerce_products.score_base IS 'Score base para ordenação (0-100)';

COMMENT ON TABLE ecommerce_adicionais IS 'Produtos complementares (apps, GB, equipamentos, licenças)';
COMMENT ON TABLE ecommerce_product_adicionais IS 'Relacionamento entre produtos e adicionais compatíveis';
