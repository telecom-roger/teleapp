import { Router, type Request, type Response } from "express";
import { db } from "./db";
import {
  ecommerceOrders,
  ecommerceOrderItems,
  ecommerceProducts,
  clients,
  users,
  ecommerceOrderDocuments,
  ecommerceOrderRequestedDocuments,
  interactions,
  ecommerceBanners,
} from "@shared/schema";
import { eq, desc, and, or, like, sql, isNull, asc } from "drizzle-orm";
import { requireRole, requireAuth, blockCustomers } from "./middleware/auth";
import { notifyOrderStageChange } from "./notificationService";

const router = Router();

// Templates de documentos padrão por tipo de pessoa
const DOCUMENTOS_PF = [
  { tipo: "rg_cnh", nome: "CNH ou CPF/RG", obrigatorio: true },
  {
    tipo: "comprovante_endereco",
    nome: "Comprovante de Endereço",
    obrigatorio: true,
  },
];

const DOCUMENTOS_PJ = [
  { tipo: "contrato_social", nome: "Contrato Social", obrigatorio: true },
  {
    tipo: "documento_responsavel",
    nome: "CNH ou CPF/RG do Responsável",
    obrigatorio: true,
  },
];

/**
 * Helper: Registra evento na timeline do cliente
 */
async function registrarEventoTimeline(data: {
  clientId: string;
  tipo: string;
  titulo: string;
  texto?: string;
  meta?: any;
  createdBy?: string;
}) {
  try {
    await db.insert(interactions).values({
      clientId: data.clientId,
      tipo: data.tipo,
      origem: data.createdBy ? "user" : "system", // Se tem createdBy, foi usuário, senão sistema
      titulo: data.titulo,
      texto: data.texto || null,
      meta: data.meta || {},
      createdBy: data.createdBy || null,
    });
    console.log(
      `✅ [TIMELINE ECOMMERCE] ${data.tipo} registrado para cliente ${data.clientId}`
    );
  } catch (error: any) {
    console.error(
      `❌ [TIMELINE ECOMMERCE] Erro ao registrar ${data.tipo}:`,
      error
    );
  }
}

/**
 * GET /api/admin/ecommerce/orders
 * Lista todos os pedidos do ecommerce (para admin)
 */
router.get("/orders", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { etapa, search, limit = "50" } = req.query;

    let query = db.select().from(ecommerceOrders).$dynamic();

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
router.get(
  "/orders/list",
  blockCustomers,
  async (req: Request, res: Response) => {
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
        conditions.push(
          sql`DATE(${ecommerceOrders.createdAt}) >= ${dataInicio}`
        );
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
            filteredItems = items.filter(
              (item) => item.productOperadora === operadora
            );
            if (filteredItems.length === 0) return null; // Excluir pedido se não tem itens da operadora
          }

          if (categoria && typeof categoria === "string") {
            filteredItems = items.filter(
              (item) => item.productCategoria === categoria
            );
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
      const filteredOrders = ordersWithItems.filter((order) => order !== null);

      res.json(filteredOrders);
    } catch (error: any) {
      console.error("Erro ao listar pedidos:", error);
      res.status(500).json({ error: "Erro ao listar pedidos" });
    }
  }
);

/**
 * GET /api/admin/ecommerce/orders/:orderId
 * Detalhes completos de um pedido (para admin)
 */
