import type { Express } from "express";
import { z } from "zod";
import { eq, and, or, desc, sql, ilike, asc } from "drizzle-orm";
import {
  ecommerceProducts,
  ecommerceProductCategories,
  ecommerceOrders,
  ecommerceOrderItems,
  ecommerceStages,
  ecommerceOrderDocuments,
  ecommerceOrderRequestedDocuments,
  ecommerceProductVariationGroups,
  ecommerceProductVariationOptions,
  pedidoLinhaDdd,
  clients,
  users,
  interactions,
  insertEcommerceProductSchema,
  insertEcommerceOrderSchema,
  insertEcommerceStageSchema,
} from "@shared/schema";
import { db } from "./db";
import { isAuthenticated } from "./localAuth";
import bcrypt from "bcrypt";
import * as storage from "./storage";
import {
  enviarEmailBoasVindas,
  enviarEmailPedidoRecebido,
  enviarEmailStatusPedido,
  isEmailConfigured,
} from "./emailService.js";

// ==================== HELPER FUNCTIONS ====================

// Validar CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

// Validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

// Gerar senha aleatória
function gerarSenhaAleatoria(tamanho = 8): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

// ==================== PRODUCTS ====================

export function registerEcommerceRoutes(app: Express): void {
  // GET /api/app/products - Listar produtos (público)
  app.get("/api/app/products", async (req, res) => {
    try {
      const { categoria, operadora, tipoPessoa, ativo } = req.query;

      let query = db.select().from(ecommerceProducts).$dynamic();

      const conditions: any[] = [];

      if (categoria)
        conditions.push(eq(ecommerceProducts.categoria, categoria as string));
      if (operadora)
        conditions.push(eq(ecommerceProducts.operadora, operadora as string));
      if (tipoPessoa) {
        conditions.push(
          sql`(${ecommerceProducts.tipoPessoa} = ${tipoPessoa} OR ${ecommerceProducts.tipoPessoa} = 'ambos')`
        );
      }
      if (ativo !== undefined) {
        conditions.push(eq(ecommerceProducts.ativo, ativo === "true"));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const produtos = await query.orderBy(
        ecommerceProducts.destaque
          ? desc(ecommerceProducts.destaque)
          : ecommerceProducts.ordem
      );

      // Buscar categorias para cada produto
      const produtosComCategorias = await Promise.all(
        produtos.map(async (produto) => {
          const categorias = await db
            .select({
              slug: ecommerceProductCategories.categorySlug,
            })
            .from(ecommerceProductCategories)
            .where(eq(ecommerceProductCategories.productId, produto.id));

          return {
            ...produto,
            categorias: categorias.map((c) => c.slug),
          };
        })
      );

      res.json(produtosComCategorias);
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      res.status(500).json({ error: "Erro ao listar produtos" });
    }
  });

  // GET /api/app/products/:id - Detalhes de um produto (público)
  app.get("/api/app/products/:id", async (req, res) => {
    try {
      const [produto] = await db
        .select()
        .from(ecommerceProducts)
        .where(eq(ecommerceProducts.id, req.params.id))
        .limit(1);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Buscar categorias do produto
      const categorias = await db
        .select({
          slug: ecommerceProductCategories.categorySlug,
        })
        .from(ecommerceProductCategories)
        .where(eq(ecommerceProductCategories.productId, produto.id));

      res.json({
        ...produto,
        categorias: categorias.map((c) => c.slug),
      });
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  // POST /api/app/products - Criar produto (admin)
  app.post("/api/app/products", isAuthenticated, async (req, res) => {
    try {
      const { categorias, ...data } = req.body;
      
      console.log("🔍 POST /api/app/products - categorias recebidas:", categorias);
      console.log("🔍 POST /api/app/products - tipo:", typeof categorias, "isArray:", Array.isArray(categorias));
      
      const parsedData = insertEcommerceProductSchema.parse(data);

      const [produto] = await db
        .insert(ecommerceProducts)
        .values(parsedData)
        .returning();

      // Salvar categorias na tabela de relacionamento
      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        console.log("💾 Salvando categorias:", categorias);
        await db.insert(ecommerceProductCategories).values(
          categorias.map((categorySlug: string) => ({
            productId: produto.id,
            categorySlug,
          }))
        );
      }

      res.json(produto);
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      res.status(400).json({ error: error.message || "Erro ao criar produto" });
    }
  });

  // PUT /api/app/products/:id - Atualizar produto (admin)
  app.put("/api/app/products/:id", isAuthenticated, async (req, res) => {
    try {
      const { categorias, ...data } = req.body;
      
      console.log("🔍 PUT /api/app/products/:id - categorias recebidas:", categorias);
      console.log("🔍 PUT /api/app/products/:id - tipo:", typeof categorias, "isArray:", Array.isArray(categorias));
      
      const parsedData = insertEcommerceProductSchema.partial().parse(data);

      const [produto] = await db
        .update(ecommerceProducts)
        .set({ ...parsedData, updatedAt: new Date() })
        .where(eq(ecommerceProducts.id, req.params.id))
        .returning();

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Atualizar categorias: deletar antigas e inserir novas
      if (categorias && Array.isArray(categorias)) {
        console.log("🗑️ Deletando categorias antigas do produto:", req.params.id);
        // Deletar categorias antigas
        await db
          .delete(ecommerceProductCategories)
          .where(eq(ecommerceProductCategories.productId, req.params.id));

        // Inserir novas categorias
        if (categorias.length > 0) {
          console.log("💾 Salvando novas categorias:", categorias);
          await db.insert(ecommerceProductCategories).values(
            categorias.map((categorySlug: string) => ({
              productId: req.params.id,
              categorySlug,
            }))
          );
        }
      }

      res.json(produto);
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      res
        .status(400)
        .json({ error: error.message || "Erro ao atualizar produto" });
    }
  });

  // DELETE /api/app/products/:id - Deletar produto (admin)
  app.delete(
    "/api/app/products/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        await db
          .delete(ecommerceProducts)
          .where(eq(ecommerceProducts.id, req.params.id));

        res.json({ success: true });
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        res.status(500).json({ error: "Erro ao deletar produto" });
      }
    }
  );

  // ==================== STAGES ====================

  // GET /api/app/stages - Listar etapas do Kanban
  app.get("/api/app/stages", isAuthenticated, async (req, res) => {
    try {
      const stages = await db
        .select()
        .from(ecommerceStages)
        .orderBy(ecommerceStages.ordem);

      res.json(stages);
    } catch (error) {
      console.error("Erro ao listar stages:", error);
      res.status(500).json({ error: "Erro ao listar stages" });
    }
  });

  // POST /api/app/stages - Criar etapa (admin)
  app.post("/api/app/stages", isAuthenticated, async (req, res) => {
    try {
      const data = insertEcommerceStageSchema.parse(req.body);

      const [stage] = await db.insert(ecommerceStages).values(data).returning();

      res.json(stage);
    } catch (error: any) {
      console.error("Erro ao criar stage:", error);
      res.status(400).json({ error: error.message || "Erro ao criar stage" });
    }
  });

  // PUT /api/app/stages/:id - Atualizar etapa (admin)
  app.put("/api/app/stages/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertEcommerceStageSchema.partial().parse(req.body);

      const [stage] = await db
        .update(ecommerceStages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ecommerceStages.id, req.params.id))
        .returning();

      if (!stage) {
        return res.status(404).json({ error: "Stage não encontrado" });
      }

      res.json(stage);
    } catch (error: any) {
      console.error("Erro ao atualizar stage:", error);
      res
        .status(400)
        .json({ error: error.message || "Erro ao atualizar stage" });
    }
  });

  // DELETE /api/app/stages/:id - Deletar etapa (admin)
  app.delete("/api/app/stages/:id", isAuthenticated, async (req, res) => {
    try {
      await db
        .delete(ecommerceStages)
        .where(eq(ecommerceStages.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar stage:", error);
      res.status(500).json({ error: "Erro ao deletar stage" });
    }
  });

  // ==================== ORDERS ====================

  // GET /api/app/orders - Listar pedidos (admin)
  app.get("/api/app/orders", isAuthenticated, async (req, res) => {
    try {
      const { etapa, tipoPessoa, limit = "50", offset = "0" } = req.query;

      let query = db
        .select({
          order: ecommerceOrders,
          client: clients,
        })
        .from(ecommerceOrders)
        .leftJoin(clients, eq(ecommerceOrders.clientId, clients.id))
        .$dynamic();

      const conditions: any[] = [];

      if (etapa) conditions.push(eq(ecommerceOrders.etapa, etapa as string));
      if (tipoPessoa)
        conditions.push(eq(ecommerceOrders.tipoPessoa, tipoPessoa as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const orders = await query
        .orderBy(desc(ecommerceOrders.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(orders);
    } catch (error) {
      console.error("Erro ao listar pedidos:", error);
      res.status(500).json({ error: "Erro ao listar pedidos" });
    }
  });

  // GET /api/app/orders/:id - Detalhes de um pedido (admin)
  app.get("/api/app/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const [orderData] = await db
        .select({
          order: ecommerceOrders,
          client: clients,
        })
        .from(ecommerceOrders)
        .leftJoin(clients, eq(ecommerceOrders.clientId, clients.id))
        .where(eq(ecommerceOrders.id, req.params.id))
        .limit(1);

      if (!orderData) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Buscar itens do pedido
      const items = await db
        .select({
          item: ecommerceOrderItems,
          product: ecommerceProducts,
        })
        .from(ecommerceOrderItems)
        .leftJoin(
          ecommerceProducts,
          eq(ecommerceOrderItems.productId, ecommerceProducts.id)
        )
        .where(eq(ecommerceOrderItems.orderId, req.params.id));

      // Buscar documentos
      const documents = await db
        .select()
        .from(ecommerceOrderDocuments)
        .where(eq(ecommerceOrderDocuments.orderId, req.params.id));

      // Buscar DDDs das linhas móveis
      const ddds = await db
        .select()
        .from(pedidoLinhaDdd)
        .where(eq(pedidoLinhaDdd.pedidoId, req.params.id));

      res.json({
        ...orderData,
        items,
        documents,
        ddds,
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      res.status(500).json({ error: "Erro ao buscar pedido" });
    }
  });

  // POST /api/app/check-document - Verificar se CPF/CNPJ já existe (público)
  app.post("/api/app/check-document", async (req, res) => {
    try {
      const { documento, tipoPessoa } = req.body;

      if (!documento || !tipoPessoa) {
        return res.status(400).json({ error: "Documento e tipo de pessoa são obrigatórios" });
      }

      const documentoLimpo = documento.replace(/\D/g, "");

      // Validar CPF/CNPJ
      const isDev = process.env.NODE_ENV === "development";
      
      if (tipoPessoa === "PF" && !isDev && !validarCPF(documentoLimpo)) {
        return res.status(400).json({ error: "CPF inválido", valido: false });
      }

      if (tipoPessoa === "PJ") {
        if (documentoLimpo.length !== 14) {
          return res.status(400).json({ error: "CNPJ deve ter 14 dígitos", valido: false });
        }
        if (!isDev && !validarCNPJ(documentoLimpo)) {
          return res.status(400).json({ error: "CNPJ inválido", valido: false });
        }
      }

      // Verificar se já existe cliente com este documento
      const existingClients = await db
        .select({
          id: clients.id,
          email: clients.email,
          nome: clients.nome,
        })
        .from(clients)
        .where(eq(clients.cnpj, documentoLimpo))
        .limit(1);

      if (existingClients.length > 0) {
        return res.json({
          valido: true,
          existe: true,
          mensagem: "Identificamos que já existe um cadastro com este CPF/CNPJ.",
        });
      }

      res.json({
        valido: true,
        existe: false,
        mensagem: "Documento válido e disponível para cadastro",
      });
    } catch (error: any) {
      console.error("Erro ao verificar documento:", error);
      res.status(500).json({ error: "Erro ao verificar documento" });
    }
  });

  // POST /api/app/check-email - Verificar se e-mail já existe (público)
  app.post("/api/app/check-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "E-mail é obrigatório" });
      }

      // Verificar se já existe cliente com este e-mail
      const existingClients = await db
        .select({
          id: clients.id,
          nome: clients.nome,
        })
        .from(clients)
        .where(eq(clients.email, email))
        .limit(1);

      if (existingClients.length > 0) {
        return res.json({
          existe: true,
          mensagem: "Identificamos que já existe um cadastro com este e-mail.",
        });
      }

      res.json({
        existe: false,
        mensagem: "E-mail disponível para cadastro",
      });
    } catch (error: any) {
      console.error("Erro ao verificar e-mail:", error);
      res.status(500).json({ error: "Erro ao verificar e-mail" });
    }
  });

  // POST /api/app/orders - Criar pedido (público com validações)
  app.post("/api/app/orders", async (req, res) => {
    try {
      const orderData = req.body;
      
      console.log("\n🆕 [CRIAR PEDIDO] Dados recebidos:");
      console.log("   tipoContratacao:", orderData.tipoContratacao);
      console.log("   tipoPessoa:", orderData.tipoPessoa);
      console.log("   items:", orderData.items?.length, "produtos");

      // Validar CPF/CNPJ (mais permissivo em desenvolvimento)
      const isDev = process.env.NODE_ENV === "development";

      if (orderData.tipoPessoa === "PF" && orderData.cpf) {
        if (!isDev && !validarCPF(orderData.cpf)) {
          return res.status(400).json({ error: "CPF inválido" });
        }
      }

      if (orderData.tipoPessoa === "PJ" && orderData.cnpj) {
        // Validar formato básico (14 dígitos)
        const cnpjLimpo = orderData.cnpj.replace(/\D/g, "");
        if (cnpjLimpo.length !== 14) {
          return res.status(400).json({ error: "CNPJ deve ter 14 dígitos" });
        }
        // Validação completa apenas em produção
        if (!isDev && !validarCNPJ(orderData.cnpj)) {
          return res.status(400).json({ error: "CNPJ inválido" });
        }
      }

      // Validar DDDs se houver produtos móveis
      if (orderData.ddds && orderData.ddds.length > 0) {
        const DDDS_VALIDOS = [
          "11", "12", "13", "14", "15", "16", "17", "18", "19", // SP
          "21", "22", "24", // RJ
          "27", "28", // ES
          "31", "32", "33", "34", "35", "37", "38", // MG
          "41", "42", "43", "44", "45", "46", // PR
          "47", "48", "49", // SC
          "51", "53", "54", "55", // RS
          "61", // DF
          "62", "64", // GO
          "63", // TO
          "65", "66", // MT
          "67", // MS
          "68", // AC
          "69", // RO
          "71", "73", "74", "75", "77", // BA
          "79", // SE
          "81", "87", // PE
          "82", // AL
          "83", // PB
          "84", // RN
          "85", "88", // CE
          "86", "89", // PI
          "91", "93", "94", // PA
          "92", "97", // AM
          "95", // RR
          "96", // AP
          "98", "99", // MA
        ];

        // Calcular total de linhas móveis do pedido
        const totalLinhasMoveis = orderData.items?.reduce((acc: number, item: any) => {
          if (item.productCategoria?.toLowerCase() === "movel") {
            return acc + (item.quantidade || 0);
          }
          return acc;
        }, 0) || 0;

        if (totalLinhasMoveis === 0 && orderData.ddds.length > 0) {
          return res.status(400).json({ 
            error: "DDDs fornecidos mas não há produtos móveis no pedido" 
          });
        }

        // Validar cada DDD
        for (const dddItem of orderData.ddds) {
          if (!DDDS_VALIDOS.includes(dddItem.ddd)) {
            return res.status(400).json({ 
              error: `DDD ${dddItem.ddd} inválido` 
            });
          }
          
          if (dddItem.quantidade < 1) {
            return res.status(400).json({ 
              error: `Quantidade de linhas para DDD ${dddItem.ddd} deve ser maior que 0` 
            });
          }
        }

        // Verificar se não há DDDs duplicados
        const ddds = orderData.ddds.map((d: any) => d.ddd);
        if (new Set(ddds).size !== ddds.length) {
          return res.status(400).json({ 
            error: "DDDs duplicados na distribuição" 
          });
        }

        // Verificar se a soma das quantidades é igual ao total de linhas
        const somaQuantidades = orderData.ddds.reduce((acc: number, d: any) => acc + d.quantidade, 0);
        if (somaQuantidades !== totalLinhasMoveis) {
          return res.status(400).json({ 
            error: `Distribuição de DDDs (${somaQuantidades}) não corresponde ao total de linhas móveis (${totalLinhasMoveis})` 
          });
        }

        console.log("\n✅ [VALIDAÇÃO DDDs]");
        console.log("   Total linhas móveis:", totalLinhasMoveis);
        console.log("   DDDs fornecidos:", orderData.ddds.length);
        console.log("   Distribuição válida");
      }


      // Verificar se cliente já existe
      let clientId: string;
      let isNovoCliente = false;
      let senhaTemporaria = "";
      const documento =
        orderData.tipoPessoa === "PF" ? orderData.cpf : orderData.cnpj;
      const emailCliente = orderData.email;

      // Verificar se já existe cliente com este documento ou email
      const existingClients = await db
        .select()
        .from(clients)
        .where(
          documento 
            ? or(
                eq(clients.cnpj, documento),
                eq(clients.email, emailCliente)
              )
            : eq(clients.email, emailCliente)
        )
        .limit(1);

      if (existingClients.length > 0) {
        // Cliente já existe - vincular e atualizar origin para "both"
        clientId = existingClients[0].id;

        // Atualizar origin para "both" se ainda não for
        if (existingClients[0].origin === "system") {
          await db
            .update(clients)
            .set({ origin: "both" })
            .where(eq(clients.id, clientId));
        }
      } else {
        // Verificar se já existe usuário com este email (cliente deletado anteriormente)
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, emailCliente))
          .limit(1);

        // Buscar o admin principal (roger.mmoraes.ti@gmail.com) para associar como criador do cliente
        const [adminUser] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, "admin"),
              eq(users.email, "roger.mmoraes.ti@gmail.com")
            )
          )
          .limit(1);

        // Se não encontrar o admin específico, buscar qualquer admin
        const adminId = adminUser?.id || (await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1)
          .then(result => result[0]?.id));

        // Criar novo cliente
        isNovoCliente = true;
        const [novoCliente] = await db
          .insert(clients)
          .values({
            nome:
              orderData.tipoPessoa === "PF"
                ? orderData.nomeCompleto
                : orderData.razaoSocial,
            cnpj: orderData.tipoPessoa === "PJ" ? (orderData.cnpj || null) : (orderData.cpf || null),
            email: orderData.email,
            celular: orderData.telefone,
            endereco: orderData.endereco,
            numero: orderData.numero,
            bairro: orderData.bairro,
            cep: orderData.cep,
            cidade: orderData.cidade,
            uf: orderData.uf,
            origin: "ecommerce",
            type: orderData.tipoPessoa, // PF ou PJ
            tipoCliente: orderData.tipoPessoa,
            carteira: "ECOMMERCE", // Clientes do ecommerce vão para carteira ECOMMERCE
            status: "ativo", // Cliente do ecommerce já entra como ATIVO
            createdBy: adminId || null, // Associar ao admin principal
          })
          .returning();

        clientId = novoCliente.id;

        if (existingUser) {
          // Reutilizar usuário existente - apenas vincular ao novo cliente
          console.log(`\n🔄 REATIVANDO USUÁRIO EXISTENTE`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`Email: ${emailCliente}`);
          console.log(`Cliente ID: ${clientId}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

          await db
            .update(users)
            .set({
              clientId: clientId,
              active: true,
              role: "customer",
            })
            .where(eq(users.id, existingUser.id));
        } else {
          // Criar usuário com senha temporária
          senhaTemporaria = gerarSenhaAleatoria();
          const passwordHash = await bcrypt.hash(senhaTemporaria, 10);

          const loginEmail = orderData.email;

          await db.insert(users).values({
            email: loginEmail,
            passwordHash,
            firstName:
              orderData.tipoPessoa === "PF"
                ? orderData.nomeCompleto?.split(" ")[0]
                : orderData.razaoSocial,
            lastName:
              orderData.tipoPessoa === "PF"
                ? orderData.nomeCompleto?.split(" ").slice(1).join(" ")
                : "",
            role: "customer",
            clientId: clientId,
            active: true,
          });

          // Enviar email com credenciais (se SMTP configurado)
          if (isEmailConfigured()) {
            enviarEmailBoasVindas({
              nome:
                orderData.tipoPessoa === "PF"
                  ? orderData.nomeCompleto
                  : orderData.razaoSocial,
              email: loginEmail,
              username: loginEmail,
              senha: senhaTemporaria,
            }).catch((err: unknown) =>
              console.error("Erro ao enviar email de boas-vindas:", err)
            );
          }

          console.log(`\n🔑 NOVO USUÁRIO CRIADO`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`Email: ${loginEmail}`);
          console.log(`Senha: ${senhaTemporaria}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        }
      }

      // Gerar código único do pedido
      const orderCode = Math.floor(10000000 + Math.random() * 89999999).toString();

      // Determinar etapa inicial baseado no tipo de contratação
      let etapaInicial = "novo_pedido";
      
      // Se for portabilidade e tiver produtos (excluindo SVAs), vai para aguardando_dados_linhas
      if (orderData.tipoContratacao === "portabilidade" && orderData.items && orderData.items.length > 0) {
        const temProdutosSemSVA = orderData.items.some((item: any) => {
          const categoria = item.productCategoria?.toLowerCase() || "";
          return !categoria.includes("sva");
        });
        
        if (temProdutosSemSVA) {
          etapaInicial = "aguardando_dados_linhas";
        }
      }

      // Criar pedido
      const [order] = await db
        .insert(ecommerceOrders)
        .values({
          ...orderData,
          clientId,
          orderCode,
          etapa: etapaInicial,
        })
        .returning();
      
      console.log("\n✅ [PEDIDO CRIADO]");
      console.log("   Order Code:", orderCode);
      console.log("   tipoContratacao salvo:", order.tipoContratacao);
      console.log("   Etapa:", order.etapa);

      // Criar itens do pedido
      if (orderData.items && orderData.items.length > 0) {
        await db.insert(ecommerceOrderItems).values(
          orderData.items.map((item: any) => ({
            orderId: order.id,
            productId: item.productId,
            // Snapshot dos dados do produto no momento do pedido
            productNome: item.productNome,
            productDescricao: item.productDescricao,
            productCategoria: item.productCategoria,
            productOperadora: item.productOperadora,
            quantidade: item.quantidade || 1,
            linhasAdicionais: item.linhasAdicionais || 0,
            precoUnitario: item.precoUnitario,
            valorPorLinhaAdicional: item.valorPorLinhaAdicional || 0,
            subtotal: item.subtotal,
          }))
        );

        // Persistir distribuição de DDDs se fornecida
        if (orderData.ddds && orderData.ddds.length > 0) {
          await db.insert(pedidoLinhaDdd).values(
            orderData.ddds.map((dddItem: any) => ({
              pedidoId: order.id,
              ddd: dddItem.ddd,
              quantidadeLinhas: dddItem.quantidade,
            }))
          );
          
          console.log("\n✅ [DDDs PERSISTIDOS]");
          console.log("   Pedido ID:", order.id);
          console.log("   DDDs salvos:", orderData.ddds.length);
          orderData.ddds.forEach((d: any) => {
            console.log(`   - DDD ${d.ddd}: ${d.quantidade} linha(s)`);
          });
        }

        // Popular documentos solicitados baseado no tipo de pessoa
        const documentosSolicitados = [];
        
        if (orderData.tipoPessoa === "PF") {
          documentosSolicitados.push(
            {
              orderId: order.id,
              tipo: "CNH ou CPF/RG",
              nome: "CNH ou CPF/RG",
              obrigatorio: true,
              status: "pendente"
            },
            {
              orderId: order.id,
              tipo: "Comprovante de Endereço",
              nome: "Comprovante de Endereço",
              obrigatorio: true,
              status: "pendente"
            }
          );
        } else if (orderData.tipoPessoa === "PJ") {
          documentosSolicitados.push(
            {
              orderId: order.id,
              tipo: "CNH ou CPF/RG do Responsável",
              nome: "CNH ou CPF/RG do Responsável",
              obrigatorio: true,
              status: "pendente"
            },
            {
              orderId: order.id,
              tipo: "Contrato Social",
              nome: "Contrato Social",
              obrigatorio: true,
              status: "pendente"
            }
          );
        }

        if (documentosSolicitados.length > 0) {
          await db.insert(ecommerceOrderRequestedDocuments).values(documentosSolicitados);
        }

        // Notificar admins sobre novo pedido
        const { notifyNewOrder } = await import("./notificationService");
        await notifyNewOrder(
          order.id,
          orderData.tipoPessoa === "PF"
            ? orderData.nomeCompleto
            : orderData.razaoSocial,
          order.total
        ).catch((err: unknown) =>
          console.error("Erro ao notificar admins:", err)
        );

        // Enviar email de confirmação de pedido (se SMTP configurado)
        if (isEmailConfigured()) {
          enviarEmailPedidoRecebido({
            nome:
              orderData.tipoPessoa === "PF"
                ? orderData.nomeCompleto
                : orderData.razaoSocial,
            email: orderData.email,
            pedidoId: order.id,
            produtos: orderData.items.map((item: any) => ({
              nome: item.productNome || "Produto",
              quantidade: item.quantidade || 1,
            })),
            senhaAcesso: isNovoCliente ? senhaTemporaria : undefined,
          }).catch((err: unknown) =>
            console.error("Erro ao enviar email de pedido:", err)
          );
        }
      }
      // Registrar na timeline do cliente
      try {
        const nomeCliente =
          orderData.tipoPessoa === "PF"
            ? orderData.nomeCompleto
            : orderData.razaoSocial;
        const isFirstOrder = isNovoCliente;

        await db.insert(interactions).values({
          clientId,
          tipo: isFirstOrder
            ? "ecommerce_primeiro_pedido"
            : "ecommerce_pedido_criado",
          origem: "system",
          titulo: isFirstOrder
            ? `🎉 Primeiro Pedido Ecommerce - #${order.orderCode}`
            : `🛒 Novo Pedido Ecommerce - #${order.orderCode}`,
          texto: `Cliente ${nomeCliente} realizou ${
            isFirstOrder ? "seu primeiro pedido" : "um novo pedido"
          } no valor de R$ ${order.total.toFixed(2)}`,
          meta: {
            orderId: order.id,
            orderCode: order.orderCode,
            total: order.total,
            tipoPessoa: orderData.tipoPessoa,
            itensCount: orderData.items?.length || 0,
          },
          createdBy: null,
        });
        console.log(
          `✅ [TIMELINE] Pedido #${order.orderCode} registrado na timeline do cliente ${clientId}`
        );
      } catch (timelineError) {
        console.error(
          "❌ Erro ao registrar pedido na timeline:",
          timelineError
        );
        // Não falhar a requisição por erro na timeline
      }
      res.json({
        success: true,
        orderId: order.id,
        orderCode: order.orderCode,
        clientId,
      });
    } catch (error: any) {
      console.error("Erro ao criar pedido:", error);
      res.status(500).json({ error: error.message || "Erro ao criar pedido" });
    }
  });

  // PUT /api/app/orders/:id - Atualizar pedido (admin)
  app.put("/api/app/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const data = req.body;

      const [order] = await db
        .update(ecommerceOrders)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ecommerceOrders.id, req.params.id))
        .returning();

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      res.json(order);
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      res
        .status(400)
        .json({ error: error.message || "Erro ao atualizar pedido" });
    }
  });

  // Atualizar status do pedido (com envio de email)
  app.put(
    "/api/app/orders/:id/status",
    isAuthenticated,
    async (req, res) => {
      try {
        const { status, motivoAlteracao } = req.body;

        const updateData: any = { 
          etapa: status, 
          updatedAt: new Date() 
        };
        
        // Se houver motivo de alteração, salvar
        if (motivoAlteracao !== undefined) {
          updateData.motivoAlteracao = motivoAlteracao;
        }

        const [order] = await db
          .update(ecommerceOrders)
          .set(updateData)
          .where(eq(ecommerceOrders.id, req.params.id))
          .returning();

        if (!order) {
          return res.status(404).json({ error: "Pedido não encontrado" });
        }

        // Enviar email de atualização de status (se SMTP configurado)
        if (isEmailConfigured() && order.email) {
          enviarEmailStatusPedido({
            nome: order.nomeCompleto || order.razaoSocial || "Cliente",
            email: order.email,
            pedidoId: parseInt(order.id),
            novoStatus: status,
          }).catch((err: unknown) =>
            console.error("Erro ao enviar email de status:", err)
          );
        }

        res.json(order);
      } catch (error: any) {
        console.error("Erro ao atualizar status:", error);
        res
          .status(400)
          .json({ error: error.message || "Erro ao atualizar status" });
      }
    }
  );

  // DELETE /api/app/orders/:id - Deletar pedido (admin)
  app.delete("/api/app/orders/:id", isAuthenticated, async (req, res) => {
    try {
      await db
        .delete(ecommerceOrders)
        .where(eq(ecommerceOrders.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
      res.status(500).json({ error: "Erro ao deletar pedido" });
    }
  });

  // ==================== SETUP E-COMMERCE (TEMPORÁRIO) ====================

  app.post("/api/app/setup", isAuthenticated, async (req, res) => {
    try {
      console.log("🔧 Executando setup e-commerce...");

      // Adicionar coluna origin
      try {
        await db.execute(
          sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'system'`
        );
        await db.execute(
          sql`UPDATE clients SET origin = 'system' WHERE origin IS NULL`
        );
        console.log("✅ Coluna origin adicionada");
      } catch (e) {
        console.log("ℹ️ Coluna origin já existe");
      }

      // Verificar produtos existentes
      const existing = await db.select().from(ecommerceProducts);

      if (existing.length === 0) {
        console.log("📝 Inserindo produtos de exemplo...");
        await db.insert(ecommerceProducts).values([
          {
            nome: "Fibra 500MB + TV",
            descricao: "Internet de 500 Mbps + TV com 100 canais",
            categoria: "combo",
            operadora: "V",
            velocidade: "500 Mbps",
            preco: 12900,
            tipoPessoa: "PF",
            ativo: true,
          },
          {
            nome: "Fibra 300MB Residencial",
            descricao: "Internet Fibra Óptica 300 Mbps",
            categoria: "fibra",
            operadora: "V",
            velocidade: "300 Mbps",
            preco: 8900,
            tipoPessoa: "PF",
            ativo: true,
          },
          {
            nome: "Fibra 600MB Empresarial",
            descricao: "Internet Fibra Óptica 600 Mbps para empresas",
            categoria: "fibra",
            operadora: "C",
            velocidade: "600 Mbps",
            preco: 24900,
            tipoPessoa: "PJ",
            ativo: true,
          },
          {
            nome: "Móvel 20GB",
            descricao: "Plano móvel com 20GB de internet",
            categoria: "movel",
            operadora: "T",
            velocidade: "4G/5G",
            preco: 4990,
            tipoPessoa: "PF",
            ativo: true,
          },
          {
            nome: "Office 365 Business",
            descricao: "Pacote Office completo na nuvem",
            categoria: "office",
            operadora: "C",
            velocidade: "Cloud",
            preco: 5900,
            tipoPessoa: "PJ",
            ativo: true,
          },
        ]);
      }

      const produtos = await db.select().from(ecommerceProducts);
      res.json({
        success: true,
        message: "Setup concluído com sucesso",
        produtosCount: produtos.length,
        produtos: produtos.map((p) => ({
          id: p.id,
          nome: p.nome,
          preco: p.preco / 100,
        })),
      });
    } catch (error: any) {
      console.error("❌ Erro no setup:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== UPLOAD DE DOCUMENTOS ====================

  // POST /api/app/orders/:id/documents - Upload de documento
  app.post("/api/app/orders/:id/documents", async (req, res) => {
    try {
      // TODO: Implementar upload real de arquivos
      // Por enquanto, simulação
      const { tipo, fileName, fileData } = req.body;

      if (!tipo || !fileName || !fileData) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Salvar no storage (simulado)
      const filePath = `/uploads/orders/${
        req.params.id
      }/${Date.now()}_${fileName}`;

      const [document] = await db
        .insert(ecommerceOrderDocuments)
        .values({
          orderId: req.params.id,
          tipo,
          fileName,
          filePath,
          fileSize: fileData.length,
          mimeType: "application/octet-stream",
        })
        .returning();

      res.json(document);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      res.status(500).json({ error: "Erro ao fazer upload" });
    }
  });

  // ==================== CEP ====================

  // GET /api/cep/:cep - Buscar endereço por CEP (ViaCEP)
  app.get("/api/cep/:cep", async (req, res) => {
    try {
      const cep = req.params.cep.replace(/\D/g, "");

      if (cep.length !== 8) {
        return res.status(400).json({ error: "CEP inválido" });
      }

      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        return res.status(404).json({ error: "CEP não encontrado" });
      }

      res.json({
        cep: data.cep,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      res.status(500).json({ error: "Erro ao buscar CEP" });
    }
  });

  // ==================== MARCAR PEDIDOS COMO VISUALIZADOS ====================

  // POST /api/app/customer/orders/:orderId/mark-viewed - Marcar pedido específico como visualizado (cliente)
  app.post(
    "/api/app/customer/orders/:orderId/mark-viewed",
    isAuthenticated,
    async (req, res) => {
      try {
        const user = req.user as any;
        const { orderId } = req.params;

        // Verifica se o pedido pertence ao cliente
        const [order] = await db
          .select()
          .from(ecommerceOrders)
          .where(
            and(
              eq(ecommerceOrders.id, orderId),
              eq(ecommerceOrders.clientId, user.clientId)
            )
          )
          .limit(1);

        if (!order) {
          return res.status(404).json({ error: "Pedido não encontrado" });
        }

        // Atualiza o pedido como visualizado
        await db
          .update(ecommerceOrders)
          .set({ lastViewedAt: new Date() })
          .where(eq(ecommerceOrders.id, orderId));

        res.json({ success: true });
      } catch (error: any) {
        console.error("Erro ao marcar pedido como visualizado:", error);
        res.status(500).json({ error: "Erro ao marcar como visualizado" });
      }
    }
  );

  // POST /api/app/customer/orders/mark-all-viewed - Marcar todos os pedidos como visualizados (cliente)
  app.post(
    "/api/app/customer/orders/mark-all-viewed",
    isAuthenticated,
    async (req, res) => {
      try {
        const user = req.user as any;

        // Atualiza todos os pedidos do cliente
        await db
          .update(ecommerceOrders)
          .set({ lastViewedAt: new Date() })
          .where(eq(ecommerceOrders.clientId, user.clientId));

        res.json({ success: true });
      } catch (error: any) {
        console.error("Erro ao marcar todos como visualizados:", error);
        res.status(500).json({ error: "Erro ao marcar como visualizado" });
      }
    }
  );

  // GET /api/app/products/:productId/variations - Buscar variações de um produto (público)
  app.get("/api/app/products/:productId/variations", async (req, res) => {
    try {
      const { productId } = req.params;

      // Buscar grupos de variação
      const groups = await db
        .select()
        .from(ecommerceProductVariationGroups)
        .where(
          and(
            eq(ecommerceProductVariationGroups.productId, productId),
            eq(ecommerceProductVariationGroups.ativo, true)
          )
        )
        .orderBy(asc(ecommerceProductVariationGroups.ordem));

      // Para cada grupo, buscar suas opções ativas
      const groupsWithOptions = await Promise.all(
        groups.map(async (group) => {
          const options = await db
            .select()
            .from(ecommerceProductVariationOptions)
            .where(
              and(
                eq(ecommerceProductVariationOptions.groupId, group.id),
                eq(ecommerceProductVariationOptions.ativo, true)
              )
            )
            .orderBy(asc(ecommerceProductVariationOptions.ordem));

          return {
            ...group,
            options,
          };
        })
      );

      res.json(groupsWithOptions);
    } catch (error: any) {
      console.error("Erro ao buscar variações do produto:", error);
      res.status(500).json({ error: "Erro ao buscar variações do produto" });
    }
  });
}
