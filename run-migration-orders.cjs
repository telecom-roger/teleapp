require('dotenv').config();
const fs = require('fs');
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = fs.readFileSync('migrations/add_ecommerce_orders_fields.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migration executada com sucesso!');
    console.log('   - Coluna taxa_instalacao adicionada');
    console.log('   - Coluna economia adicionada');
    console.log('   - Índice idx_ecommerce_orders_responsavel criado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro ao executar migration:', err.message);
    console.error(err);
    process.exit(1);
  });
