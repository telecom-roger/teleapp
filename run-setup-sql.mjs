import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  console.log('📦 Criando tabelas do e-commerce...');
  
  try {
    const sql = fs.readFileSync('./create-ecommerce-tables.sql', 'utf-8');
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar produtos
    const { rows } = await pool.query('SELECT id, nome, preco FROM ecommerce_products ORDER BY id');
    console.log(`\n📦 ${rows.length} produtos disponíveis:`);
    rows.forEach(p => {
      const precoFormatado = (p.preco / 100).toFixed(2);
      console.log(`  - ${p.nome} - R$ ${precoFormatado}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();
