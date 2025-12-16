const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgres://roger:123456@localhost:5433/teleapp'
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    console.log('🚀 Executando migration: adicionar tabela ecommerce_order_lines...');

    const migrationPath = path.join(__dirname, 'migrations', '0021_add_order_lines.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Tabela ecommerce_order_lines criada');
    console.log('🔗 Índices criados para melhor performance');

    await client.end();
    console.log('👋 Conexão encerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
