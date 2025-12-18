-- Migration: Add Many-to-Many relationship between products and categories
-- Created: 2025-12-17

-- 1. Criar tabela de relacionamento muitos-para-muitos
CREATE TABLE IF NOT EXISTS "ecommerce_product_categories" (
	"product_id" varchar NOT NULL,
	"category_slug" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ecommerce_product_categories_product_id_category_slug_pk" PRIMARY KEY("product_id","category_slug")
);

-- 2. Adicionar foreign keys
ALTER TABLE "ecommerce_product_categories" 
  ADD CONSTRAINT "ecommerce_product_categories_product_id_ecommerce_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE;

ALTER TABLE "ecommerce_product_categories" 
  ADD CONSTRAINT "ecommerce_product_categories_category_slug_ecommerce_categories_slug_fk" 
  FOREIGN KEY ("category_slug") REFERENCES "ecommerce_categories"("slug") ON DELETE CASCADE;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS "idx_product_categories_product" ON "ecommerce_product_categories" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_categories_category" ON "ecommerce_product_categories" ("category_slug");

-- 4. Migrar dados existentes: copiar categoria atual de cada produto para a nova tabela
INSERT INTO "ecommerce_product_categories" ("product_id", "category_slug", "created_at")
SELECT 
  id as product_id,
  categoria as category_slug,
  NOW() as created_at
FROM "ecommerce_products"
WHERE categoria IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. IMPORTANTE: NÃO remover o campo "categoria" ainda
-- Vamos mantê-lo temporariamente para retrocompatibilidade
-- Após validar que tudo funciona, podemos removê-lo em uma migration futura
-- ALTER TABLE "ecommerce_products" DROP COLUMN "categoria";

-- Nota: O campo "categoria" será mantido como "categoria principal" 
-- até que todas as queries sejam migradas para usar a nova tabela
