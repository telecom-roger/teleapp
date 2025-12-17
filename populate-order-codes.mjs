import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function populateOrderCodes() {
  try {
    console.log('🔧 Populando order_code para pedidos antigos...\n');

    // Buscar pedidos sem orderCode
    const result = await pool.query(`
      SELECT id FROM ecommerce_orders WHERE order_code IS NULL
    `);

    console.log(`📊 Encontrados ${result.rows.length} pedidos sem order_code\n`);

    let updated = 0;
    for (const row of result.rows) {
      // Gerar código único de 8 dígitos
      const orderCode = Math.floor(10000000 + Math.random() * 89999999).toString();
      
      await pool.query(`
        UPDATE ecommerce_orders 
        SET order_code = $1 
        WHERE id = $2
      `, [orderCode, row.id]);
      
      updated++;
      console.log(`✅ Pedido ${row.id} → #${orderCode}`);
    }

    console.log(`\n✅ ${updated} pedidos atualizados com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

populateOrderCodes();
