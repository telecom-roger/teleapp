import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log("🌱 Populando produtos de teste...\n");

    // 1. Criar produto SVA
    console.log("1️⃣ Criando produtos SVA...");
    await client.query(`
      INSERT INTO ecommerce_products (nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa)
      VALUES 
        ('Backup em Nuvem 100GB', 'Backup automático com sincronização em tempo real', 'sva', 1990, true, 'V', 'ambos'),
        ('Antivírus Premium', 'Proteção completa contra vírus e malware', 'sva', 990, true, 'V', 'ambos'),
        ('Seguro de Aparelho', 'Seguro contra roubo, furto e danos', 'sva', 2490, true, 'V', 'ambos')
      ON CONFLICT (nome) DO NOTHING
    `);
    console.log("✅ Produtos SVA criados\n");

    // 2. Buscar IDs dos SVAs criados
    const svasResult = await client.query(`
      SELECT id, nome FROM ecommerce_products WHERE categoria = 'sva'
    `);
    const svaIds = svasResult.rows.map((r) => r.id);
    console.log(
      "📦 SVAs disponíveis:",
      svasResult.rows.map((r) => `${r.nome} (${r.id})`).join(", ")
    );
    console.log("");

    // 3. Criar produto MÓVEL com calculadora e upsell
    console.log("2️⃣ Criando produto móvel com calculadora e upsell...");
    await client.query(
      `
      INSERT INTO ecommerce_products (
        nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa,
        permite_calculadora_linhas, texto_upsell, svas_upsell,
        velocidade_gb, linhas_inclusas
      )
      VALUES (
        'Plano Vivo Controle 30GB',
        'Ligações ilimitadas, SMS, WhatsApp, Instagram e TikTok à vontade',
        'movel',
        5990,
        true,
        'V',
        'ambos',
        true,
        'Proteja seu celular e seus dados! Adicione serviços de segurança:',
        $1,
        30,
        1
      )
      ON CONFLICT (nome) DO UPDATE SET
        permite_calculadora_linhas = true,
        texto_upsell = 'Proteja seu celular e seus dados! Adicione serviços de segurança:',
        svas_upsell = $1
    `,
      [svaIds]
    );
    console.log("✅ Produto móvel configurado\n");

    // 4. Criar produto FIBRA com calculadora
    console.log("3️⃣ Criando produto fibra com calculadora...");
    await client.query(`
      INSERT INTO ecommerce_products (
        nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa,
        permite_calculadora_linhas, velocidade_mb
      )
      VALUES (
        'Vivo Fibra 500MB',
        'Internet ultra rápida com WiFi 6 incluso',
        'fibra',
        9990,
        true,
        'V',
        'ambos',
        true,
        500
      )
      ON CONFLICT (nome) DO UPDATE SET
        permite_calculadora_linhas = true
    `);
    console.log("✅ Produto fibra configurado\n");

    // 5. Verificar resultado
    console.log("4️⃣ Verificando produtos criados...");
    const result = await client.query(`
      SELECT 
        id, nome, categoria, preco, 
        permite_calculadora_linhas as calculadora,
        texto_upsell,
        array_length(svas_upsell, 1) as qtd_svas
      FROM ecommerce_products 
      WHERE ativo = true 
      ORDER BY categoria, nome
    `);

    console.log("\n=== PRODUTOS NO BANCO ===");
    result.rows.forEach((p) => {
      console.log(`\n📦 ${p.nome}`);
      console.log(`   Categoria: ${p.categoria}`);
      console.log(`   Preço: R$ ${(p.preco / 100).toFixed(2)}`);
      console.log(`   Calculadora: ${p.calculadora ? "✅ SIM" : "❌ NÃO"}`);
      if (p.texto_upsell) {
        console.log(`   Texto Upsell: "${p.texto_upsell.substring(0, 50)}..."`);
      }
      if (p.qtd_svas > 0) {
        console.log(`   SVAs configurados: ${p.qtd_svas}`);
      }
    });

    console.log("\n✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
