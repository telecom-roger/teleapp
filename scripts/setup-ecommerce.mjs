import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupEcommerce() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada no .env');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    console.log('📝 Adicionando coluna origin...');
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'system'`;
    await sql`UPDATE clients SET origin = 'system' WHERE origin IS NULL`;
    
    console.log('📝 Verificando produtos existentes...');
    const existing = await sql`SELECT COUNT(*) as count FROM ecommerce_products`;
    
    if (existing[0].count === '0') {
      console.log('📝 Inserindo produtos de exemplo...');
      await sql`
        INSERT INTO ecommerce_products (nome, descricao, categoria, operadora, velocidade, preco, tipo_pessoa, ativo)
        VALUES
          ('Fibra 500MB + TV', 'Internet de 500 Mbps + TV com 100 canais', 'combo', 'V', '500 Mbps', 12900, 'PF', true),
          ('Fibra 300MB Residencial', 'Internet Fibra Óptica 300 Mbps', 'fibra', 'V', '300 Mbps', 8900, 'PF', true),
          ('Fibra 600MB Empresarial', 'Internet Fibra Óptica 600 Mbps para empresas', 'fibra', 'C', '600 Mbps', 24900, 'PJ', true),
          ('Móvel 20GB', 'Plano móvel com 20GB de internet', 'movel', 'T', '4G/5G', 4990, 'PF', true),
          ('Office 365 Business', 'Pacote Office completo na nuvem', 'office', 'C', 'Cloud', 5900, 'PJ', true)
      `;
    } else {
      console.log(`ℹ️  Já existem ${existing[0].count} produtos cadastrados`);
    }
    
    console.log('✅ Setup concluído com sucesso!');
    console.log('\n📊 Produtos cadastrados:');
    
    const produtos = await sql`SELECT id, nome, preco/100.0 as preco_reais, tipo_pessoa FROM ecommerce_products`;
    console.table(produtos);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

setupEcommerce();
