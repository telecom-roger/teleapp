import { db } from "./server/db.ts";
import { sql } from "drizzle-orm";
import fs from "fs";

async function runMigration() {
  try {
    console.log("📦 Lendo arquivo de migração...");
    const migrationSQL = fs.readFileSync("./migrations/0025_add_pedido_linha_ddd.sql", "utf-8");
    
    console.log("🔧 Executando migração...");
    await db.execute(sql.raw(migrationSQL));
    
    console.log("✅ Migração executada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar migração:", error);
    process.exit(1);
  }
}

runMigration();