router.get(
  "/orders/:orderId",
  blockCustomers,
  async (req: Request, res: Response) => {
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
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/etapa
 * Atualiza a etapa de um pedido
 */
router.put(
  "/orders/:orderId/etapa",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { etapa, execucaoTipo, observacoes } = req.body;

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

      // Atualizar observações baseado no tipo de execução
      let observacoesAtualizadas: string | null;

      if (etapa === "em_andamento" && observacoes) {
        // Para status de execução, adicionar nova linha com a mensagem
        const now = new Date();
        const timestamp = now.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const novaObservacao = `${observacoes} - ${timestamp}`;
        observacoesAtualizadas = currentOrder.observacoes
          ? `${currentOrder.observacoes}\n${novaObservacao}`
          : novaObservacao;
      } else if (observacoes) {
        // Para outras etapas, concatenar com histórico
        const now = new Date();
        const timestamp = now.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const novaObservacao = `${observacoes} - ${timestamp}`;
        observacoesAtualizadas = currentOrder.observacoes
          ? `${currentOrder.observacoes}\n${novaObservacao}`
          : novaObservacao;
      } else {
        // Manter observação atual se não houver nova
        observacoesAtualizadas = currentOrder.observacoes;
      }

      const [order] = await db
        .update(ecommerceOrders)
        .set({
          etapa,
          execucaoTipo: etapa === "em_andamento" ? execucaoTipo : null,
          observacoes: observacoesAtualizadas,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceOrders.id, orderId))
        .returning();

      // Se mudou para "aguardando_documentos", carregar documentos padrão
      if (
        etapa === "aguardando_documentos" &&
        currentOrder.etapa !== "aguardando_documentos"
      ) {
        try {
          // Verificar se já existem documentos solicitados
          const existingDocs = await db
            .select()
            .from(ecommerceOrderRequestedDocuments)
            .where(eq(ecommerceOrderRequestedDocuments.orderId, orderId));

          // Se não existem, carregar template padrão
          if (existingDocs.length === 0) {
            const template =
              currentOrder.tipoPessoa === "PJ" ? DOCUMENTOS_PJ : DOCUMENTOS_PF;
            await db.insert(ecommerceOrderRequestedDocuments).values(
              template.map((doc) => ({
                orderId,
                tipo: doc.tipo,
                nome: doc.nome,
                obrigatorio: doc.obrigatorio,
                status: "pendente" as const,
              }))
            );
          }
        } catch (docError) {
          console.error("Erro ao carregar documentos padrão:", docError);
          // Não falhar a requisição por erro ao carregar documentos
        }
      }

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

      // Registrar na timeline do cliente
      try {
        const user = req.user as any;
        const etapaNomes: Record<string, string> = {
          novo_pedido: "Novo Pedido",
          em_analise: "Em Análise",
          aguardando_documentos: "Aguardando Documentos",
          contrato_enviado: "Contrato Enviado",
          contrato_assinado: "Contrato Assinado",
          validando_documentos: "Validando Documentos",
          analise_credito: "Análise de Crédito",
          aprovado: "Aprovado",
          em_andamento: "Em Andamento",
          concluido: "Concluído",
          cancelado: "Cancelado",
        };

        let textoEvento = `Pedido #${currentOrder.orderCode} movido de "${
          etapaNomes[currentOrder.etapa] || currentOrder.etapa
        }" para "${etapaNomes[etapa] || etapa}"`;

        if (observacoes) {
          textoEvento += `\n\n📝 Observação: ${observacoes}`;
        }

        if (etapa === "em_andamento" && execucaoTipo) {
          const tiposExecucao: Record<string, string> = {
            em_rota: "🚗 Em Rota",
            aguardando_instalacao: "⏳ Aguardando Instalação",
            instalacao: "🔧 Em Instalação",
            entrega: "🚚 Em Entrega",
            personalizado: "✏️ Status Personalizado",
          };
          textoEvento += `\n\nStatus: ${
            tiposExecucao[execucaoTipo] || execucaoTipo
          }`;
        }

        await registrarEventoTimeline({
          clientId: currentOrder.clientId,
          tipo: "ecommerce_mudanca_etapa",
          titulo: `📊 Pedido #${currentOrder.orderCode} - Etapa Atualizada`,
          texto: textoEvento,
          meta: {
            orderId: currentOrder.id,
            orderCode: currentOrder.orderCode,
            etapaAnterior: currentOrder.etapa,
            etapaNova: etapa,
            execucaoTipo: execucaoTipo || null,
            observacoes: observacoes || null,
          },
          createdBy: user?.id || null,
        });
      } catch (timelineError) {
        console.error(
          "❌ Erro ao registrar mudança de etapa na timeline:",
          timelineError
        );
      }

      res.json(order);
    } catch (error: any) {
      console.error("Erro ao atualizar etapa do pedido:", error);
      res.status(500).json({ error: "Erro ao atualizar pedido" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/responsavel
 * Atribui um responsável ao pedido
 */
router.put(
  "/orders/:orderId/responsavel",
  blockCustomers,
  async (req: Request, res: Response) => {
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
  }
);

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
router.get(
  "/notifications/new-orders",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      // Buscar pedidos novos das últimas 24 horas que ainda não foram visualizados por admin
      const orders = await db
        .select()
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.etapa, "novo_pedido"),
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
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/agent
 * Atribui um agente ao pedido
 */
router.put(
  "/orders/:orderId/agent",
  blockCustomers,
  async (req: Request, res: Response) => {
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
  }
);

// POST /api/admin/ecommerce/orders/:orderId/mark-viewed - Marcar pedido específico como visualizado (admin)
router.post(
  "/orders/:orderId/mark-viewed",
  requireAuth,
  blockCustomers,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // Verifica se o pedido existe
      const order = await db.query.ecommerceOrders.findFirst({
        where: eq(ecommerceOrders.id, orderId),
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
  }
);

// POST /api/admin/ecommerce/orders/mark-all-viewed - Marcar todos os pedidos como visualizados (admin)
router.post(
  "/orders/mark-all-viewed",
  requireAuth,
  blockCustomers,
  async (req, res) => {
    try {
      // Atualiza todos os pedidos (não precisa de where, atualiza todos)
      await db.update(ecommerceOrders).set({ lastViewedByAdminAt: new Date() });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao marcar todos como visualizados:", error);
      res.status(500).json({ error: "Erro ao marcar como visualizado" });
    }
  }
);

// ==================== BANNERS ====================

/**
 * GET /api/admin/ecommerce/banners
 * Lista todos os banners (admin)
 */
router.get("/banners", blockCustomers, async (req: Request, res: Response) => {
  try {
    const banners = await db
      .select()
      .from(ecommerceBanners)
      .orderBy(asc(ecommerceBanners.ordem), desc(ecommerceBanners.createdAt));
    
    res.json(banners);
  } catch (error: any) {
    console.error("Erro ao listar banners:", error);
    res.status(500).json({ error: "Erro ao listar banners" });
  }
});

/**
 * POST /api/admin/ecommerce/banners
 * Cria um novo banner
 */
router.post("/banners", requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const {
      titulo,
      subtitulo,
      imagemUrl,
      imagemMobileUrl,
      pagina,
      posicao,
      linkDestino,
      linkTexto,
      ordem,
      ativo,
      dataInicio,
      dataFim,
    } = req.body;

    if (!titulo || !imagemUrl || !pagina) {
      return res.status(400).json({ error: "Campos obrigatórios: titulo, imagemUrl, pagina" });
    }

    const [banner] = await db
      .insert(ecommerceBanners)
      .values({
        titulo,
        subtitulo,
        imagemUrl,
        imagemMobileUrl,
        pagina,
        posicao: posicao || "topo",
        linkDestino,
        linkTexto,
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
      })
      .returning();

    res.json(banner);
  } catch (error: any) {
    console.error("Erro ao criar banner:", error);
    res.status(500).json({ error: "Erro ao criar banner" });
  }
});

/**
 * PUT /api/admin/ecommerce/banners/:id
 * Atualiza um banner
 */
router.put("/banners/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Converter datas se necessário
    if (updates.dataInicio) updates.dataInicio = new Date(updates.dataInicio);
    if (updates.dataFim) updates.dataFim = new Date(updates.dataFim);

    const [banner] = await db
      .update(ecommerceBanners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ecommerceBanners.id, id))
      .returning();

    if (!banner) {
      return res.status(404).json({ error: "Banner não encontrado" });
    }

    res.json(banner);
  } catch (error: any) {
    console.error("Erro ao atualizar banner:", error);
    res.status(500).json({ error: "Erro ao atualizar banner" });
  }
});

/**
 * DELETE /api/admin/ecommerce/banners/:id
 * Remove um banner
 */
router.delete("/banners/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(ecommerceBanners).where(eq(ecommerceBanners.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar banner:", error);
    res.status(500).json({ error: "Erro ao deletar banner" });
  }
});

