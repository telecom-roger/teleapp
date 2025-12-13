import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { ecommerceOrders, ecommerceOrderItems, ecommerceProducts, clients, users, ecommerceOrderDocuments } from "@shared/schema";
import { eq, desc, and, or, like, sql, isNull } from "drizzle-orm";
import { requireRole, requireAuth, blockCustomers } from "./middleware/auth";
import { notifyOrderStageChange } from "./notificationService";

const router = Router();

/**
 * GET /api/admin/ecommerce/orders
 * Lista todos os pedidos do ecommerce (para admin)
 */
router.get("/orders", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { etapa, search, limit = "50" } = req.query;

    let query = db
      .select()
      .from(ecommerceOrders)
      .$dynamic();

    // Filtrar por etapa
    if (etapa && typeof etapa === "string") {
      query = query.where(eq(ecommerceOrders.etapa, etapa));
    }

    // Buscar por nome, email ou telefone
    if (search && typeof search === "string") {
      query = query.where(
        or(
          like(ecommerceOrders.nomeCompleto, `%${search}%`),
          like(ecommerceOrders.razaoSocial, `%${search}%`),
          like(ecommerceOrders.email, `%${search}%`),
          like(ecommerceOrders.telefone, `%${search}%`)
        )
      );
    }

    const orders = await query
      .orderBy(desc(ecommerceOrders.createdAt))
      .limit(parseInt(limit as string));

    // Buscar cliente associado para cada pedido
    const ordersWithClient = await Promise.all(
      orders.map(async (order) => {
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, order.clientId))
          .limit(1);

        // Buscar itens do pedido
        const items = await db
          .select()
          .from(ecommerceOrderItems)
          .where(eq(ecommerceOrderItems.orderId, order.id));

        return {
          ...order,
          client,
          items,
          itemsCount: items.length,
        };
      })
    );

    res.json(ordersWithClient);
  } catch (error: any) {
    console.error("Erro ao buscar pedidos do ecommerce:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

/**
 * GET /api/admin/ecommerce/orders/list
 * Lista todos os pedidos com filtros avançados (para listagem admin)
 * IMPORTANTE: Esta rota deve vir ANTES de /orders/:orderId para não ser capturada como parâmetro
 */
router.get("/orders/list", blockCustomers, async (req: Request, res: Response) => {
  try {
    const {
      search,
      dataInicio,
      dataFim,
      etapa,
      tipoPessoa,
      operadora,
      categoria,
      valorMin,
      valorMax,
      agentId,
    } = req.query;

    // Iniciar query dinâmica sem select() vazio para evitar erros do Drizzle
    const conditions: any[] = [];

    // Filtro de busca (nome, email, cpf, cnpj)
    if (search && typeof search === "string") {
      conditions.push(
        or(
          like(ecommerceOrders.nomeCompleto, `%${search}%`),
          like(ecommerceOrders.razaoSocial, `%${search}%`),
          like(ecommerceOrders.email, `%${search}%`),
          like(ecommerceOrders.cpf, `%${search}%`),
          like(ecommerceOrders.cnpj, `%${search}%`)
        )
      );
    }

    // Filtro de data início
    if (dataInicio && typeof dataInicio === "string") {
      conditions.push(sql`DATE(${ecommerceOrders.createdAt}) >= ${dataInicio}`);
    }

    // Filtro de data fim
    if (dataFim && typeof dataFim === "string") {
      conditions.push(sql`DATE(${ecommerceOrders.createdAt}) <= ${dataFim}`);
    }

    // Filtro de etapa
    if (etapa && typeof etapa === "string") {
      conditions.push(eq(ecommerceOrders.etapa, etapa));
    }

    // Filtro de tipo de pessoa
    if (tipoPessoa && typeof tipoPessoa === "string") {
      conditions.push(eq(ecommerceOrders.tipoPessoa, tipoPessoa));
    }

    // Filtro de agente
    if (agentId && typeof agentId === "string") {
      conditions.push(eq(ecommerceOrders.responsavelId, agentId));
    }

    // Filtro de valor mínimo
    if (valorMin && typeof valorMin === "string") {
      const valorMinCents = Math.round(parseFloat(valorMin) * 100);
      conditions.push(sql`${ecommerceOrders.total} >= ${valorMinCents}`);
    }

    // Filtro de valor máximo
    if (valorMax && typeof valorMax === "string") {
      const valorMaxCents = Math.round(parseFloat(valorMax) * 100);
      conditions.push(sql`${ecommerceOrders.total} <= ${valorMaxCents}`);
    }

    // Aplicar condições se houver
    let results;
    if (conditions.length > 0) {
      results = await db.query.ecommerceOrders.findMany({
        where: and(...conditions),
        orderBy: [desc(ecommerceOrders.createdAt)],
        limit: 500,
      });
    } else {
      results = await db.query.ecommerceOrders.findMany({
        orderBy: [desc(ecommerceOrders.createdAt)],
        limit: 500,
      });
    }

    // Buscar itens dos pedidos e informações do agente
    const ordersWithItems = await Promise.all(
      results.map(async (order) => {
        // Buscar nome do agente se houver
        let agentName = null;
        if (order.responsavelId) {
          const agent = await db.query.users.findFirst({
            where: eq(users.id, order.responsavelId),
            columns: { firstName: true },
          });
          agentName = agent?.firstName || null;
        }

        // Buscar itens do pedido
        const items = await db.query.ecommerceOrderItems.findMany({
          where: eq(ecommerceOrderItems.orderId, order.id),
        });

        // Aplicar filtros de operadora e categoria se necessário
        let filteredItems = items;

        if (operadora && typeof operadora === "string") {
          filteredItems = items.filter(item => item.productOperadora === operadora);
          if (filteredItems.length === 0) return null; // Excluir pedido se não tem itens da operadora
        }

        if (categoria && typeof categoria === "string") {
          filteredItems = items.filter(item => item.productCategoria === categoria);
          if (filteredItems.length === 0) return null; // Excluir pedido se não tem itens da categoria
        }

        return {
          ...order,
          agentId: order.responsavelId, // Mapear responsavelId para agentId para compatibilidade com frontend
          agentName,
          items: filteredItems,
        };
      })
    );

    // Filtrar nulls (pedidos que não passaram nos filtros de itens)
    const filteredOrders = ordersWithItems.filter(order => order !== null);

    res.json(filteredOrders);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
});

/**
 * GET /api/admin/ecommerce/orders/:orderId
 * Detalhes completos de um pedido (para admin)
 */
router.get("/orders/:orderId", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Buscar cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, order.clientId))
      .limit(1);

    // Buscar itens
    const items = await db
      .select()
      .from(ecommerceOrderItems)
      .where(eq(ecommerceOrderItems.orderId, orderId));

    // Buscar documentos
    const documents = await db
      .select()
      .from(ecommerceOrderDocuments)
      .where(eq(ecommerceOrderDocuments.orderId, orderId));

    res.json({
      ...order,
      client,
      items,
      documents,
    });
  } catch (error: any) {
    console.error("Erro ao buscar detalhes do pedido:", error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

/**
 * PUT /api/admin/ecommerce/orders/:orderId/etapa
 * Atualiza a etapa de um pedido
 */
router.put("/orders/:orderId/etapa", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { etapa, observacoes } = req.body;

    if (!etapa) {
      return res.status(400).json({ error: "Etapa é obrigatória" });
    }

    // Buscar pedido atual para manter histórico de observações
    const [currentOrder] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));

    if (!currentOrder) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Adicionar nova observação ao histórico
    const timestamp = new Date().toLocaleString("pt-BR");
    const novaObservacao = observacoes 
      ? `[${timestamp}] ${observacoes}`
      : null;
    
    const observacoesAtualizadas = currentOrder.observacoes && novaObservacao
      ? `${currentOrder.observacoes}\n${novaObservacao}`
      : novaObservacao || currentOrder.observacoes;

    const [order] = await db
      .update(ecommerceOrders)
      .set({
        etapa,
        observacoes: observacoesAtualizadas,
        updatedAt: new Date(),
      })
      .where(eq(ecommerceOrders.id, orderId))
      .returning();

    // Buscar usuário do cliente para enviar notificação
    const [client] = await db
      .select({
        userId: users.id,
      })
      .from(clients)
      .leftJoin(users, eq(users.clientId, clients.id))
      .where(eq(clients.id, currentOrder.clientId));

    // Enviar notificação em tempo real para o cliente
    if (client?.userId) {
      try {
        await notifyOrderStageChange(
          client.userId,
          orderId,
          currentOrder.etapa,
          etapa,
          req.user?.id
        );
      } catch (notifError) {
        console.error("Erro ao enviar notificação:", notifError);
        // Não falhar a requisição por erro de notificação
      }
    }

    res.json(order);
  } catch (error: any) {
    console.error("Erro ao atualizar etapa do pedido:", error);
    res.status(500).json({ error: "Erro ao atualizar pedido" });
  }
});

