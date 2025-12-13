const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'fix_users_client_fk_cascade.sql'),
      'utf8'
    );

    console.log('Executando migração para corrigir foreign key...');
    const result = await pool.query(sql);
    
    console.log('\n✅ Migração executada com sucesso!');
    console.log('\nResultado:');
    if (result.rows && result.rows.length > 0) {
      console.table(result.rows);
    }
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
