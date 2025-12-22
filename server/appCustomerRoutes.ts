import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { clients, ecommerceOrders, ecommerceOrderItems, ecommerceProducts, ecommerceOrderDocuments, ecommerceOrderRequestedDocuments, interactions } from "@shared/schema";
import { eq, and, desc, sql, isNull, or } from "drizzle-orm";
import { requireRole } from "./middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configurar multer para upload de documentos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "documents");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Apenas arquivos JPG, PNG e PDF são permitidos"));
  },
});

/**
 * GET /api/app/customer/orders
 * Lista todos os pedidos do cliente logado
 */
router.get("/orders", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const orders = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.clientId, user.clientId))
      .orderBy(desc(ecommerceOrders.createdAt));

    // Para cada pedido, buscar os itens e detectar se é portabilidade
    const { ecommerceOrderLines } = await import("@shared/schema");
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(ecommerceOrderItems)
          .where(eq(ecommerceOrderItems.orderId, order.id));

        // Verificar se tem linhas de portabilidade cadastradas
        const linhasPortabilidade = await db
          .select()
          .from(ecommerceOrderLines)
          .where(eq(ecommerceOrderLines.orderId, order.id))
          .limit(1);
        
        // Se foi criado como portabilidade OU tem linhas, mantém como portabilidade
        const isPortabilidade = order.tipoContratacao === "portabilidade" || linhasPortabilidade.length > 0;

        return {
          ...order,
          tipoContratacao: isPortabilidade ? "portabilidade" : (order.tipoContratacao || "linha_nova"),
          items,
        };
      })
    );

    res.json({ orders: ordersWithItems, count: ordersWithItems.length });
  } catch (error: any) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

/**
 * GET /api/app/customer/orders/:orderId
 * Detalhes de um pedido específico (busca por ID ou orderCode)
 */
router.get("/orders/:orderId", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { orderId } = req.params;

    // Tentar buscar por ID ou orderCode
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(
        and(
          or(
            eq(ecommerceOrders.id, orderId),
            eq(ecommerceOrders.orderCode, orderId)
          ),
          eq(ecommerceOrders.clientId, user.clientId)
        )
      )
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Buscar itens
    const items = await db
      .select()
      .from(ecommerceOrderItems)
      .where(eq(ecommerceOrderItems.orderId, order.id));

    // Buscar documentos
    const documents = await db
      .select()
      .from(ecommerceOrderDocuments)
      .where(eq(ecommerceOrderDocuments.orderId, order.id));

    // Buscar DDDs das linhas móveis
    const { pedidoLinhaDdd } = await import("@shared/schema");
    const ddds = await db
      .select()
      .from(pedidoLinhaDdd)
      .where(eq(pedidoLinhaDdd.pedidoId, order.id));

    res.json({
      ...order,
      items,
      documents,
      ddds,
    });
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

/**
 * GET /api/app/customer/profile
 * Dados do perfil do cliente
 */
router.get("/profile", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, user.clientId))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(client);
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});

/**
 * PUT /api/app/customer/profile
 * Atualizar dados do perfil (endereço fica pendente)
 */
