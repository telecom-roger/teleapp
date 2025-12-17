/**
 * Utilitário para formatação de status de pedidos
 */

export function formatOrderStatus(etapa: string): string {
  const statusMap: Record<string, string> = {
    novo_pedido: "Pedido Recebido",
    aguardando_dados_linhas: "Aguardando Dados das Linhas",
    em_analise: "Em Análise",
    ajuste_solicitado: "Ajuste Solicitado",
    aguardando_documentos: "Aguardando Documentos",
    validando_documentos: "Validando Documentos",
    contrato_enviado: "Contrato Enviado",
    contrato_assinado: "Contrato Assinado",
    analise_credito: "Análise de Crédito",
    aprovado: "Aprovado",
    em_andamento: "Em Andamento",
    concluido: "Concluído",
    cancelado: "Cancelado",
    reprovado: "Reprovado",
  };

  return statusMap[etapa] || formatSnakeCase(etapa);
}

/**
 * Formata string snake_case para Título com Espaços
 */
function formatSnakeCase(text: string): string {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
