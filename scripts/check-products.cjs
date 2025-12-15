const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT 
        nome,
        categoria,
        preco,
        permite_calculadora_linhas as calc,
        array_length(textos_upsell, 1) as textos,
        array_length(svas_upsell, 1) as svas,
        textos_upsell[1] as exemplo_texto
      FROM ecommerce_products 
      WHERE nome LIKE '%Vivo%Controle%' OR categoria='sva'
      ORDER BY categoria, nome
    `);

        console.log('\n📦 PRODUTOS ENCONTRADOS:\n');
        result.rows.forEach(p => {
            console.log(`  ${p.nome} (${p.categoria})`);
            console.log(`  Preço: R$ ${(p.preco / 100).toFixed(2)}`);
            console.log(`  Calculadora: ${p.calc ? '✅ SIM' : '❌ NÃO'}`);
            if (p.textos > 0) {
                console.log(`  ✅ ${p.textos} texto(s) de upsell`);
                console.log(`  Exemplo: "${p.exemplo_texto.substring(0, 60)}..."`);
            }
            if (p.svas > 0) {
                console.log(`  ✅ ${p.svas} SVA(s) configurado(s)`);
            }
            console.log('');
        });
    } finally {
        client.release();
        await pool.end();
    }
})();
