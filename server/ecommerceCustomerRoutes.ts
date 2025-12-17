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
 * GET /api/ecommerce/customer/orders
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
        console.log(`\n🔍 [ORDER ${order.orderCode}] Verificando tipo...`);
        console.log(`   DB tipoContratacao: "${order.tipoContratacao}"`);
        
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
        
        console.log(`   Tem linhas? ${linhasPortabilidade.length > 0} (qty: ${linhasPortabilidade.length})`);
        
        // Se foi criado como portabilidade OU tem linhas, mantém como portabilidade
        // Uma vez portabilidade, sempre portabilidade (mesmo se remover todas as linhas)
        const isPortabilidade = order.tipoContratacao === "portabilidade" || linhasPortabilidade.length > 0;
        
        console.log(`   ✅ isPortabilidade: ${isPortabilidade}`);
        console.log(`   📤 Retornando: "${isPortabilidade ? "portabilidade" : (order.tipoContratacao || "linha_nova")}"`);

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
 * GET /api/ecommerce/customer/orders/:orderId
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

    res.json({
      ...order,
      items,
      documents,
    });
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

/**
 * GET /api/ecommerce/customer/profile
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
 * PUT /api/ecommerce/customer/profile
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
 * POST /api/ecommerce/customer/address-change-request
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
 * POST /api/ecommerce/customer/documents/upload
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
                downloadUrl: `/api/ecommerce/customer/documents/download/${encodeURIComponent(path.basename(file.path))}`,
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
 * GET /api/ecommerce/customer/documents/:orderId
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
 * GET /api/ecommerce/customer/orders/:orderId/requested-documents
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
 * DELETE /api/ecommerce/customer/documents/:documentId
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
 * GET /api/ecommerce/customer/order-updates
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
 * GET /api/ecommerce/customer/documents/download/:filename
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

export default router;
