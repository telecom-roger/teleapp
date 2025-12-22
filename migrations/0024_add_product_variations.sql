-- ==================== ADD PRODUCT VARIATIONS SYSTEM ====================

-- 1. Adicionar campo possuiVariacoes na tabela de produtos
ALTER TABLE "ecommerce_products" 
ADD COLUMN IF NOT EXISTS "possui_variacoes" boolean DEFAULT false;

-- 2. Criar tabela de grupos de variação
CREATE TABLE IF NOT EXISTS "ecommerce_product_variation_groups" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar NOT NULL REFERENCES "ecommerce_products"("id") ON DELETE CASCADE,
  "nome" text NOT NULL,
  "tipo_selecao" varchar(20) NOT NULL DEFAULT 'radio',
  "obrigatorio" boolean DEFAULT true,
  "min_selecoes" integer DEFAULT 1,
  "max_selecoes" integer DEFAULT 1,
  "ordem" integer DEFAULT 0,
  "ativo" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 3. Criar tabela de opções de variação
CREATE TABLE IF NOT EXISTS "ecommerce_product_variation_options" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" varchar NOT NULL REFERENCES "ecommerce_product_variation_groups"("id") ON DELETE CASCADE,
  "nome" text NOT NULL,
  "descricao" text,
  "preco" integer NOT NULL DEFAULT 0,
  "valor_tecnico" varchar(50),
  "ordem" integer DEFAULT 0,
  "ativo" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 4. Criar índices para otimização
CREATE INDEX IF NOT EXISTS "idx_variation_groups_product" ON "ecommerce_product_variation_groups" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_variation_groups_ordem" ON "ecommerce_product_variation_groups" ("ordem");
CREATE INDEX IF NOT EXISTS "idx_variation_options_group" ON "ecommerce_product_variation_options" ("group_id");
CREATE INDEX IF NOT EXISTS "idx_variation_options_ordem" ON "ecommerce_product_variation_options" ("ordem");

-- 5. Comentários descrevendo as tabelas
COMMENT ON TABLE "ecommerce_product_variation_groups" IS 'Grupos de variação para produtos configuráveis (ex: Internet, Móvel, Extras)';
COMMENT ON TABLE "ecommerce_product_variation_options" IS 'Opções dentro de cada grupo de variação (ex: 700 Mega, 15GB)';
COMMENT ON COLUMN "ecommerce_product_variation_groups"."tipo_selecao" IS 'Tipo de seleção: radio (única escolha) ou checkbox (múltipla escolha)';
COMMENT ON COLUMN "ecommerce_product_variation_options"."preco" IS 'Preço em centavos - pode ser positivo (adiciona) ou negativo (desconto)';
COMMENT ON COLUMN "ecommerce_product_variation_options"."valor_tecnico" IS 'Valor técnico usado para integrações, filtros e regras de negócio';
