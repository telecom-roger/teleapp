import { db } from "./server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("🚀 Executando migration: adicionar tabela ecommerce_order_lines...");

    const migrationPath = path.join(__dirname, "migrations", "0021_add_order_lines.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    await db.execute(sql.raw(migrationSQL));

    console.log("✅ Migration executada com sucesso!");
    console.log("📋 Tabela ecommerce_order_lines criada");
    console.log("🔗 Índices criados para melhor performance");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar migration:", error);
    process.exit(1);
  }
}

runMigration();