router.put("/profile", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { email, celular, telefone2, observacoes } = req.body;

    await db
      .update(clients)
      .set({
        email,
        celular,
        telefone2,
        observacoes,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, user.clientId));

    res.json({ success: true, message: "Perfil atualizado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

/**
 * POST /api/app/customer/address-change-request
 * Solicitar mudança de endereço (fica pendente aprovação)
 */
router.post("/address-change-request", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { endereco, numero, complemento, bairro, cidade, uf, cep } = req.body;

    // TODO: Criar tabela de solicitações de mudança
    // Por enquanto, apenas adiciona nas observações
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, user.clientId))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const requestNote = `\n[SOLICITAÇÃO DE MUDANÇA DE ENDEREÇO - ${new Date().toLocaleString("pt-BR")}]\nNovo endereço: ${endereco}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP: ${cep}\nStatus: PENDENTE APROVAÇÃO`;

    await db
      .update(clients)
      .set({
        observacoes: (client.observacoes || "") + requestNote,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, user.clientId));

    res.json({ 
      success: true, 
      message: "Solicitação de mudança de endereço enviada. Aguarde aprovação da equipe." 
    });
  } catch (error: any) {
    console.error("Erro ao solicitar mudança:", error);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

/**
 * POST /api/app/customer/documents/upload
 * Upload de documentos para um pedido
 */
router.post(
  "/documents/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { orderId, tipo } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Arquivo não enviado" });
      }

      if (!orderId || !tipo) {
        return res.status(400).json({ error: "orderId e tipo são obrigatórios" });
      }

      // Verificar se o pedido existe (permite upload sem autenticação para checkout)
      const [order] = await db
        .select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.id, orderId))
        .limit(1);

      if (!order) {
        // Remover arquivo se pedido não encontrado
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Salvar documento no banco
      await db.insert(ecommerceOrderDocuments).values({
        orderId,
        tipo,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: user?.id || null,
      });

      // Atualizar status do documento solicitado para "enviado"
      await db
        .update(ecommerceOrderRequestedDocuments)
        .set({ 
          status: "enviado",
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.orderId, orderId),
            eq(ecommerceOrderRequestedDocuments.tipo, tipo)
          )
        );

      // Verificar se todos os documentos obrigatórios foram enviados
      const allRequestedDocs = await db
        .select()
        .from(ecommerceOrderRequestedDocuments)
        .where(eq(ecommerceOrderRequestedDocuments.orderId, orderId));

      const obrigatorios = allRequestedDocs.filter(d => d.obrigatorio);
      const todosEnviados = obrigatorios.every(d => d.status === "enviado" || d.status === "aprovado");

      // Registrar na timeline do cliente
      if (order.clientId) {
        try {
          await db.insert(interactions).values({
            clientId: order.clientId,
            tipo: "documento_enviado",
            origem: "system",
            titulo: `Documento enviado: ${tipo}`,
            texto: `Cliente enviou o documento "${tipo}"`,
            meta: {
              orderId: order.id,
              orderCode: order.orderCode,
              tipo,
              anexo: {
                fileName: file.originalname,
                fileSize: file.size,
                downloadUrl: `/api/app/customer/documents/download/${encodeURIComponent(path.basename(file.path))}`,
              },
            },
            createdBy: user?.id || null,
          });
          console.log(`✅ [TIMELINE] Documento ${tipo} registrado para cliente ${order.clientId}`);
        } catch (timelineError) {
          console.error("❌ Erro ao registrar documento na timeline:", timelineError);
        }
      }

      // Se todos os obrigatórios foram enviados, muda automaticamente para validando_documentos
      if (todosEnviados && obrigatorios.length > 0 && order.etapa === "aguardando_documentos") {
        await db
          .update(ecommerceOrders)
          .set({
            etapa: "validando_documentos",
            updatedAt: new Date()
          })
          .where(eq(ecommerceOrders.id, orderId));

        console.log(`✅ Pedido ${order.orderCode} movido automaticamente para validando_documentos`);
      }

      res.json({
        success: true,
        message: "Documento enviado com sucesso",
        file: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      res.status(500).json({ error: "Erro ao enviar documento" });
    }
  }
);

/**
 * GET /api/app/customer/documents/:orderId
 * Lista documentos de um pedido
 */
router.get("/documents/:orderId", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { orderId } = req.params;

    // Verificar se o pedido pertence ao cliente
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(and(eq(ecommerceOrders.id, orderId), eq(ecommerceOrders.clientId, user.clientId)))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const documents = await db
      .select()
      .from(ecommerceOrderDocuments)
      .where(eq(ecommerceOrderDocuments.orderId, orderId));

    res.json(documents);
  } catch (error: any) {
    console.error("Erro ao buscar documentos:", error);
    res.status(500).json({ error: "Erro ao buscar documentos" });
  }
});

