const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv/config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Executando migration: múltiplos textos upsell...\n');

        // Passo 1: Schema
        console.log('1️⃣ Alterando schema...');
        const sql1 = readFileSync(join(process.cwd(), 'migrations', '0002_step1_schema.sql'), 'utf-8');
        await client.query(sql1);
        console.log('✅ Schema atualizado\n');

        // Passo 2: SVAs
        console.log('2️⃣ Criando produtos SVA...');
        const sql2 = readFileSync(join(process.cwd(), 'migrations', '0002_step2_svas.sql'), 'utf-8');
        await client.query(sql2);
        console.log('✅ SVAs criados\n');

        // Passo 3: Vivo Controle
        console.log('3️⃣ Criando/atualizando Vivo Controle 30GB...');
        const sql3 = readFileSync(join(process.cwd(), 'migrations', '0002_step3_vivo_controle.sql'), 'utf-8');
        await client.query(sql3);
        console.log('✅ Vivo Controle configurado\n');

        console.log('✅ Migration completada com sucesso!\n');

        // Verificar resultado
        const result = await client.query(`
      SELECT 
        id, 
        nome, 
        categoria, 
        preco, 
        permite_calculadora_linhas as calculadora,
        array_length(textos_upsell, 1) as qtd_textos,
        array_length(svas_upsell, 1) as qtd_svas
      FROM ecommerce_products 
      WHERE ativo = true 
      ORDER BY categoria, nome
      LIMIT 10
    `);

        console.log('=== PRODUTOS NO BANCO ===\n');
        result.rows.forEach(p => {
            console.log(`📦 ${p.nome}`);
            console.log(`   Categoria: ${p.categoria}`);
            console.log(`   Preço: R$ ${(p.preco / 100).toFixed(2)}`);
            console.log(`   Calculadora: ${p.calculadora ? '✅ SIM' : '❌ NÃO'}`);
            if (p.qtd_textos > 0) {
                console.log(`   ✅ ${p.qtd_textos} texto(s) de upsell`);
            }
            if (p.qtd_svas > 0) {
                console.log(`   ✅ ${p.qtd_svas} SVA(s) configurado(s)`);
            }
            console.log('');
        });

    } catch (error) {
        if (error.code === '42701') {
            console.log('⚠️  Coluna já existe, pulando...');
        } else if (error.code === '42P07') {
            console.log('⚠️  Objeto já existe, pulando...');
        } else {
            console.error('❌ Erro:', error.message);
            console.error('Código:', error.code);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