// ==================== DOCUMENTOS SOLICITADOS ====================

/**
 * GET /api/admin/ecommerce/orders/:orderId/requested-documents
 * Lista documentos solicitados para um pedido
 */
router.get(
  "/orders/:orderId/requested-documents",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const documents = await db
        .select()
        .from(ecommerceOrderRequestedDocuments)
        .where(eq(ecommerceOrderRequestedDocuments.orderId, orderId))
        .orderBy(ecommerceOrderRequestedDocuments.createdAt);

      res.json(documents);
    } catch (error: any) {
      console.error("Erro ao listar documentos solicitados:", error);
      res.status(500).json({ error: "Erro ao listar documentos solicitados" });
    }
  }
);

/**
 * POST /api/admin/ecommerce/orders/:orderId/requested-documents
 * Adiciona um documento solicitado para um pedido
 */
router.post(
  "/orders/:orderId/requested-documents",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { tipo, nome, obrigatorio = true } = req.body;

      if (!tipo || !nome) {
        return res.status(400).json({ error: "Tipo e nome são obrigatórios" });
      }

      // Verificar se o pedido existe
      const [order] = await db
        .select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      const [document] = await db
        .insert(ecommerceOrderRequestedDocuments)
        .values({
          orderId,
          tipo,
          nome,
          obrigatorio,
          status: "pendente",
        })
        .returning();

      // Registrar na timeline
      try {
        const user = req.user as any;

        await registrarEventoTimeline({
          clientId: order.clientId,
          tipo: "ecommerce_documento_customizado_solicitado",
          titulo: `📄 Documento Adicional Solicitado - Pedido #${order.orderCode}`,
          texto: `Admin solicitou documento customizado: ${nome}${
            obrigatorio ? " (obrigatório)" : " (opcional)"
          }`,
          meta: {
            orderId: order.id,
            orderCode: order.orderCode,
            documentoId: document.id,
            documentoNome: nome,
            documentoTipo: tipo,
            obrigatorio,
          },
          createdBy: user?.id || null,
        });
      } catch (timelineError) {
        console.error(
          "❌ Erro ao registrar documento customizado na timeline:",
          timelineError
        );
      }

      res.json(document);
    } catch (error: any) {
      console.error("Erro ao adicionar documento solicitado:", error);
      res.status(500).json({ error: "Erro ao adicionar documento solicitado" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/requested-documents/:documentId
 * Atualiza status de um documento solicitado
 */
router.put(
  "/orders/:orderId/requested-documents/:documentId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId, documentId } = req.params;
      const { status, observacoes, obrigatorio, nome } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (observacoes !== undefined) updateData.observacoes = observacoes;
      if (obrigatorio !== undefined) updateData.obrigatorio = obrigatorio;
      if (nome) updateData.nome = nome;

      const [document] = await db
        .update(ecommerceOrderRequestedDocuments)
        .set(updateData)
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.id, documentId),
            eq(ecommerceOrderRequestedDocuments.orderId, orderId)
          )
        )
        .returning();

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      res.json(document);
    } catch (error: any) {
      console.error("Erro ao atualizar documento solicitado:", error);
      res.status(500).json({ error: "Erro ao atualizar documento solicitado" });
    }
  }
);

