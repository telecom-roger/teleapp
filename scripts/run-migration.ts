import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "migrations",
        "0001_add_calculadora_upsell_fields.sql"
      ),
      "utf-8"
    );

    console.log("Executando migration...");
    await pool.query(sql);
    console.log("✅ Migration executada com sucesso!");
  } catch (error: any) {
    if (error.code === "42701") {
      console.log("⚠️  Colunas já existem, pulando...");
    } else {
      console.error("❌ Erro ao executar migration:", error.message);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
