import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { ecommerceOrderLines, ecommerceOrders, ecommerceProducts, ecommerceOrderItems } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireRole } from "./middleware/auth";

const router = Router();

/**
 * GET /api/ecommerce/order-lines/:orderId
 * Lista todas as linhas de um pedido
 */
router.get("/:orderId", requireRole(["customer", "admin"]), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    // Buscar pedido
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Verificar permissão: cliente só pode ver seus próprios pedidos
    if (user?.role === "customer" && order.clientId !== user.clientId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Buscar linhas do pedido com informações do produto
    const lines = await db
      .select({
        line: ecommerceOrderLines,
        product: ecommerceProducts,
      })
      .from(ecommerceOrderLines)
      .leftJoin(ecommerceProducts, eq(ecommerceOrderLines.productId, ecommerceProducts.id))
      .where(eq(ecommerceOrderLines.orderId, orderId));

    res.json(lines);
  } catch (error: any) {
    console.error("Erro ao listar linhas:", error);
    res.status(500).json({ error: "Erro ao listar linhas do pedido" });
  }
});

/**
 * GET /api/ecommerce/order-lines/:orderId/summary
 * Retorna resumo das linhas para o pedido (quantidade contratada vs preenchida)
 */
router.get("/:orderId/summary", requireRole(["customer", "admin"]), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    // Buscar pedido
    const [order] = await db
      .select()
      .from(ecommerceOrders)
      .where(eq(ecommerceOrders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Verificar permissão
    if (user?.role === "customer" && order.clientId !== user.clientId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Buscar itens do pedido (exceto SVAs) para contar quantidade de linhas contratadas
    const orderItems = await db
      .select({
        item: ecommerceOrderItems,
        product: ecommerceProducts,
      })
      .from(ecommerceOrderItems)
      .leftJoin(ecommerceProducts, eq(ecommerceOrderItems.productId, ecommerceProducts.id))
      .where(eq(ecommerceOrderItems.orderId, orderId));

    // Calcular total de linhas contratadas (excluindo SVAs)
    let totalLinhasContratadas = 0;
    const produtosDisponiveis: any[] = [];
    const svasDisponiveis: any[] = [];

    orderItems.forEach(({ item, product }) => {
      const categoria = product?.categoria?.toLowerCase() || "";
      const isSVA = categoria.includes("sva");

      if (isSVA) {
        // Adicionar SVA à lista de disponíveis
        svasDisponiveis.push({
          id: product?.id,
          nome: product?.nome,
          categoria: product?.categoria,
          productId: item.productId,
          quantidade: item.quantidade,
        });
      } else {
        // Contar linhas do produto
        totalLinhasContratadas += (item.quantidade || 1) + (item.linhasAdicionais || 0);
        produtosDisponiveis.push({
          id: product?.id,
          nome: product?.nome,
          operadora: product?.operadora,
          categoria: product?.categoria,
          productId: item.productId,
          quantidade: (item.quantidade || 1) + (item.linhasAdicionais || 0),
          svasUpsell: product?.svasUpsell || [],
        });
      }
    });

    // Buscar linhas já preenchidas
    const linhasPreenchidas = await db
      .select()
      .from(ecommerceOrderLines)
      .where(eq(ecommerceOrderLines.orderId, orderId));

    res.json({
      orderId,
      totalLinhasContratadas,
      totalLinhasPreenchidas: linhasPreenchidas.length,
      linhasRestantes: totalLinhasContratadas - linhasPreenchidas.length,
      progresso: totalLinhasContratadas > 0
        ? Math.round((linhasPreenchidas.length / totalLinhasContratadas) * 100)
        : 0,
      produtosDisponiveis,
      svasDisponiveis,
      linhas: linhasPreenchidas,
    });
  } catch (error: any) {
    console.error("Erro ao buscar resumo das linhas:", error);
    res.status(500).json({ error: "Erro ao buscar resumo" });
  }
});

/**
 * POST /api/ecommerce/order-lines
 * Cria uma nova linha de portabilidade
 */
router.post("/", requireRole(["customer", "admin"]), async (req: Request, res: Response) => {
  try {
    const { orderId, productId, numero, operadoraAtual, svas, observacoes } = req.body;
    const user = req.user;

    // Validações básicas
    if (!orderId || !productId || !numero) {
      return res.status(400).json({ error: "Campos obrigatórios: orderId, productId, numero" });
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

    // Verificar permissão
    if (user?.role === "customer" && order.clientId !== user.clientId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Buscar produto para pegar a operadora de destino
    const [product] = await db
      .select()
      .from(ecommerceProducts)
      .where(eq(ecommerceProducts.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Validar se número já existe em pedidos ativos
    const existingLines = await db
      .select({
        line: ecommerceOrderLines,
        order: ecommerceOrders,
      })
      .from(ecommerceOrderLines)
      .leftJoin(ecommerceOrders, eq(ecommerceOrderLines.orderId, ecommerceOrders.id))
      .where(eq(ecommerceOrderLines.numero, numero));

    const numeroJaUsado = existingLines.some(({ order: existingOrder }) => {
      if (!existingOrder) return false;
      // Considerar ativo se não for cancelado, reprovado ou concluído
      const etapasInativas = ["cancelado", "reprovado", "concluido", "encerrado"];
      return !etapasInativas.includes(existingOrder.etapa);
    });

    if (numeroJaUsado) {
      return res.status(400).json({
        error: "Número de linha já está em uso",
        message: "Este número já está associado a outro pedido ativo. Só pode ser utilizado novamente após o pedido anterior ser cancelado, reprovado ou encerrado."
      });
    }

    // Verificar limite de linhas do pedido
    const orderItems = await db
      .select({
        item: ecommerceOrderItems,
        product: ecommerceProducts,
      })
      .from(ecommerceOrderItems)
      .leftJoin(ecommerceProducts, eq(ecommerceOrderItems.productId, ecommerceProducts.id))
      .where(eq(ecommerceOrderItems.orderId, orderId));

    let totalLinhasContratadas = 0;
    orderItems.forEach(({ item, product }) => {
      const categoria = product?.categoria?.toLowerCase() || "";
      if (!categoria.includes("sva")) {
        totalLinhasContratadas += (item.quantidade || 1) + (item.linhasAdicionais || 0);
      }
    });

    const linhasJaCriadas = await db
      .select()
      .from(ecommerceOrderLines)
      .where(eq(ecommerceOrderLines.orderId, orderId));

    if (linhasJaCriadas.length >= totalLinhasContratadas) {
      return res.status(400).json({
        error: "Limite de linhas atingido",
        message: `Este pedido permite apenas ${totalLinhasContratadas} linha(s). Todas já foram preenchidas.`
      });
    }

    // Criar linha
    const [newLine] = await db
      .insert(ecommerceOrderLines)
      .values({
        orderId,
        productId,
        numero,
        operadoraAtual: operadoraAtual || null,
        operadoraDestino: product.operadora || null,
        svas: svas || [],
        status: "inicial",
        observacoes: observacoes || null,
      })
      .returning();

    console.log(`✅ Linha criada: ${numero} para pedido ${orderId}`);

    res.status(201).json(newLine);
  } catch (error: any) {
    console.error("Erro ao criar linha:", error);
    res.status(500).json({ error: "Erro ao criar linha" });
  }
});

/**
 * PUT /api/ecommerce/order-lines/:lineId
 * Atualiza uma linha existente
 */
router.put("/:lineId", requireRole(["customer", "admin"]), async (req: Request, res: Response) => {
  try {
    const { lineId } = req.params;
    const { numero, operadoraAtual, svas, observacoes } = req.body;
    const user = req.user;

    // Buscar linha
    const [line] = await db
      .select({
        line: ecommerceOrderLines,
        order: ecommerceOrders,
      })
      .from(ecommerceOrderLines)
      .leftJoin(ecommerceOrders, eq(ecommerceOrderLines.orderId, ecommerceOrders.id))
      .where(eq(ecommerceOrderLines.id, lineId))
      .limit(1);

    if (!line) {
      return res.status(404).json({ error: "Linha não encontrada" });
    }

    // Verificar permissão
    if (user?.role === "customer" && line.order?.clientId !== user.clientId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Cliente só pode editar se status for "inicial"
    if (user?.role === "customer" && line.line.status !== "inicial") {
      return res.status(403).json({
        error: "Linha não pode ser editada",
        message: "Esta linha já entrou em processo operacional e não pode mais ser editada pelo cliente."
      });
    }

    // Se alterou o número, validar duplicidade
    if (numero && numero !== line.line.numero) {
      const existingLines = await db
        .select({
          line: ecommerceOrderLines,
          order: ecommerceOrders,
        })
        .from(ecommerceOrderLines)
        .leftJoin(ecommerceOrders, eq(ecommerceOrderLines.orderId, ecommerceOrders.id))
        .where(and(
          eq(ecommerceOrderLines.numero, numero),
          sql`${ecommerceOrderLines.id} != ${lineId}`
        ));

      const numeroJaUsado = existingLines.some(({ order: existingOrder }) => {
        if (!existingOrder) return false;
        const etapasInativas = ["cancelado", "reprovado", "concluido", "encerrado"];
        return !etapasInativas.includes(existingOrder.etapa);
      });

      if (numeroJaUsado) {
        return res.status(400).json({
          error: "Número de linha já está em uso",
          message: "Este número já está associado a outro pedido ativo."
        });
      }
    }

    // Atualizar linha
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (numero) updateData.numero = numero;
    if (operadoraAtual !== undefined) updateData.operadoraAtual = operadoraAtual;
    if (svas !== undefined) updateData.svas = svas;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    const [updatedLine] = await db
      .update(ecommerceOrderLines)
      .set(updateData)
      .where(eq(ecommerceOrderLines.id, lineId))
      .returning();

    console.log(`✅ Linha atualizada: ${lineId}`);

    res.json(updatedLine);
  } catch (error: any) {
    console.error("Erro ao atualizar linha:", error);
    res.status(500).json({ error: "Erro ao atualizar linha" });
  }
});

/**
 * DELETE /api/ecommerce/order-lines/:lineId
 * Remove uma linha (apenas se status = inicial)
 */
router.delete("/:lineId", requireRole(["customer", "admin"]), async (req: Request, res: Response) => {
  try {
    const { lineId } = req.params;
    const user = req.user;

    // Buscar linha
    const [line] = await db
      .select({
        line: ecommerceOrderLines,
        order: ecommerceOrders,
      })
      .from(ecommerceOrderLines)
      .leftJoin(ecommerceOrders, eq(ecommerceOrderLines.orderId, ecommerceOrders.id))
      .where(eq(ecommerceOrderLines.id, lineId))
      .limit(1);

    if (!line) {
      return res.status(404).json({ error: "Linha não encontrada" });
    }

    // Verificar permissão
    if (user?.role === "customer" && line.order?.clientId !== user.clientId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Cliente só pode deletar se status for "inicial"
    if (user?.role === "customer" && line.line.status !== "inicial") {
      return res.status(403).json({
        error: "Linha não pode ser removida",
        message: "Esta linha já entrou em processo operacional e não pode mais ser removida pelo cliente."
      });
    }

    // Deletar linha
    await db
      .delete(ecommerceOrderLines)
      .where(eq(ecommerceOrderLines.id, lineId));

    console.log(`🗑️ Linha removida: ${lineId}`);

    res.json({ success: true, message: "Linha removida com sucesso" });
  } catch (error: any) {
    console.error("Erro ao remover linha:", error);
    res.status(500).json({ error: "Erro ao remover linha" });
  }
});

export default router;
