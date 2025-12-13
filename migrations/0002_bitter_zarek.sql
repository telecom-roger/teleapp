CREATE TABLE "ecommerce_adicionais" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"tipo" varchar(50) NOT NULL,
	"preco" integer NOT NULL,
	"tipo_cobranca" varchar(20) DEFAULT 'mensal',
	"gb_extra" integer DEFAULT 0,
	"categoria" varchar(50),
	"operadora" varchar(10),
	"tipo_pessoa" varchar(10) DEFAULT 'ambos',
	"ativo" boolean DEFAULT true,
	"ordem" integer DEFAULT 0,
	"icone" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ecommerce_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"descricao" text,
	"icone" varchar(50),
	"cor" varchar(20) DEFAULT 'blue',
	"ativo" boolean DEFAULT true,
	"ordem" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ecommerce_categories_nome_unique" UNIQUE("nome"),
	CONSTRAINT "ecommerce_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_product_adicionais" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"adicional_id" varchar NOT NULL,
	"recomendado" boolean DEFAULT false,
	"ordem" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "type" varchar(2);--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD COLUMN "product_nome" varchar(255);--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD COLUMN "product_descricao" text;--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD COLUMN "product_categoria" varchar(100);--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD COLUMN "product_operadora" varchar(100);--> statement-breakpoint
ALTER TABLE "ecommerce_order_items" ADD COLUMN "valor_por_linha_adicional" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD COLUMN "taxa_instalacao" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD COLUMN "economia" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD COLUMN "last_viewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD COLUMN "last_viewed_by_admin_at" timestamp;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "modalidade" varchar(20) DEFAULT 'ambos';--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "uso_recomendado" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "limite_dispositivos_min" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "limite_dispositivos_max" integer DEFAULT 999;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "badge_texto" text;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "texto_decisao" text;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "score_base" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "client_id" varchar;--> statement-breakpoint
ALTER TABLE "ecommerce_product_adicionais" ADD CONSTRAINT "ecommerce_product_adicionais_product_id_ecommerce_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ecommerce_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_adicionais" ADD CONSTRAINT "ecommerce_product_adicionais_adicional_id_ecommerce_adicionais_id_fk" FOREIGN KEY ("adicional_id") REFERENCES "public"."ecommerce_adicionais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ecommerce_adicionais_tipo" ON "ecommerce_adicionais" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_adicionais_categoria" ON "ecommerce_adicionais" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_adicionais_ativo" ON "ecommerce_adicionais" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_categories_ativo" ON "ecommerce_categories" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_categories_ordem" ON "ecommerce_categories" USING btree ("ordem");--> statement-breakpoint
CREATE INDEX "idx_product_adicionais_product" ON "ecommerce_product_adicionais" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_adicionais_adicional" ON "ecommerce_product_adicionais" USING btree ("adicional_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ecommerce_products_tipo_pessoa" ON "ecommerce_products" USING btree ("tipo_pessoa");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_products_modalidade" ON "ecommerce_products" USING btree ("modalidade");