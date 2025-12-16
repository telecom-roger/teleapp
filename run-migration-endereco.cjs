const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgres://roger:123456@localhost:5433/teleapp'
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    console.log('🚀 Executando migration: adicionar campo precisa_endereco_instalacao...');

    // Adicionar coluna
    await client.query(`
      ALTER TABLE ecommerce_products 
      ADD COLUMN IF NOT EXISTS precisa_endereco_instalacao BOOLEAN DEFAULT false
    `);
    console.log('✅ Coluna precisa_endereco_instalacao adicionada');

    // Atualizar produtos existentes
    const result = await client.query(`
      UPDATE ecommerce_products 
      SET precisa_endereco_instalacao = true 
      WHERE categoria IN ('fibra', 'banda larga', 'link dedicado', 'internet-dedicada')
        OR LOWER(categoria) LIKE '%fibra%'
        OR LOWER(categoria) LIKE '%banda larga%'
        OR LOWER(categoria) LIKE '%link dedicado%'
    `);
    console.log(`✅ ${result.rowCount} produtos de instalação atualizados`);

    console.log('✨ Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