/**
 * DELETE /api/admin/ecommerce/orders/:orderId/requested-documents/:documentId
 * Remove um documento solicitado e seus uploads associados
 */
router.delete(
  "/orders/:orderId/requested-documents/:documentId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId, documentId } = req.params;

      // Buscar o documento
      const [document] = await db
        .select()
        .from(ecommerceOrderRequestedDocuments)
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.id, documentId),
            eq(ecommerceOrderRequestedDocuments.orderId, orderId)
          )
        )
        .limit(1);

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Buscar pedido para pegar clientId
      const [order] = await db
        .select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.id, orderId))
        .limit(1);

      // Remover uploads associados ao tipo de documento
      const uploads = await db
        .select()
        .from(ecommerceOrderDocuments)
        .where(
          and(
            eq(ecommerceOrderDocuments.orderId, orderId),
            eq(ecommerceOrderDocuments.tipo, document.tipo)
          )
        );

      // Deletar arquivos físicos
      const fs = await import("fs");
      const path = await import("path");
      for (const upload of uploads) {
        const filePath = path.join(process.cwd(), upload.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Arquivo deletado: ${filePath}`);
        }
      }

      // Remover registros de upload do banco
      await db
        .delete(ecommerceOrderDocuments)
        .where(
          and(
            eq(ecommerceOrderDocuments.orderId, orderId),
            eq(ecommerceOrderDocuments.tipo, document.tipo)
          )
        );

      // Remover entradas da timeline relacionadas
      if (order) {
        await db
          .delete(interactions)
          .where(
            and(
              eq(interactions.clientId, order.clientId),
              eq(interactions.tipo, "ecommerce_documento_enviado"),
              sql`${interactions.meta}->>'documentoTipo' = ${document.tipo}`
            )
          );
      }

      // Remover o documento solicitado
      await db
        .delete(ecommerceOrderRequestedDocuments)
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.id, documentId),
            eq(ecommerceOrderRequestedDocuments.orderId, orderId)
          )
        );

      console.log(
        `✅ Documento removido: ${document.nome} (${uploads.length} upload(s) deletados)`
      );

      res.json({
        success: true,
        message: "Documento removido com sucesso",
        uploadsRemoved: uploads.length,
      });
    } catch (error: any) {
      console.error("Erro ao remover documento solicitado:", error);
      res.status(500).json({ error: "Erro ao remover documento solicitado" });
    }
  }
);

/**
 * POST /api/admin/ecommerce/orders/:orderId/load-default-documents
 * Carrega documentos padrão baseado no tipo de pessoa do pedido
 */
router.post(
  "/orders/:orderId/load-default-documents",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      // Buscar o pedido
      const [order] = await db
        .select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Verificar quais documentos já foram solicitados
      const existingRequested = await db
        .select()
        .from(ecommerceOrderRequestedDocuments)
        .where(eq(ecommerceOrderRequestedDocuments.orderId, orderId));

      const requestedTypes = new Set(existingRequested.map((doc) => doc.tipo));
      console.log(
        `[LOAD DOCS] Docs já solicitados:`,
        Array.from(requestedTypes)
      );

      // Verificar quais documentos já foram anexados no checkout
      const existingUploads = await db
        .select()
        .from(ecommerceOrderDocuments)
        .where(eq(ecommerceOrderDocuments.orderId, orderId));

      const uploadedTypes = new Set(existingUploads.map((doc) => doc.tipo));
      console.log(`[LOAD DOCS] Docs já anexados:`, Array.from(uploadedTypes));

      // Selecionar template baseado no tipo de pessoa
      const template =
        order.tipoPessoa === "PJ" ? DOCUMENTOS_PJ : DOCUMENTOS_PF;

      // Filtrar apenas documentos que NÃO foram solicitados E NÃO foram anexados
      const docsToRequest = template.filter(
        (doc) => !requestedTypes.has(doc.tipo) && !uploadedTypes.has(doc.tipo)
      );

      console.log(
        `[LOAD DOCS] Docs a solicitar:`,
        docsToRequest.map((d) => d.tipo)
      );

      if (docsToRequest.length === 0) {
        return res.json({
          success: true,
          message:
            "Todos os documentos padrão já foram solicitados ou anexados",
          documents: [],
        });
      }

      // Inserir apenas os documentos faltantes
      const documents = await db
        .insert(ecommerceOrderRequestedDocuments)
        .values(
          docsToRequest.map((doc) => ({
            orderId,
            tipo: doc.tipo,
            nome: doc.nome,
            obrigatorio: doc.obrigatorio,
            status: "pendente" as const,
          }))
        )
        .returning();

      // Registrar na timeline
      try {
        const user = req.user as any;
        const documentosNomes = documents.map((d) => `• ${d.nome}`).join("\n");

        await registrarEventoTimeline({
          clientId: order.clientId,
          tipo: "ecommerce_documentos_solicitados",
          titulo: `📄 Documentos Solicitados - Pedido #${order.orderCode}`,
          texto: `Admin solicitou ${documents.length} documento(s) padrão para ${order.tipoPessoa}:\n${documentosNomes}`,
          meta: {
            orderId: order.id,
            orderCode: order.orderCode,
            tipoPessoa: order.tipoPessoa,
            documentos: documents.map((d) => ({
              id: d.id,
              nome: d.nome,
              obrigatorio: d.obrigatorio,
            })),
          },
          createdBy: user?.id || null,
        });
      } catch (timelineError) {
        console.error(
          "❌ Erro ao registrar documentos na timeline:",
          timelineError
        );
      }

      res.json({
        success: true,
        message: `${documents.length} documentos padrão carregados`,
        documents,
      });
    } catch (error: any) {
      console.error("Erro ao carregar documentos padrão:", error);
      res.status(500).json({ error: "Erro ao carregar documentos padrão" });
    }
  }
);

