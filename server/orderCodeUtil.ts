// Utilitário para gerar códigos amigáveis de pedido

export function generateOrderCode(length = 8): string {
  const chars = '23456789'; // Apenas números, sem 0 e 1 para evitar confusão
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
