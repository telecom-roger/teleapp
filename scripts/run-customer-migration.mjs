import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'teleapp',
  user: 'roger',
  password: '123456',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Add clientId column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);
    `);
    console.log('✅ Coluna client_id adicionada');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
    `);
    console.log('✅ Índice idx_users_client_id criado');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log('✅ Índice idx_users_role criado');

    console.log('\n🎉 Migration concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

runMigration();
