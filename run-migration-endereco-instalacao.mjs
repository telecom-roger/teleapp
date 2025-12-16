import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const db = drizzle(pool);

  try {
    console.log("🚀 Executando migration: adicionar campo precisa_endereco_instalacao...");

    // Adicionar coluna
    await db.execute(sql`
      ALTER TABLE ecommerce_products 
      ADD COLUMN IF NOT EXISTS precisa_endereco_instalacao BOOLEAN DEFAULT false
    `);
    console.log("✅ Coluna precisa_endereco_instalacao adicionada");

    // Atualizar produtos existentes
    await db.execute(sql`
      UPDATE ecommerce_products 
      SET precisa_endereco_instalacao = true 
      WHERE categoria IN ('fibra', 'banda larga', 'link dedicado', 'internet-dedicada')
        OR LOWER(categoria) LIKE '%fibra%'
        OR LOWER(categoria) LIKE '%banda larga%'
        OR LOWER(categoria) LIKE '%link dedicado%'
    `);
    console.log("✅ Produtos de instalação atualizados");

    console.log("✨ Migration concluída com sucesso!");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar migration:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
