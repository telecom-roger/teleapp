CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"acao" varchar(50) NOT NULL,
	"entidade" varchar(50) NOT NULL,
	"entidade_id" varchar,
	"dados_antigos" jsonb,
	"dados_novos" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"ativo" boolean DEFAULT true,
	"horarios" text[] DEFAULT ARRAY[]::text[],
	"timeout_2h" boolean DEFAULT true,
	"timeout_4_dias" boolean DEFAULT true,
	"dias_semana" text[] DEFAULT ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta']::text[],
	"mensagens_templates" jsonb DEFAULT '{}'::jsonb,
	"intervalo_scheduler" integer DEFAULT 60,
	"email_notificacoes" boolean DEFAULT true,
	"mensagem_padrao_resposta_ia" text,
	"mensagem_contato_positivo" text,
	"mensagem_proposta_positivo" text,
	"mensagem_fechado" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"opportunity_id" varchar,
	"tipo" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"proxima_execucao" timestamp NOT NULL,
	"dados" jsonb DEFAULT '{}'::jsonb,
	"tentativas" integer DEFAULT 0,
	"ultima_tentativa" timestamp,
	"erro" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"filtros" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_sendings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"campaign_id" varchar,
	"campaign_name" text NOT NULL,
	"client_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'enviado' NOT NULL,
	"erro_mensagem" text,
	"data_sending" timestamp DEFAULT now(),
	"origem_disparo" varchar(30) DEFAULT 'agendamento',
	"mensagem_usada" text,
	"modelo_id" varchar,
	"whatsapp_message_id" varchar(100),
	"status_whatsapp" integer DEFAULT 0,
	"data_entrega" timestamp,
	"data_visualizacao" timestamp,
	"data_primeira_resposta" timestamp,
	"data_ultima_resposta" timestamp,
	"total_respostas" integer DEFAULT 0,
	"ultima_interacao" timestamp,
	"estado_derivado" varchar(50) DEFAULT 'enviado',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"template_id" varchar,
	"status" varchar(20) DEFAULT 'rascunho' NOT NULL,
	"filtros" jsonb DEFAULT '{}'::jsonb,
	"total_recipients" integer DEFAULT 0,
	"total_enviados" integer DEFAULT 0,
	"total_abertos" integer DEFAULT 0,
	"total_cliques" integer DEFAULT 0,
	"total_erros" integer DEFAULT 0,
	"agendada_para" timestamp,
	"tempo_fixo_segundos" integer DEFAULT 70,
	"tempo_aleatorio_min" integer DEFAULT 30,
	"tempo_aleatorio_max" integer DEFAULT 60,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" varchar(20) DEFAULT 'comentario' NOT NULL,
	"data_planejada" timestamp,
	"anexos" jsonb DEFAULT '[]'::jsonb,
	"cor" varchar(20) DEFAULT 'bg-blue-500',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"score_ia" integer DEFAULT 0,
	"score_contato" integer DEFAULT 0,
	"score_engajamento" integer DEFAULT 0,
	"score_potencial" integer DEFAULT 0,
	"score_total" integer DEFAULT 0,
	"ultima_atualizacao" timestamp DEFAULT now(),
	"proxima_atualizacao" timestamp
);
--> statement-breakpoint
CREATE TABLE "client_sharing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"shared_with_user_id" varchar NOT NULL,
	"permissao" varchar(20) DEFAULT 'visualizar' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" varchar(14),
	"status" varchar(50) DEFAULT 'base_frio' NOT NULL,
	"parceiro" varchar(50),
	"tipo_cliente" varchar(100),
	"carteira" varchar(100),
	"celular" varchar(20),
	"telefone_2" varchar(20),
	"email" varchar(255),
	"nome_gestor" varchar(255),
	"email_gestor" varchar(255),
	"cpf_gestor" varchar(11),
	"endereco" text,
	"numero" varchar(20),
	"bairro" varchar(100),
	"cep" varchar(8),
	"cidade" varchar(100),
	"uf" varchar(2),
	"data_ultimo_pedido" varchar(20),
	"observacoes" text,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"valor" text NOT NULL,
	"preferencial" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"last_contacted" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_client_contact" UNIQUE("client_id","tipo","valor")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"canal" varchar(20) DEFAULT 'whatsapp' NOT NULL,
	"assunto" text,
	"ativa" boolean DEFAULT true,
	"oculta" boolean DEFAULT false,
	"nao_lida" boolean DEFAULT false,
	"ultima_mensagem" text,
	"ultima_mensagem_em" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"opcoes" text[],
	"obrigatorio" boolean DEFAULT false,
	"visivel_no_front" boolean DEFAULT true,
	"ordem" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "custom_fields_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"numero" integer NOT NULL,
	"dias_since_last_contact" integer NOT NULL,
	"resultado" varchar(50),
	"executado_em" timestamp,
	"proximo_follow_up_em" timestamp,
	"descricao" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_arquivo" text NOT NULL,
	"status" varchar(20) DEFAULT 'processando' NOT NULL,
	"total_linhas" integer DEFAULT 0,
	"linhas_validas" integer DEFAULT 0,
	"linhas_invalidas" integer DEFAULT 0,
	"duplicados" integer DEFAULT 0,
	"mapeamento" jsonb,
	"erros" jsonb DEFAULT '[]'::jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"origem" varchar(20) DEFAULT 'user' NOT NULL,
	"titulo" text,
	"texto" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender" varchar(20) NOT NULL,
	"tipo" varchar(20) DEFAULT 'texto' NOT NULL,
	"conteudo" text,
	"arquivo" text,
	"nome_arquivo" text,
	"tamanho" integer,
	"mime_type" text,
	"origem" varchar(50),
	"lido" boolean DEFAULT false,
	"deletado" boolean DEFAULT false,
	"status_entrega" varchar(20) DEFAULT 'enviado',
	"whatsapp_message_id" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"client_id" varchar,
	"from_user_id" varchar,
	"lida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"titulo" text NOT NULL,
	"valor_estimado" text,
	"etapa" varchar(100) DEFAULT 'lead' NOT NULL,
	"responsavel_id" varchar,
	"prazo" timestamp,
	"ordem" integer DEFAULT 0,
	"notas" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quick_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"conteudo" text NOT NULL,
	"ordem" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cor" varchar(50) NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"assunto" text,
	"conteudo" text NOT NULL,
	"image_url" text,
	"variaveis" text[] DEFAULT ARRAY[]::text[],
	"ativo" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar(20) DEFAULT 'agent' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'desconectada' NOT NULL,
	"qr_code" text,
	"telefone" varchar(20),
	"ativo" boolean DEFAULT true,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sendings" ADD CONSTRAINT "campaign_sendings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sendings" ADD CONSTRAINT "campaign_sendings_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sendings" ADD CONSTRAINT "campaign_sendings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sendings" ADD CONSTRAINT "campaign_sendings_modelo_id_templates_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_scores" ADD CONSTRAINT "client_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_scores" ADD CONSTRAINT "client_scores_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_sharing" ADD CONSTRAINT "client_sharing_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_sharing" ADD CONSTRAINT "client_sharing_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_sharing" ADD CONSTRAINT "client_sharing_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entidade" ON "audit_logs" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_automation_tasks_user" ON "automation_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_automation_tasks_client" ON "automation_tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_automation_tasks_opportunity" ON "automation_tasks" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_automation_tasks_status" ON "automation_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automation_tasks_proxima" ON "automation_tasks" USING btree ("proxima_execucao");--> statement-breakpoint
