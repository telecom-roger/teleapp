const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log("🚀 Iniciando migração: add_viewed_at_fields...");

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, "migrations/add_viewed_at_fields.sql"),
            "utf8"
        );

        await pool.query(migrationSQL);

        console.log("✅ Migração executada com sucesso!");
        console.log("✅ Campos adicionados:");
        console.log("   - last_viewed_at (timestamp)");
        console.log("   - last_viewed_by_admin_at (timestamp)");
        console.log("✅ Índices criados para melhor performance");
    } catch (error) {
        console.error("❌ Erro ao executar migração:", error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
