import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'teleapp',
    user: 'roger',
    password: '123456',
});

async function updateProducts() {
    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL');

        // Atualizar produtos existentes com operadora, categoria e tipoPessoa
        const updates = [
            { id: 1, operadora: 'V', categoria: 'fibra', tipoPessoa: 'PF', velocidade: '300 Mbps' },
            { id: 2, operadora: 'C', categoria: 'fibra', tipoPessoa: 'PF', velocidade: '500 Mbps' },
            { id: 3, operadora: 'T', categoria: 'fibra', tipoPessoa: 'ambos', velocidade: '1 Gbps' },
            { id: 4, operadora: 'V', categoria: 'movel', tipoPessoa: 'PF', franquia: '50 GB' },
            { id: 5, operadora: 'C', categoria: 'combo', tipoPessoa: 'PJ', velocidade: '600 Mbps' },
        ];

        for (const update of updates) {
            await client.query(
                `UPDATE ecommerce_products 
         SET operadora = $1, categoria = $2, tipo_pessoa = $3, velocidade = $4, franquia = $5
         WHERE id = (SELECT id FROM ecommerce_products ORDER BY created_at LIMIT 1 OFFSET $6)`,
                [update.operadora, update.categoria, update.tipoPessoa, update.velocidade || null, update.franquia || null, update.id - 1]
            );
        }

        console.log('✅ Produtos atualizados com operadora, categoria e tipoPessoa');

        // Adicionar mais produtos diversos
        const newProducts = [
            {
                nome: 'Fibra Residencial 200 Mega',
                descricao: 'Ideal para casa com até 4 dispositivos conectados',
                categoria: 'fibra',
                operadora: 'V',
                velocidade: '200 Mbps',
                preco: 9990,
                fidelidade: 12,
                beneficios: ['Wi-Fi 6 grátis', 'Instalação grátis', 'Suporte 24/7'],
                tipoPessoa: 'PF',
                destaque: false,
            },
            {
                nome: 'Fibra Gamer 1000 Mega',
                descricao: 'Ultra velocidade para jogos online e streaming',
                categoria: 'fibra',
                operadora: 'T',
                velocidade: '1 Gbps',
                preco: 19990,
                fidelidade: 12,
                beneficios: ['Ping baixo', 'IP fixo grátis', 'Wi-Fi 6E', 'Suporte gamer'],
                tipoPessoa: 'PF',
                destaque: true,
            },
            {
                nome: 'Móvel Controle 30GB',
                descricao: 'Internet + ligações ilimitadas',
                categoria: 'movel',
                operadora: 'C',
                franquia: '30 GB',
                preco: 5490,
                fidelidade: 0,
                beneficios: ['WhatsApp ilimitado', 'Redes sociais grátis', 'Ligações ilimitadas'],
                tipoPessoa: 'PF',
                destaque: false,
            },
            {
                nome: 'Empresarial 500 Mega',
                descricao: 'Solução para pequenas e médias empresas',
                categoria: 'office',
                operadora: 'V',
                velocidade: '500 Mbps',
                preco: 29990,
                fidelidade: 24,
                beneficios: ['IP fixo', 'SLA 99.9%', 'Suporte prioritário', 'Wi-Fi empresarial'],
                tipoPessoa: 'PJ',
                sla: 'SLA 99.9% com atendimento em até 4h',
                linhasInclusas: 5,
                valorPorLinhaAdicional: 2000,
                destaque: true,
            },
            {
                nome: 'Combo Fibra + TV 400 Mega',
                descricao: 'Internet + TV por assinatura',
                categoria: 'combo',
                operadora: 'C',
                velocidade: '400 Mbps',
                preco: 14990,
                fidelidade: 12,
                beneficios: ['120+ canais', 'Wi-Fi grátis', 'NOW grátis', 'Telecine Play'],
                tipoPessoa: 'ambos',
                destaque: false,
            },
            {
                nome: 'Empresarial Premium 1 Giga',
                descricao: 'Máxima performance para empresas',
                categoria: 'office',
                operadora: 'T',
                velocidade: '1 Gbps',
                preco: 49990,
                fidelidade: 24,
                beneficios: ['IP fixo', 'SLA 99.95%', 'Suporte dedicado 24/7', 'Backup 4G automático'],
                tipoPessoa: 'PJ',
                sla: 'SLA 99.95% com atendimento em até 2h',
                linhasInclusas: 10,
                valorPorLinhaAdicional: 1500,
                destaque: true,
            },
        ];

        for (const product of newProducts) {
            await client.query(
                `INSERT INTO ecommerce_products 
        (nome, descricao, categoria, operadora, velocidade, franquia, preco, fidelidade, beneficios, tipo_pessoa, sla, linhas_inclusas, valor_por_linha_adicional, destaque, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)`,
                [
                    product.nome,
                    product.descricao,
                    product.categoria,
                    product.operadora,
                    product.velocidade || null,
                    product.franquia || null,
                    product.preco,
                    product.fidelidade,
                    product.beneficios,
                    product.tipoPessoa,
                    product.sla || null,
                    product.linhasInclusas || 1,
                    product.valorPorLinhaAdicional || 0,
                    product.destaque,
                ]
            );
        }

        console.log('✅ Novos produtos adicionados');

        const result = await client.query('SELECT COUNT(*) FROM ecommerce_products WHERE ativo = true');
        console.log(`\n📦 Total de produtos ativos: ${result.rows[0].count}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await client.end();
    }
}

updateProducts();
