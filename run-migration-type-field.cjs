const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log("🚀 Iniciando migração: add_type_field_to_clients...");

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, "migrations/add_type_field_to_clients.sql"),
            "utf8"
        );

        await pool.query(migrationSQL);

        console.log("✅ Migração executada com sucesso!");
        console.log("✅ Campo 'type' adicionado à tabela clients");
        console.log("✅ Registros existentes atualizados com tipo PF/PJ");
    } catch (error) {
        console.error("❌ Erro ao executar migração:", error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
