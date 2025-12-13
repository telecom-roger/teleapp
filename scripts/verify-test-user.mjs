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

async function verifyTestUser() {
  try {
    await client.connect();
    console.log("✅ Conectado ao banco\n");

    // Buscar cliente de teste
    const clientResult = await client.query(
      "SELECT id, nome, cnpj, email FROM clients WHERE email = $1 OR cnpj = $2",
      ["cliente@teste.com", "12345678901234"]
    );

    if (clientResult.rows.length === 0) {
      console.log("❌ Nenhum cliente encontrado");
      console.log("\n🔧 Criando cliente de teste...\n");
      
      const newClient = await client.query(
        `INSERT INTO clients (id, nome, cnpj, email, celular, created_at, updated_at)
         VALUES (gen_random_uuid(), 'Cliente Teste', '12345678901234', 'cliente@teste.com', '19999999999', NOW(), NOW())
         RETURNING *`
      );
      
      console.log("✅ Cliente criado:", newClient.rows[0]);
      var testClient = newClient.rows[0];
    } else {
      var testClient = clientResult.rows[0];
      console.log("✅ Cliente encontrado:");
      console.log("   ID:", testClient.id);
      console.log("   Nome:", testClient.nome);
      console.log("   CNPJ:", testClient.cnpj);
      console.log("   Email:", testClient.email);
    }

    console.log("\n---\n");

    // Buscar usuário vinculado
    const userResult = await client.query(
      "SELECT id, email, role, client_id, password_hash FROM users WHERE email = $1",
      ["cliente@teste.com"]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ Nenhum usuário encontrado");
      console.log("\n🔧 Criando usuário customer...\n");
      
      const hashedPassword = await bcrypt.hash("senha123", 10);
      
      const newUser = await client.query(
        `INSERT INTO users (id, email, password_hash, role, client_id, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'customer', $3, NOW())
         RETURNING id, email, role, client_id`,
        ["cliente@teste.com", hashedPassword, testClient.id]
      );
      
      console.log("✅ Usuário criado:", newUser.rows[0]);
      var testUser = newUser.rows[0];
    } else {
      var testUser = userResult.rows[0];
      console.log("✅ Usuário encontrado:");
      console.log("   ID:", testUser.id);
      console.log("   Email:", testUser.email);
      console.log("   Role:", testUser.role);
      console.log("   Client ID:", testUser.client_id);
      
      // Verificar se a senha está correta
      const validPassword = await bcrypt.compare("senha123", testUser.password_hash);
      console.log("   Senha válida:", validPassword ? "✅ SIM" : "❌ NÃO");
      
      if (!validPassword) {
        console.log("\n🔧 Atualizando senha...\n");
        const hashedPassword = await bcrypt.hash("senha123", 10);
        await client.query(
          "UPDATE users SET password_hash = $1 WHERE id = $2",
          [hashedPassword, testUser.id]
        );
        console.log("✅ Senha atualizada!");
      }
      
      // Verificar se tem client_id
      if (!testUser.client_id) {
        console.log("\n🔧 Vinculando ao cliente...\n");
        await client.query(
          "UPDATE users SET client_id = $1 WHERE id = $2",
          [testClient.id, testUser.id]
        );
        console.log("✅ Usuário vinculado ao cliente!");
      }
      
      // Verificar se é customer
      if (testUser.role !== "customer") {
        console.log("\n🔧 Atualizando role para customer...\n");
        await client.query(
          "UPDATE users SET role = 'customer' WHERE id = $1",
          [testUser.id]
        );
        console.log("✅ Role atualizada!");
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📋 CREDENCIAIS PARA TESTE:");
    console.log("=".repeat(50));
    console.log("Email:    cliente@teste.com");
    console.log("CNPJ:     12.345.678/9012-34");
    console.log("Senha:    senha123");
    console.log("URL:      http://localhost:5000/ecommerce/login");
    console.log("=".repeat(50) + "\n");

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await client.end();
  }
}

verifyTestUser();
