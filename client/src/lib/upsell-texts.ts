/**
 * Textos randomizáveis para upsell
 */

const UPSELL_TEXTS = [
  "Você decide. O serviço [nome_servico] pode ser adicionado a este pedido por [preco]/mês, se fizer sentido para você.",
  "Serviço opcional disponível: [nome_servico] por [preco]/mês. Pode ser removido a qualquer momento.",
  "Baseado no seu pedido, [nome_servico] está disponível por [preco]/mês. Decisão totalmente sua.",
  "Caso seja útil, o serviço [nome_servico] pode ser incluído por [preco]/mês.",
  "Considere [nome_servico] para complementar seu plano ([preco]/mês). Sem obrigatoriedade.",
  "Você pode incluir [nome_servico] neste pedido por [preco]/mês. Totalmente opcional.",
  "Disponível se precisar: [nome_servico] por [preco]/mês. Pode ser adicionado ou removido depois.",
  "Serviço adicional: [nome_servico] por [preco]/mês. Analise se faz sentido para seu caso.",
  "Opcional para seu plano: [nome_servico] ([preco]/mês). Você escolhe.",
  "[nome_servico] está disponível por [preco]/mês. Você pode adicionar agora ou não utilizar.",
];

/**
 * Seleciona texto aleatório e substitui variáveis
 */
export function getRandomUpsellText(nomeServico: string, preco: string): string {
  const randomIndex = Math.floor(Math.random() * UPSELL_TEXTS.length);
  const template = UPSELL_TEXTS[randomIndex];
  
  return template
    .replace(/\[nome_servico\]/g, nomeServico)
    .replace(/\[preco\]/g, preco);
}

/**
 * Formata preço para exibição
 */
export function formatUpsellPrice(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}
