require('dotenv/config');
const fs = require('fs');
const { Client } = require('pg');

const sql = fs.readFileSync('migrations/0010_add_product_categories_many_to_many.sql', 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => {
    console.log('📡 Conectado ao banco de dados');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅ Migration aplicada com sucesso!');
    console.log('✅ Tabela ecommerce_product_categories criada');
    console.log('✅ Dados existentes migrados');
    client.end();
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    console.error(err);
    client.end();
    process.exit(1);
  });
