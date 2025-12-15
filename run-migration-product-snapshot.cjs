require('dotenv').config();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Iniciando migração: Adicionar snapshot de produto aos itens do pedido...\n');

        const sqlPath = path.join(__dirname, 'migrations', 'add_product_snapshot_to_order_items.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migração executada com sucesso!\n');

        // Verificar alguns registros
        const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(product_nome) as com_nome
      FROM ecommerce_order_items
    `);

        console.log('📊 Status dos itens:');
        console.log(`   Total de itens: ${result.rows[0].total}`);
        console.log(`   Itens com nome: ${result.rows[0].com_nome}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao executar migração:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ Migração concluída!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Falha na migração:', error.message);
        process.exit(1);
    });
