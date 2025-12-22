-- Tabela para armazenar a distribuição de DDDs por pedido
CREATE TABLE IF NOT EXISTS "pedido_linha_ddd" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pedido_id" uuid NOT NULL REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE,
  "ddd" varchar(2) NOT NULL,
  "quantidade_linhas" integer NOT NULL CHECK (quantidade_linhas > 0),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "pedido_linha_ddd_pedido_id_idx" ON "pedido_linha_ddd"("pedido_id");
CREATE INDEX IF NOT EXISTS "pedido_linha_ddd_ddd_idx" ON "pedido_linha_ddd"("ddd");

-- Constraint para evitar DDD duplicado no mesmo pedido
CREATE UNIQUE INDEX IF NOT EXISTS "pedido_linha_ddd_unique_ddd_per_order" 
ON "pedido_linha_ddd"("pedido_id", "ddd");
