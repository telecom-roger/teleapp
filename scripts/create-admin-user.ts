import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import * as readline from "readline";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  const client = await pool.connect();

  try {
    console.log("🔐 Criação de Usuário Admin\n");

    // Verificar se já existe admin
    const existingAdmin = await client.query(
      "SELECT id, email FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (existingAdmin.rows.length > 0) {
      console.log("⚠️  Já existe um usuário admin:");
      console.log(`   Email: ${existingAdmin.rows[0].email}`);
      console.log(`   ID: ${existingAdmin.rows[0].id}\n`);
      
      const continuar = await question("Deseja criar outro admin mesmo assim? (s/n): ");
      if (continuar.toLowerCase() !== 's') {
        console.log("❌ Operação cancelada.");
        rl.close();
        await pool.end();
        return;
      }
      console.log("");
    }

    // Coletar dados do admin
    const nome = await question("Nome do admin: ");
    const email = await question("Email: ");
    const senha = await question("Senha (mínimo 6 caracteres): ");

    if (!nome || !email || !senha) {
      console.log("\n❌ Todos os campos são obrigatórios!");
      rl.close();
      await pool.end();
      return;
    }

    if (senha.length < 6) {
      console.log("\n❌ A senha deve ter no mínimo 6 caracteres!");
      rl.close();
      await pool.end();
      return;
    }

    // Verificar se email já existe
    const emailExists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailExists.rows.length > 0) {
      console.log("\n❌ Este email já está cadastrado!");
      rl.close();
      await pool.end();
      return;
    }

    console.log("\n🔄 Criando usuário admin...");

    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const result = await client.query(
      `INSERT INTO users (email, password, role, nome) 
       VALUES ($1, $2, 'admin', $3) 
       RETURNING id, email, nome, role`,
      [email, hashedPassword, nome]
    );

    const user = result.rows[0];

    console.log("\n✅ Usuário admin criado com sucesso!");
    console.log(`\n📋 Detalhes:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n🔑 Você pode fazer login com este email e senha.`);

  } catch (error: any) {
    console.error("\n❌ Erro ao criar usuário:", error.message);
  } finally {
    rl.close();
    await client.release();
    await pool.end();
  }
}

createAdminUser();
