import pg from "pg";
import bcrypt from "bcryptjs";
const { Client } = pg;

const client = new Client({
  host: "localhost",
  port: 5433,
  user: "roger",
  password: "123456",
  database: "teleapp",
});

async function createTestCustomer() {
  try {
    await client.connect();
    console.log("✅ Conectado ao banco");

    // Buscar um cliente existente
    const clientResult = await client.query(
      "SELECT id, nome, cnpj, email FROM clients WHERE email IS NOT NULL LIMIT 1"
    );

    if (clientResult.rows.length === 0) {
      console.log("❌ Nenhum cliente encontrado. Criando cliente de teste...");
      
      // Criar cliente de teste
      const newClient = await client.query(
        `INSERT INTO clients (id, nome, cnpj, email, celular, created_at, updated_at)
         VALUES (gen_random_uuid(), 'Cliente Teste', '12345678901234', 'cliente@teste.com', '19999999999', NOW(), NOW())
         RETURNING id, nome, cnpj, email`
      );
      
      console.log("✅ Cliente criado:", newClient.rows[0]);
      var testClient = newClient.rows[0];
    } else {
      var testClient = clientResult.rows[0];
      console.log("✅ Cliente encontrado:", testClient);
    }

    // Verificar se já existe usuário para este cliente
    const existingUser = await client.query(
      "SELECT id, email, role FROM users WHERE client_id = $1",
      [testClient.id]
    );

    if (existingUser.rows.length > 0) {
      console.log("⚠️ Usuário já existe:", existingUser.rows[0]);
      console.log("\n📋 Credenciais para teste:");
      console.log("CNPJ:", testClient.cnpj);
      console.log("Email:", testClient.email);
      console.log("Senha: senha123");
      console.log("\n🔗 Acesse: http://localhost:5000/ecommerce/login");
      await client.end();
      return;
    }

    // Criar usuário customer
    const hashedPassword = await bcrypt.hash("senha123", 10);
    
    const userResult = await client.query(
      `INSERT INTO users (id, email, password_hash, role, client_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'customer', $3, NOW())
       RETURNING id, email, role`,
      [testClient.email, hashedPassword, testClient.id]
    );

    console.log("✅ Usuário customer criado:", userResult.rows[0]);
    console.log("\n📋 Credenciais para teste:");
    console.log("CNPJ:", testClient.cnpj);
    console.log("Email:", testClient.email);
    console.log("Senha: senha123");
    console.log("\n🔗 Acesse: http://localhost:5000/ecommerce/login");

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await client.end();
  }
}

createTestCustomer();