CREATE INDEX "idx_campaign_groups_user" ON "campaign_groups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_user" ON "campaign_sendings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_campaign" ON "campaign_sendings" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_client" ON "campaign_sendings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_date" ON "campaign_sendings" USING btree ("data_sending");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_user_client" ON "campaign_sendings" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_origem" ON "campaign_sendings" USING btree ("origem_disparo");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_whatsapp_id" ON "campaign_sendings" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_sendings_estado" ON "campaign_sendings" USING btree ("estado_derivado");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_campaign_sendings_unique_client_campaign" ON "campaign_sendings" USING btree ("campaign_id","client_id");--> statement-breakpoint
CREATE INDEX "idx_client_notes_user" ON "client_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_client_notes_client" ON "client_notes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_notes_user_client" ON "client_notes" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE INDEX "idx_client_scores_user" ON "client_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_client_scores_client" ON "client_scores" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_scores_total" ON "client_scores" USING btree ("score_total");--> statement-breakpoint
CREATE INDEX "idx_client_sharing_client" ON "client_sharing" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_sharing_owner" ON "client_sharing" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_client_sharing_shared_with" ON "client_sharing" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_client" ON "contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_client" ON "conversations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_oculta" ON "conversations" USING btree ("oculta");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_user" ON "follow_ups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_client" ON "follow_ups" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_numero" ON "follow_ups" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_executado" ON "follow_ups" USING btree ("executado_em");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_created_by" ON "import_jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_status" ON "import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_interactions_client" ON "interactions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_created" ON "interactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_kanban_stages_ordem" ON "kanban_stages" USING btree ("ordem");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender");--> statement-breakpoint
CREATE INDEX "idx_messages_whatsapp_id" ON "messages" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_lida" ON "notifications" USING btree ("lida");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_lida" ON "notifications" USING btree ("user_id","lida");--> statement-breakpoint
CREATE INDEX "idx_opportunities_client" ON "opportunities" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_opportunities_etapa" ON "opportunities" USING btree ("etapa");--> statement-breakpoint
CREATE INDEX "idx_opportunities_responsavel" ON "opportunities" USING btree ("responsavel_id");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_user" ON "quick_replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_tags_created_by" ON "tags" USING btree ("created_by");