/**
 * GET /api/app/customer/orders/:orderId/requested-documents
 * Lista documentos solicitados para o pedido (busca por ID ou orderCode)
 */
router.get("/orders/:orderId/requested-documents", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { orderId } = req.params;

    // Buscar pedido (por ID ou orderCode)
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(
        and(
          or(
            eq(ecommerceOrders.id, orderId),
            eq(ecommerceOrders.orderCode, orderId)
          ),
          eq(ecommerceOrders.clientId, user.clientId)
        )
      )
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Buscar documentos solicitados
    const requestedDocs = await db
      .select()
      .from(ecommerceOrderRequestedDocuments)
      .where(eq(ecommerceOrderRequestedDocuments.orderId, order.id))
      .orderBy(desc(ecommerceOrderRequestedDocuments.createdAt));

    // Para cada documento solicitado, buscar os uploads correspondentes
    const docsWithUploads = await Promise.all(
      requestedDocs.map(async (doc) => {
        const uploads = await db
          .select()
          .from(ecommerceOrderDocuments)
          .where(
            and(
              eq(ecommerceOrderDocuments.orderId, order.id),
              eq(ecommerceOrderDocuments.tipo, doc.tipo)
            )
          );

        return {
          ...doc,
          hasUpload: uploads.length > 0,
          uploads: uploads,
        };
      })
    );

    res.json(docsWithUploads);
  } catch (error: any) {
    console.error("Erro ao buscar documentos solicitados:", error);
    res.status(500).json({ error: "Erro ao buscar documentos solicitados" });
  }
});

/**
 * DELETE /api/app/customer/documents/:documentId
 * Remover documento enviado (apenas se ainda não foi aprovado)
 */
router.delete("/documents/:documentId", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { documentId } = req.params;

    // Buscar o documento
    const [document] = await db
      .select()
      .from(ecommerceOrderDocuments)
      .where(eq(ecommerceOrderDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    // Verificar se o pedido pertence ao cliente
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(
        and(
          eq(ecommerceOrders.id, document.orderId),
          eq(ecommerceOrders.clientId, user.clientId)
        )
      )
      .limit(1);

    if (!order) {
      return res.status(403).json({ error: "Você não tem permissão para remover este documento" });
    }

    // Verificar se o documento solicitado não está aprovado
    const [requestedDoc] = await db
      .select()
      .from(ecommerceOrderRequestedDocuments)
      .where(
        and(
          eq(ecommerceOrderRequestedDocuments.orderId, document.orderId),
          eq(ecommerceOrderRequestedDocuments.tipo, document.tipo)
        )
      )
      .limit(1);

    if (requestedDoc && requestedDoc.status === "aprovado") {
      return res.status(400).json({ error: "Documento aprovado não pode ser removido" });
    }

    // Remover arquivo físico
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Remover do banco
    await db
      .delete(ecommerceOrderDocuments)
      .where(eq(ecommerceOrderDocuments.id, documentId));

    // Verificar se ainda há outros uploads deste tipo
    const remainingUploads = await db
      .select()
      .from(ecommerceOrderDocuments)
      .where(
        and(
          eq(ecommerceOrderDocuments.orderId, document.orderId),
          eq(ecommerceOrderDocuments.tipo, document.tipo)
        )
      );

    // Se não há mais uploads, voltar status para "pendente"
    if (remainingUploads.length === 0 && requestedDoc) {
      await db
        .update(ecommerceOrderRequestedDocuments)
        .set({ 
          status: "pendente",
          updatedAt: new Date()
        })
        .where(eq(ecommerceOrderRequestedDocuments.id, requestedDoc.id));
    }

    res.json({ success: true, message: "Documento removido com sucesso" });
  } catch (error: any) {
    console.error("Erro ao remover documento:", error);
    res.status(500).json({ error: "Erro ao remover documento" });
  }
});

