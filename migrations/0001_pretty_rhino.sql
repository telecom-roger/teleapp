CREATE TABLE "ecommerce_order_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ecommerce_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"linhas_adicionais" integer DEFAULT 0,
	"preco_unitario" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ecommerce_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"tipo_pessoa" varchar(10) NOT NULL,
	"cpf" varchar(11),
	"cnpj" varchar(14),
	"nome_completo" text,
	"razao_social" text,
	"email" varchar(255) NOT NULL,
	"telefone" varchar(20) NOT NULL,
	"cep" varchar(8),
	"endereco" text,
	"numero" varchar(20),
	"complemento" varchar(100),
	"bairro" varchar(100),
	"cidade" varchar(100),
	"uf" varchar(2),
	"etapa" varchar(100) DEFAULT 'novo_pedido' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"observacoes" text,
	"dados_adicionais" jsonb DEFAULT '{}'::jsonb,
	"termos_aceitos" boolean DEFAULT false,
	"metodo_pagamento" varchar(50),
	"responsavel_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ecommerce_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria" varchar(50) NOT NULL,
	"operadora" varchar(10) NOT NULL,
	"velocidade" varchar(50),
	"franquia" varchar(50),
	"preco" integer NOT NULL,
	"preco_instalacao" integer DEFAULT 0,
	"fidelidade" integer DEFAULT 0,
	"beneficios" text[] DEFAULT ARRAY[]::text[],
	"tipo_pessoa" varchar(10) DEFAULT 'ambos' NOT NULL,
	"ativo" boolean DEFAULT true,
	"destaque" boolean DEFAULT false,
	"ordem" integer DEFAULT 0,
	"sla" text,
	"linhas_inclusas" integer DEFAULT 1,
	"valor_por_linha_adicional" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ecommerce_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"cor" varchar(20) DEFAULT 'slate',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "origin" varchar(20) DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "ecommerce_order_documents" ADD CONSTRAINT "ecommerce_order_documents_order_id_ecommerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."ecommerce_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_documents" ADD CONSTRAINT "ecommerce_order_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD CONSTRAINT "ecommerce_order_items_order_id_ecommerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."ecommerce_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD CONSTRAINT "ecommerce_order_items_product_id_ecommerce_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ecommerce_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD CONSTRAINT "ecommerce_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD CONSTRAINT "ecommerce_orders_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ecommerce_order_documents_order" ON "ecommerce_order_documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_order_items_order" ON "ecommerce_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_order_items_product" ON "ecommerce_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_orders_client" ON "ecommerce_orders" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_orders_etapa" ON "ecommerce_orders" USING btree ("etapa");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_orders_created" ON "ecommerce_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_products_categoria" ON "ecommerce_products" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_products_operadora" ON "ecommerce_products" USING btree ("operadora");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_products_ativo" ON "ecommerce_products" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_stages_ordem" ON "ecommerce_stages" USING btree ("ordem");