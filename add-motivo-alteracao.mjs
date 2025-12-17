import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMotivoAlteracaoColumn() {
  try {
    console.log('🔄 Adicionando coluna motivo_alteracao...');
    console.log('📍 Database:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
    
    await pool.query(`
      ALTER TABLE ecommerce_orders 
      ADD COLUMN IF NOT EXISTS motivo_alteracao TEXT;
    `);
    
    console.log('✅ Coluna motivo_alteracao adicionada com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    await pool.end();
    process.exit(1);
  }
}

addMotivoAlteracaoColumn();
