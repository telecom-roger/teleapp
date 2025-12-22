import { Response } from "express";
import { db } from "./db";
import { notifications, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Store SSE connections por userId
const connections = new Map<string, Response[]>();

/**
 * Adiciona uma conexão SSE para um usuário
 */
export function addConnection(userId: string, res: Response) {
  if (!connections.has(userId)) {
    connections.set(userId, []);
  }
  connections.get(userId)!.push(res);

  // Cleanup quando conexão fecha
  res.on("close", () => {
    removeConnection(userId, res);
  });
}

/**
 * Remove uma conexão SSE
 */
export function removeConnection(userId: string, res: Response) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const index = userConnections.indexOf(res);
    if (index > -1) {
      userConnections.splice(index, 1);
    }
    if (userConnections.length === 0) {
      connections.delete(userId);
    }
  }
}

/**
 * Envia notificação em tempo real via SSE
 */
export function emitNotification(userId: string, notification: any) {
  const userConnections = connections.get(userId);
  if (userConnections && userConnections.length > 0) {
    const data = JSON.stringify(notification);
    userConnections.forEach((res) => {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error("Erro ao enviar SSE:", error);
      }
    });
  }
}

/**
 * Cria notificação no banco e emite em tempo real
 */
export async function createAndEmitNotification(data: {
  userId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  clientId?: string;
  fromUserId?: string;
  metadata?: any;
}) {
  try {
    // Criar notificação no banco
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        tipo: data.tipo,
        titulo: data.titulo,
        descricao: data.descricao,
        clientId: data.clientId,
        fromUserId: data.fromUserId,
        lida: false,
      })
      .returning();

    // Emitir via SSE com metadata adicional
    const notificationWithMetadata = {
      ...notification,
      ...(data.metadata || {}),
    };

    emitNotification(data.userId, notificationWithMetadata);

    return notification;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

/**
 * Notificação de mudança de etapa do pedido e-commerce
 */
export async function notifyOrderStageChange(
  clientUserId: string,
  orderId: string,
  etapaAnterior: string,
  etapaNova: string,
  adminUserId?: string
) {
  const etapasLabels: Record<string, string> = {
    novo_pedido: "Novo Pedido",
    aguardando_documentos: "Aguardando Documentos",
    em_analise: "Em Análise",
    aprovado: "Aprovado",
    em_instalacao: "Em Instalação",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const etapaLabel = etapasLabels[etapaNova] || etapaNova;

  await createAndEmitNotification({
    userId: clientUserId,
    tipo: "order_stage_change",
    titulo: "Status do Pedido Atualizado",
    descricao: `Seu pedido foi movido para: ${etapaLabel}`,
    fromUserId: adminUserId,
    metadata: {
      orderId,
      etapaAnterior,
      etapaNova,
      link: `/ecommerce/painel/pedidos/${orderId}`,
    },
  });
}

/**
 * Notificação de novo pedido criado (para admins)
 */
export async function notifyNewOrder(
  orderId: string,
  clientName: string,
  totalValue: number
) {
  // Buscar todos os admins
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  // Enviar notificação para cada admin
  for (const admin of admins) {
    await createAndEmitNotification({
      userId: admin.id,
      tipo: "new_order",
      titulo: "🛍️ Novo Pedido Recebido",
      descricao: `${clientName} fez um pedido de R$ ${(
        totalValue / 100
      ).toFixed(2)}`,
      metadata: {
        orderId,
        link: `/admin/app-pedidos`,
      },
    });
  }
}
