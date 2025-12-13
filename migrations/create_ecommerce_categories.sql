-- Create ecommerce_categories table
CREATE TABLE IF NOT EXISTS ecommerce_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'Package',
  cor VARCHAR(20) DEFAULT 'blue',
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_ativo ON ecommerce_categories(ativo);
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_ordem ON ecommerce_categories(ordem);

-- Insert default categories
INSERT INTO ecommerce_categories (nome, slug, descricao, icone, cor, ativo, ordem) VALUES
  ('Fibra Óptica', 'fibra', 'Internet de ultra velocidade', 'Wifi', '#9333ea', true, 1),
  ('Móvel', 'movel', 'Planos para seu celular', 'Smartphone', '#3b82f6', true, 2),
  ('TV', 'tv', 'Canais e streaming', 'Tv', '#10b981', true, 3),
  ('Combos', 'combo', 'Pacotes completos', 'Package', '#f59e0b', true, 4),
  ('Empresarial', 'empresarial', 'Soluções para empresas', 'Briefcase', '#ef4444', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Add ordem column to ecommerce_products if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='ecommerce_products' AND column_name='ordem'
  ) THEN
    ALTER TABLE ecommerce_products ADD COLUMN ordem INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_ecommerce_products_ordem ON ecommerce_products(ordem);
  END IF;
END $$;

COMMENT ON TABLE ecommerce_categories IS 'Categorias dinâmicas para produtos do e-commerce';
COMMENT ON COLUMN ecommerce_categories.icone IS 'Nome do ícone lucide-react (ex: Wifi, Smartphone)';
COMMENT ON COLUMN ecommerce_categories.cor IS 'Cor hexadecimal ou classe Tailwind para temas';
COMMENT ON COLUMN ecommerce_categories.ordem IS 'Ordem de exibição (menor = primeiro)';
