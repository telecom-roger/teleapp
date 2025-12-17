import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addUpsellTracking() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração: adicionar campos de tracking de upsell...');

    // Adiciona as três colunas de tracking
    await client.query(`
      ALTER TABLE ecommerce_orders 
      ADD COLUMN IF NOT EXISTS upsells_offered text[] DEFAULT ARRAY[]::text[],
      ADD COLUMN IF NOT EXISTS upsells_accepted text[] DEFAULT ARRAY[]::text[],
      ADD COLUMN IF NOT EXISTS upsells_refused text[] DEFAULT ARRAY[]::text[]
    `);

    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Verifica se as colunas foram criadas
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ecommerce_orders' 
      AND column_name IN ('upsells_offered', 'upsells_accepted', 'upsells_refused')
    `);

    console.log('\n📋 Colunas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUpsellTracking();
