import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fixDatabase() {
    console.log('🔧 Adicionando coluna origin...');

    try {
        // Adicionar coluna origin
        await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'system'
    `);
        console.log('✅ Coluna origin adicionada');

        // Atualizar registros existentes
        await pool.query(`
      UPDATE clients 
      SET origin = 'system' 
      WHERE origin IS NULL
    `);
        console.log('✅ Registros atualizados');

        // Inserir produtos de exemplo
        console.log('📝 Verificando produtos...');
        const checkProducts = await pool.query('SELECT COUNT(*) FROM ecommerce_products');
        const count = parseInt(checkProducts.rows[0].count);

        if (count === 0) {
            console.log('📝 Inserindo produtos de exemplo...');
            await pool.query(`
        INSERT INTO ecommerce_products (nome, descricao, categoria, operadora, preco, velocidade, tipo_cliente, ativo)
        VALUES
        ('Fibra Óptica 500MB', 'Internet de alta velocidade com 500MB', 'fibra', '3M', 9990, '500MB', 'PF', true),
        ('Fibra Óptica 300MB', 'Internet fibra com 300MB', 'fibra', '3M', 7990, '300MB', 'PF', true),
        ('Fibra Óptica 600MB', 'Internet ultra rápida 600MB', 'fibra', 'MIRAI', 12990, '600MB', 'PJ', true),
        ('Móvel 20GB', 'Plano móvel com 20GB de internet', 'movel', 'MIRAI', 4990, '20GB', 'PF', true),
        ('Office 365 Business', 'Pacote Office completo', 'office', '3M', 3990, NULL, 'PJ', true)
      `);
            console.log('✅ 5 produtos inseridos');
        } else {
            console.log(`ℹ️ Já existem ${count} produtos no banco`);
        }

        // Verificar produtos
        const products = await pool.query('SELECT id, nome, preco, categoria FROM ecommerce_products ORDER BY id');
        console.log('\n📦 Produtos disponíveis:');
        products.rows.forEach(p => {
            const precoFormatado = (p.preco / 100).toFixed(2);
            console.log(`  - [${p.id}] ${p.nome} - R$ ${precoFormatado} (${p.categoria})`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

fixDatabase();
