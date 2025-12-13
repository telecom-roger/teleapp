import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addGbExtraColumn() {
  try {
    console.log("🔧 Adicionando coluna gb_extra...");

    await db.execute(sql`
      ALTER TABLE ecommerce_adicionais 
      ADD COLUMN IF NOT EXISTS gb_extra integer DEFAULT 0;
    `);

    console.log("✅ Coluna gb_extra adicionada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao adicionar coluna:", error);
    process.exit(1);
  }
}

addGbExtraColumn();
