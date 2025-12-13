require('dotenv').config();
const pg = require('pg');
const fs = require('fs');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = fs.readFileSync('migrations/create_ecommerce_categories.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migration executada com sucesso!');
    console.log('   - Tabela ecommerce_categories criada');
    console.log('   - 5 categorias padrão inseridas');
    console.log('   - Indexes criados');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro ao executar migration:', err.message);
    process.exit(1);
  });
