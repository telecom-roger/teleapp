/**
 * Textos randomizáveis para upsell
 */

const UPSELL_TEXTS = [
  "Pode ser útil para você: O serviço [nome_servico] está disponível para complementar seu plano por [preco].",
  "Serviço opcional: Caso queira, você pode adicionar [nome_servico] por [preco].",
  "Um complemento disponível: O [nome_servico] pode ser adicionado à sua contratação por [preco].",
  "Se fizer sentido para você: Adicione o serviço [nome_servico] por [preco] e complemente seu plano.",
  "Complemento para este plano: O serviço [nome_servico] está disponível por [preco].",
  "Clientes com este plano costumam adicionar [nome_servico] como um complemento opcional por [preco].",
  "Disponível para sua contratação: O serviço [nome_servico] pode ser incluído por [preco], se desejar.",
  "Você decide: O serviço [nome_servico] está disponível por [preco] e pode ser adicionado agora ou depois.",
  "Adicional opcional: [nome_servico] por [preco], caso queira ampliar sua contratação.",
  "Sugestão relacionada ao seu plano: O serviço [nome_servico] está disponível por [preco].",
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
