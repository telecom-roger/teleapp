// Script para adicionar campo diferenciais aos produtos
const { Pool } = require('pg');
require('dotenv/config');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Executando migration: add_diferenciais_field.sql...\n');

        const sql = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add_diferenciais_field.sql'),
            'utf8'
        );

        await client.query(sql);

        console.log('✅ Campo "diferenciais" adicionado com sucesso!\n');

        // Verificar
        const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ecommerce_products' 
      AND column_name = 'diferenciais'
    `);

        if (result.rows.length > 0) {
            console.log('✅ Confirmado: Campo existe no banco');
            console.table(result.rows);
        }

    } catch (error) {
        console.error('❌ Erro ao executar migration:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
