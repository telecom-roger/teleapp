// Teste rápido - inserir produto com diferenciais
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
    const client = await pool.connect();

    try {
        // Testar UPDATE com diferenciais
        const result = await client.query(`
      UPDATE ecommerce_products 
      SET 
        beneficios = ARRAY['WiFi 6 incluso', 'Instalação grátis', 'Suporte 24/7'],
        diferenciais = ARRAY['Garantia estendida', 'App exclusivo', 'Suporte prioritário', 'Upgrade gratuito']
      WHERE id = (SELECT id FROM ecommerce_products LIMIT 1)
      RETURNING id, nome, beneficios, diferenciais
    `);

        console.log('✅ Produto atualizado com sucesso!');
        console.log('\n📦 Dados:');
        console.log('Nome:', result.rows[0].nome);
        console.log('Benefícios:', result.rows[0].beneficios);
        console.log('Diferenciais:', result.rows[0].diferenciais);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

test();
