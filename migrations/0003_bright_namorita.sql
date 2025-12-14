CREATE TABLE "ecommerce_banners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"subtitulo" text,
	"imagem_url" text NOT NULL,
	"imagem_mobile_url" text,
	"pagina" varchar(50) NOT NULL,
	"posicao" varchar(50) DEFAULT 'topo',
	"link_destino" text,
	"link_texto" varchar(100),
	"ordem" integer DEFAULT 0,
	"ativo" boolean DEFAULT true,
	"data_inicio" timestamp,
	"data_fim" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "diferenciais" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "permite_calculadora_linhas" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "textos_upsell" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "ecommerce_products" ADD COLUMN "svas_upsell" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
CREATE INDEX "idx_ecommerce_banners_pagina" ON "ecommerce_banners" USING btree ("pagina");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_banners_ativo" ON "ecommerce_banners" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "idx_ecommerce_banners_ordem" ON "ecommerce_banners" USING btree ("ordem");