/**
 * GET /api/app/customer/order-updates
 * Retorna pedidos atualizados nas últimas 24 horas para notificações
 * Apenas pedidos não visualizados (lastViewedAt < updatedAt ou null)
 */
router.get("/order-updates", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // Buscar pedidos atualizados nas últimas 24 horas (exceto os novos)
    // E que ainda não foram visualizados pelo cliente (lastViewedAt < updatedAt ou null)
    const orders = await db
      .select()
      .from(ecommerceOrders)
      .where(
        and(
          eq(ecommerceOrders.clientId, user.clientId),
          sql`${ecommerceOrders.updatedAt} >= NOW() - INTERVAL '24 hours'`,
          sql`${ecommerceOrders.updatedAt} > ${ecommerceOrders.createdAt}`, // Foi atualizado depois da criação
          or(
            isNull(ecommerceOrders.lastViewedAt),
            sql`${ecommerceOrders.lastViewedAt} < ${ecommerceOrders.updatedAt}`
          )
        )
      )
      .orderBy(desc(ecommerceOrders.updatedAt))
      .limit(20);

    // Para cada pedido, contar os itens
    const ordersWithCount = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(ecommerceOrderItems)
          .where(eq(ecommerceOrderItems.orderId, order.id));
        
        return {
          id: order.id,
          orderCode: order.orderCode,
          etapa: order.etapa,
          total: order.total,
          updatedAt: order.updatedAt,
          itemsCount: items.length,
        };
      })
    );

    res.json({
      orders: ordersWithCount,
      count: ordersWithCount.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar atualizações de pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar atualizações" });
  }
});

/**
 * GET /api/app/customer/documents/download/:filename
 * Download de documento (permite acesso sem autenticação estrita para timeline)
 */
router.get("/documents/download/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads", "documents", filename);

    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    // Abrir arquivo no navegador (ao invés de forçar download)
    res.sendFile(filePath);
  } catch (error: any) {
    console.error("Erro ao fazer download:", error);
    res.status(500).json({ error: "Erro ao baixar documento" });
  }
});

/**
 * GET /api/app/customer/orders/:orderId/next-upsell
 * Retorna próximo SVA elegível para oferecer ao cliente
 * Regra: lista ordenada, consome próximo não oferecido, limite máximo de ofertas
 * Funciona para clientes logados E não logados (usa sessão)
 */
