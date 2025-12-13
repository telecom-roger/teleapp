// Sistema de emails MOCKADO para desenvolvimento
// Os emails são apenas logados no console

const MOCK_MODE = true;

interface EmailBoasVindas {
  nome: string;
  email: string;
  username: string;
  senha: string;
}

interface EmailPedidoRecebido {
  nome: string;
  email: string;
  pedidoId: number;
  produtos: Array<{ nome: string; quantidade: number }>;
  senhaAcesso?: string;
}

interface EmailStatusPedido {
  nome: string;
  email: string;
  pedidoId: number;
  novoStatus: string;
}

export async function enviarEmailBoasVindas(data: EmailBoasVindas): Promise<boolean> {
  console.log("\n📧 [MOCK EMAIL] Boas-vindas");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Para: ${data.email}`);
  console.log(`Nome: ${data.nome}`);
  console.log(`Usuário: ${data.username}`);
  console.log(`Senha: ${data.senha}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  return true;
}

export async function enviarEmailPedidoRecebido(data: EmailPedidoRecebido): Promise<boolean> {
  console.log("\n📧 [MOCK EMAIL] Pedido Recebido");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Para: ${data.email}`);
  console.log(`Nome: ${data.nome}`);
  console.log(`Pedido: #${data.pedidoId}`);
  console.log(`Produtos: ${data.produtos.map(p => `${p.nome} (${p.quantidade}x)`).join(", ")}`);
  if (data.senhaAcesso) {
    console.log(`\n🔑 CREDENCIAIS DE ACESSO:`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Senha: ${data.senhaAcesso}`);
    console.log(`   Acesse: http://localhost:5000/ecommerce/login`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  return true;
}

export async function enviarEmailStatusPedido(data: EmailStatusPedido): Promise<boolean> {
  console.log("\n📧 [MOCK EMAIL] Status Atualizado");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Para: ${data.email}`);
  console.log(`Nome: ${data.nome}`);
  console.log(`Pedido: #${data.pedidoId}`);
  console.log(`Novo Status: ${data.novoStatus}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  return true;
}

export function isEmailConfigured(): boolean {
  return true; // Sempre retorna true em modo mock
}