/**
 * GET /api/admin/ecommerce/orders/:orderId/uploaded-documents
 * Lista documentos enviados/uploaded pelo cliente para um pedido
 */
router.get(
  "/orders/:orderId/uploaded-documents",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      console.log(
        `[UPLOADED-DOCS] Buscando documentos enviados para pedido: ${orderId}`
      );

      const documents = await db
        .select()
        .from(ecommerceOrderDocuments)
        .where(eq(ecommerceOrderDocuments.orderId, orderId))
        .orderBy(asc(ecommerceOrderDocuments.createdAt));

      console.log(
        `[UPLOADED-DOCS] Encontrados ${documents.length} documento(s):`,
        documents.map((d) => ({ id: d.id, tipo: d.tipo, fileName: d.fileName }))
      );

      res.json(documents);
    } catch (error: any) {
      console.error("Erro ao listar documentos enviados:", error);
      res.status(500).json({ error: "Erro ao listar documentos enviados" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/requested-documents/:documentId/approve
 * Aprovar documento solicitado
 */
router.put(
  "/orders/:orderId/requested-documents/:documentId/approve",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId, documentId } = req.params;

      const [document] = await db
        .update(ecommerceOrderRequestedDocuments)
        .set({ status: "aprovado" })
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.id, documentId),
            eq(ecommerceOrderRequestedDocuments.orderId, orderId)
          )
        )
        .returning();

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Buscar pedido e registrar na timeline
      try {
        const [order] = await db
          .select()
          .from(ecommerceOrders)
          .where(eq(ecommerceOrders.id, orderId))
          .limit(1);

        if (order) {
          const user = req.user as any;

          await registrarEventoTimeline({
            clientId: order.clientId,
            tipo: "ecommerce_documento_aprovado",
            titulo: `✅ Documento Aprovado - Pedido #${order.orderCode}`,
            texto: `Admin aprovou o documento: ${document.nome}`,
            meta: {
              orderId: order.id,
              orderCode: order.orderCode,
              documentoId: document.id,
              documentoNome: document.nome,
              documentoTipo: document.tipo,
            },
            createdBy: user?.id || null,
          });
        }
      } catch (timelineError) {
        console.error(
          "❌ Erro ao registrar aprovação na timeline:",
          timelineError
        );
      }

      res.json(document);
    } catch (error: any) {
      console.error("Erro ao aprovar documento:", error);
      res.status(500).json({ error: "Erro ao aprovar documento" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/orders/:orderId/requested-documents/:documentId/reject
 * Reprovar documento solicitado
 */
router.put(
  "/orders/:orderId/requested-documents/:documentId/reject",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { orderId, documentId } = req.params;
      const { motivo } = req.body;

      const [document] = await db
        .update(ecommerceOrderRequestedDocuments)
        .set({
          status: "reprovado", // Status reprovado para exibir claramente ao cliente
          observacoes: motivo || "Documento reprovado - necessário reenviar",
        })
        .where(
          and(
            eq(ecommerceOrderRequestedDocuments.id, documentId),
            eq(ecommerceOrderRequestedDocuments.orderId, orderId)
          )
        )
        .returning();

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Buscar pedido
      const [order] = await db
        .select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Remover APENAS os uploads NOVOS (não aprovados) e arquivos físicos
      try {
        const user = req.user as any;

        // Buscar uploads deste tipo que estão como "enviado" (não aprovados)
        const uploadsToDelete = await db
          .select()
          .from(ecommerceOrderDocuments)
          .where(
            and(
              eq(ecommerceOrderDocuments.orderId, orderId),
              eq(ecommerceOrderDocuments.tipo, document.tipo)
            )
          );

        // Deletar arquivos físicos
        const fs = await import("fs");
        const path = await import("path");
        let filesDeleted = 0;
        for (const upload of uploadsToDelete) {
          const filePath = path.join(process.cwd(), upload.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            filesDeleted++;
            console.log(`🗑️ Arquivo deletado: ${filePath}`);
          }
        }

        // Remover registros de upload do banco
        if (uploadsToDelete.length > 0) {
          await db
            .delete(ecommerceOrderDocuments)
            .where(
              and(
                eq(ecommerceOrderDocuments.orderId, orderId),
                eq(ecommerceOrderDocuments.tipo, document.tipo)
              )
            );
        }

        // Remover APENAS as interações de documento_enviado mais recentes (não aprovadas)
        const deletedInteractions = await db
          .delete(interactions)
          .where(
            and(
              eq(interactions.clientId, order.clientId),
              eq(interactions.tipo, "ecommerce_documento_enviado"),
              sql`${interactions.meta}->>'documentoTipo' = ${document.tipo}`,
              sql`${interactions.meta}->>'orderId' = ${order.id}`
            )
          )
          .returning();

        console.log(
          `🗑️ Reprovação: ${filesDeleted} arquivo(s) físico(s), ${uploadsToDelete.length} upload(s) do banco, ${deletedInteractions.length} evento(s) da timeline removidos`
        );

        // Registrar log da reprovação
        await registrarEventoTimeline({
          clientId: order.clientId,
          tipo: "ecommerce_documento_reprovado",
          titulo: `❌ Documento Reprovado - Pedido #${order.orderCode}`,
          texto: `Admin reprovou o documento: ${document.nome}${
            motivo ? `\n\nMotivo: ${motivo}` : ""
          }\n\n📝 É necessário enviar um novo documento.`,
          meta: {
            orderId: order.id,
            orderCode: order.orderCode,
            documentoId: document.id,
            documentoNome: document.nome,
            documentoTipo: document.tipo,
            motivo: motivo || null,
            arquivosRemovidos: filesDeleted,
            uploadsRemovidos: uploadsToDelete.length,
          },
          createdBy: user?.id || null,
        });
      } catch (timelineError) {
        console.error(
          "❌ Erro ao processar reprovação na timeline:",
          timelineError
        );
      }

      res.json(document);
    } catch (error: any) {
      console.error("Erro ao reprovar documento:", error);
      res.status(500).json({ error: "Erro ao reprovar documento" });
    }
  }
);

export default router;