router.get("/orders/:orderId/next-upsell", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const LIMITE_OFERTAS = 3; // Máximo de ofertas por pedido

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 [UPSELL GET] INICIANDO BUSCA DE PRÓXIMO UPSELL`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Pedido ID: ${orderId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Buscar pedido (com ou sem autenticação)
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));

    if (!order) {
      console.log(`❌ [UPSELL] Pedido não encontrado: ${orderId}`);
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    console.log(`✅ [UPSELL] Pedido encontrado`);
    console.log(`📊 [UPSELL] Arrays do banco de dados:`);
    console.log(`   upsellsOffered: ${JSON.stringify(order.upsellsOffered)}`);
    console.log(`   upsellsAccepted: ${JSON.stringify(order.upsellsAccepted)}`);
    console.log(`   upsellsRefused: ${JSON.stringify(order.upsellsRefused)}`);
    console.log(`   Total ofertas: ${order.upsellsOffered?.length || 0}`);

    // Verificar limite de ofertas
    const totalOfertas = order.upsellsOffered?.length || 0;
    if (totalOfertas >= LIMITE_OFERTAS) {
      console.log(`🚫 [UPSELL] Limite de ofertas atingido (${totalOfertas}/${LIMITE_OFERTAS})`);
      return res.json({ upsell: null, reason: "limit_reached" });
    }

    // Buscar itens do pedido
    const items = await db
      .select()
      .from(ecommerceOrderItems)
      .where(eq(ecommerceOrderItems.orderId, orderId));

    console.log(`📦 [UPSELL] Pedido tem ${items.length} itens`);

    // Coletar todos os SVAs disponíveis dos produtos (manter ordem)
    const allSvasAvailable: string[] = [];
    const svasData = new Map(); // Armazena dados do SVA (nome, preço, descricao)

    for (const item of items) {
      const [product] = await db
        .select()
        .from(ecommerceProducts)
        .where(eq(ecommerceProducts.id, item.productId));

      if (product?.svasUpsell && product.svasUpsell.length > 0) {
        // Adicionar SVAs na ordem definida no produto
        for (const svaId of product.svasUpsell) {
          if (!allSvasAvailable.includes(svaId)) {
            allSvasAvailable.push(svaId);
            // Buscar dados do SVA
            const [sva] = await db
              .select()
              .from(ecommerceProducts)
              .where(eq(ecommerceProducts.id, svaId));
            
            if (sva) {
              svasData.set(svaId, {
                id: sva.id,
                nome: sva.nome,
                descricao: sva.descricao,
                preco: sva.preco,
              });
            }
          }
        }
      }
    }

    // Filtrar SVAs já oferecidos OU aceitos
    const offered = Array.isArray(order.upsellsOffered) ? order.upsellsOffered : [];
    const accepted = Array.isArray(order.upsellsAccepted) ? order.upsellsAccepted : [];
    
    // NUNCA mostrar SVAs que já foram oferecidos (inclui aceitos e recusados)
    let svasElegiveis = allSvasAvailable.filter(svaId => !offered.includes(svaId));
    
    // GARANTIA EXTRA: Também remover aceitos (caso tenha alguma inconsistência)
    svasElegiveis = svasElegiveis.filter(svaId => !accepted.includes(svaId));
    
    // RANDOMIZAR a ordem dos SVAs elegíveis
    svasElegiveis = svasElegiveis.sort(() => Math.random() - 0.5);

    console.log(`📊 [UPSELL] Total SVAs disponíveis: ${allSvasAvailable.length}`);
    console.log(`📊 [UPSELL] SVAs já oferecidos: ${offered.length} -> ${JSON.stringify(offered)}`);
    console.log(`📊 [UPSELL] SVAs já aceitos: ${accepted.length} -> ${JSON.stringify(accepted)}`);
    console.log(`📊 [UPSELL] SVAs elegíveis (RANDOMIZADOS): ${svasElegiveis.length} -> ${JSON.stringify(svasElegiveis)}`);
    if (allSvasAvailable.length > 0) {
      console.log(`   🎯 Todos disponíveis: [${allSvasAvailable.join(', ')}]`);
    }
    if (svasElegiveis.length > 0) {
      console.log(`   ✅ Elegíveis randomizados: [${svasElegiveis.join(', ')}]`);
    }

    // Retornar primeiro elegível
    if (svasElegiveis.length === 0) {
      console.log(`⚠️ [UPSELL] Nenhum SVA elegível disponível`);
      return res.json({ upsell: null, reason: "no_more_svas" });
    }

    const nextSvaId = svasElegiveis[0];
    const nextSvaData = svasData.get(nextSvaId);

    if (!nextSvaData) {
      console.log(`❌ [UPSELL] Dados do SVA ${nextSvaId} não encontrados`);
      return res.json({ upsell: null, reason: "sva_not_found" });
    }

    console.log(`✅ [UPSELL] Próximo SVA selecionado: ${nextSvaData.nome} (${nextSvaId})`);
    console.log(`💰 [UPSELL] Preço: R$ ${(nextSvaData.preco / 100).toFixed(2)}`);

    // Retornar dados do SVA (texto será randomizado no frontend)
    res.json({
      upsell: {
        id: nextSvaData.id,
        nome: nextSvaData.nome,
        descricao: nextSvaData.descricao,
        preco: nextSvaData.preco,
        momento: totalOfertas === 0 ? 'checkout' : totalOfertas === 1 ? 'pos-checkout' : 'painel',
      },
    });
  } catch (error: any) {
    console.error("❌ [UPSELL] Erro ao buscar próximo upsell:", error);
    res.status(500).json({ error: "Erro ao buscar upsell" });
  }
});

/**
 * POST /api/app/customer/orders/:orderId/upsell-viewed
 * Registra que o cliente VISUALIZOU um upsell (sem responder ainda)
 * Funciona para clientes logados E não logados (usa sessão)
 */
router.post("/orders/:orderId/upsell-viewed", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { svaId } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`👁️  [UPSELL VIEWED] REGISTRANDO VISUALIZAÇÃO`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Pedido ID: ${orderId}`);
    console.log(`   SVA ID: ${svaId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    if (!orderId || !svaId) {
      return res.status(400).json({ error: "orderId e svaId são obrigatórios" });
    }

    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Atualizar array de oferecidos (apenas adicionar se ainda não está)
    const offered = Array.isArray(order.upsellsOffered) ? [...order.upsellsOffered] : [];

    console.log(`📊 [UPSELL VIEWED] Array ANTES: ${JSON.stringify(offered)}`);

    if (!offered.includes(svaId)) {
      offered.push(svaId);
      console.log(`   ➕ Adicionado aos oferecidos`);

      await db
        .update(ecommerceOrders)
        .set({
          upsellsOffered: offered,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceOrders.id, orderId));

      console.log(`💾 [UPSELL VIEWED] Array atualizado no banco de dados`);
      console.log(`📊 [UPSELL VIEWED] Array DEPOIS: ${JSON.stringify(offered)}`);
    } else {
      console.log(`   ⚠️ JÁ estava nos oferecidos - não fez nada`);
    }

    return res.json({ 
      success: true, 
      message: "Visualização registrada",
    });
  } catch (error: any) {
    console.error("❌ [UPSELL VIEWED] Erro ao registrar visualização:", error);
    res.status(500).json({ error: "Erro ao registrar visualização" });
  }
});

/**
 * POST /api/app/customer/orders/:orderId/upsell-response
 * Registra resposta do cliente ao upsell (aceitar/recusar)
 * Funciona para clientes logados E não logados (usa sessão)
 */
router.post("/orders/:orderId/upsell-response", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { svaId, accepted } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📨 [UPSELL POST] RECEBENDO RESPOSTA DO CLIENTE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Pedido ID: ${orderId}`);
    console.log(`   SVA ID: ${svaId}`);
    console.log(`   Aceito: ${accepted}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    if (!svaId || typeof accepted !== "boolean") {
      return res.status(400).json({ error: "svaId e accepted são obrigatórios" });
    }

    // Buscar pedido (com ou sem autenticação)
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Atualizar arrays de tracking
    const offered = Array.isArray(order.upsellsOffered) ? [...order.upsellsOffered] : [];
    const acceptedList = Array.isArray(order.upsellsAccepted) ? [...order.upsellsAccepted] : [];
    const refusedList = Array.isArray(order.upsellsRefused) ? [...order.upsellsRefused] : [];

    console.log(`📊 [UPSELL RESPONSE] Recebido:`);
    console.log(`   SVA ID: ${svaId}`);
    console.log(`   Aceito: ${accepted}`);
    console.log(`   Arrays ANTES da atualização:`);
    console.log(`     Oferecidos: ${JSON.stringify(offered)}`);
    console.log(`     Aceitos: ${JSON.stringify(acceptedList)}`);
    console.log(`     Recusados: ${JSON.stringify(refusedList)}`);

    // SEMPRE adicionar aos oferecidos (independente de aceitar/recusar)
    if (!offered.includes(svaId)) {
      offered.push(svaId);
      console.log(`   ➕ Adicionado aos oferecidos`);
    } else {
      console.log(`   ⚠️ JÁ estava nos oferecidos!`);
    }

    // Adicionar à lista apropriada
    if (accepted) {
      if (!acceptedList.includes(svaId)) {
        acceptedList.push(svaId);
      }
      console.log(`✅ [UPSELL] SVA aceito: ${svaId}`);
    } else {
      if (!refusedList.includes(svaId)) {
        refusedList.push(svaId);
      }
      console.log(`❌ [UPSELL] SVA recusado: ${svaId}`);
    }

    console.log(`📊 [UPSELL] Arrays APÓS atualização:`);
    console.log(`   Oferecidos: ${JSON.stringify(offered)}`);
    console.log(`   Aceitos: ${JSON.stringify(acceptedList)}`);
    console.log(`   Recusados: ${JSON.stringify(refusedList)}`);

    // ATUALIZAR OS ARRAYS PRIMEIRO (SEMPRE)
    await db
      .update(ecommerceOrders)
      .set({
        upsellsOffered: offered,
        upsellsAccepted: acceptedList,
        upsellsRefused: refusedList,
        updatedAt: new Date(),
      })
      .where(eq(ecommerceOrders.id, orderId));

    console.log(`💾 [UPSELL] Arrays atualizados no banco de dados`);

    // VERIFICAR SE REALMENTE SALVOU
    const [orderVerify] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));
      
    console.log(`🔍 [UPSELL] VERIFICAÇÃO PÓS-SAVE:`);
    console.log(`   Oferecidos no DB: ${JSON.stringify(orderVerify.upsellsOffered)}`);
    console.log(`   Aceitos no DB: ${JSON.stringify(orderVerify.upsellsAccepted)}`);
    console.log(`   Recusados no DB: ${JSON.stringify(orderVerify.upsellsRefused)}`);

    // Se aceito, adicionar ao pedido (DEPOIS de atualizar arrays)
    if (accepted) {
      // Verificar se o SVA JÁ existe nos itens do pedido
      const existingItem = await db
        .select()
        .from(ecommerceOrderItems)
        .where(
          and(
            eq(ecommerceOrderItems.orderId, orderId),
            eq(ecommerceOrderItems.productId, svaId)
          )
        );

      if (existingItem.length > 0) {
        console.log(`⚠️ [UPSELL] SVA ${svaId} JÁ existe no pedido - não vai adicionar novamente`);
        console.log(`   Item encontrado:`, existingItem[0]);
        return res.json({ 
          success: true, 
          message: "SVA já estava no pedido",
        });
      } else {
        console.log(`✅ [UPSELL] SVA ${svaId} NÃO existe no pedido - vai adicionar`);
      }

      const [sva] = await db
        .select()
        .from(ecommerceProducts)
        .where(eq(ecommerceProducts.id, svaId));

      if (sva) {
        console.log(`✅ [UPSELL] Adicionando SVA ao pedido: ${sva.nome}`);
        
        await db.insert(ecommerceOrderItems).values({
          orderId,
          productId: sva.id,
          productNome: sva.nome,
          productDescricao: sva.descricao,
          productCategoria: sva.categoria,
          productOperadora: sva.operadora,
          quantidade: 1,
          linhasAdicionais: 0,
          preco: sva.preco,
          precoUnitario: sva.preco,
          valorPorLinhaAdicional: 0,
          subtotal: sva.preco,
        });

        console.log(`💾 [UPSELL] SVA adicionado com sucesso aos itens do pedido`);

        // Atualizar total do pedido
        const newTotal = order.total + sva.preco;
        
        console.log(`💰 [UPSELL] Atualizando total: ${order.total} + ${sva.preco} = ${newTotal}`);
        
        await db
          .update(ecommerceOrders)
          .set({
            total: newTotal,
            updatedAt: new Date(),
          })
          .where(eq(ecommerceOrders.id, orderId));

        console.log(`💾 [UPSELL] Total do pedido atualizado`);

        return res.json({ 
          success: true, 
          message: "Upsell aceito e adicionado ao pedido",
          newTotal,
        });
      }
    }

    return res.json({ 
      success: true, 
      message: "Resposta registrada",
    });
  } catch (error: any) {
    console.error("Erro ao processar resposta de upsell:", error);
    res.status(500).json({ error: "Erro ao processar resposta" });
  }
});

export default router;