/**
 * PUT /api/admin/ecommerce/orders/:orderId/responsavel
 * Atribui um responsável ao pedido
 */
router.put("/orders/:orderId/responsavel", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { responsavelId } = req.body;

    const [order] = await db
      .update(ecommerceOrders)
      .set({
        responsavelId: responsavelId || null,
        updatedAt: new Date(),
      })
      .where(eq(ecommerceOrders.id, orderId))
      .returning();

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    res.json(order);
  } catch (error: any) {
    console.error("Erro ao atribuir responsável:", error);
    res.status(500).json({ error: "Erro ao atualizar pedido" });
  }
});

/**
 * GET /api/admin/ecommerce/stats
 * Estatísticas dos pedidos do ecommerce
 */
router.get("/stats", blockCustomers, async (req: Request, res: Response) => {
  try {
    const stats = await db
      .select({
        etapa: ecommerceOrders.etapa,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${ecommerceOrders.total})::int`,
      })
      .from(ecommerceOrders)
      .groupBy(ecommerceOrders.etapa);

    const totalPedidos = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ecommerceOrders);

    const pedidosHoje = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ecommerceOrders)
      .where(sql`DATE(${ecommerceOrders.createdAt}) = CURRENT_DATE`);

    const totalReceita = await db
      .select({ total: sql<number>`sum(${ecommerceOrders.total})::int` })
      .from(ecommerceOrders);

    res.json({
      porEtapa: stats,
      totalPedidos: totalPedidos[0]?.count || 0,
      pedidosHoje: pedidosHoje[0]?.count || 0,
      totalReceita: totalReceita[0]?.total || 0,
    });
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

/**
 * GET /api/admin/ecommerce/notifications/new-orders
 * Retorna pedidos novos das últimas 24 horas para notificações
 * Apenas pedidos não visualizados por admin (lastViewedByAdminAt < createdAt ou null)
 */
router.get("/notifications/new-orders", blockCustomers, async (req: Request, res: Response) => {
  try {
    // Buscar pedidos novos das últimas 24 horas que ainda não foram visualizados por admin
    const orders = await db
      .select()
      .from(ecommerceOrders)
      .where(
        and(
          eq(ecommerceOrders.etapa, 'novo_pedido'),
          sql`${ecommerceOrders.createdAt} >= NOW() - INTERVAL '24 hours'`,
          or(
            isNull(ecommerceOrders.lastViewedByAdminAt),
            sql`${ecommerceOrders.lastViewedByAdminAt} < ${ecommerceOrders.createdAt}`
          )
        )
      )
      .orderBy(desc(ecommerceOrders.createdAt))
      .limit(20);

    res.json({
      orders,
      count: orders.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar notificações de pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

/**
 * PUT /api/admin/ecommerce/orders/:orderId/agent
 * Atribui um agente ao pedido
 */
router.put("/orders/:orderId/agent", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { agentId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "ID do pedido obrigatório" });
    }

    // Buscar pedido
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Verificar se agente existe (se fornecido)
    if (agentId) {
      const [agent] = await db
        .select()
        .from(users)
        .where(eq(users.id, agentId));

      if (!agent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }
    }

    // Atualizar pedido
    await db
      .update(ecommerceOrders)
      .set({
        responsavelId: agentId || null,
        updatedAt: new Date(),
      })
      .where(eq(ecommerceOrders.id, orderId));

    res.json({ success: true, message: "Agente atribuído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atribuir agente:", error);
    res.status(500).json({ error: "Erro ao atribuir agente" });
  }
});

// POST /api/admin/ecommerce/orders/:orderId/mark-viewed - Marcar pedido específico como visualizado (admin)
router.post("/orders/:orderId/mark-viewed", requireAuth, blockCustomers, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Verifica se o pedido existe
    const order = await db.query.ecommerceOrders.findFirst({
      where: eq(ecommerceOrders.id, orderId)
    });
    
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    
    // Atualiza o pedido como visualizado
    await db
      .update(ecommerceOrders)
      .set({ lastViewedByAdminAt: new Date() })
      .where(eq(ecommerceOrders.id, orderId));
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao marcar pedido como visualizado:", error);
    res.status(500).json({ error: "Erro ao marcar como visualizado" });
  }
});

// POST /api/admin/ecommerce/orders/mark-all-viewed - Marcar todos os pedidos como visualizados (admin)
router.post("/orders/mark-all-viewed", requireAuth, blockCustomers, async (req, res) => {
  try {
    // Atualiza todos os pedidos (não precisa de where, atualiza todos)
    await db
      .update(ecommerceOrders)
      .set({ lastViewedByAdminAt: new Date() });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao marcar todos como visualizados:", error);
    res.status(500).json({ error: "Erro ao marcar como visualizado" });
  }
});

export default router;
