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

    // Ler arquivo SQL
    const sqlPath = join(process.cwd(), 'migrations', '0002_multiplos_textos_upsell.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Executar migration
    await client.query(sql);

    console.log('✅ Migration executada com sucesso!\n');
    
    // Verificar resultado
    const result = await client.query(`
      SELECT 
        id, 
        nome, 
        categoria, 
        preco, 
        permite_calculadora_linhas as calculadora,
        array_length(textos_upsell, 1) as qtd_textos,
        array_length(svas_upsell, 1) as qtd_svas,
        textos_upsell[1] as exemplo_texto
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
        console.log(`   Textos Upsell: ${p.qtd_textos} texto(s)`);
        console.log(`   Exemplo: "${p.exemplo_texto?.substring(0, 60)}..."`);
      }
      if (p.qtd_svas > 0) {
        console.log(`   SVAs: ${p.qtd_svas} produto(s)`);
      }
      console.log('');
    });
    
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('⚠️  Coluna já existe, pulando...');
    } else {
      console.error('❌ Erro:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
