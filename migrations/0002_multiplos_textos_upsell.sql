-- Migration: Adicionar múltiplos textos de upsell e criar produto de teste
-- Data: 2025-12-13

-- 1. Remover coluna antiga texto_upsell (text) e adicionar textos_upsell (text[])
ALTER TABLE ecommerce_products DROP COLUMN IF EXISTS texto_upsell;
ALTER TABLE ecommerce_products ADD COLUMN IF NOT EXISTS textos_upsell text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN ecommerce_products.textos_upsell IS 'Array de textos de upsell. Sistema escolhe um aleatoriamente. Aceita variáveis: [nome_servico], [preco]';

-- 2. Criar produtos SVA de teste (apenas se não existirem)
INSERT INTO ecommerce_products (
  nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa
)
SELECT 'Backup em Nuvem 100GB', 'Backup automático com sincronização em tempo real. Seus arquivos protegidos onde você estiver.', 'sva', 1990, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Backup em Nuvem 100GB');

INSERT INTO ecommerce_products (
  nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa
)
SELECT 'Antivírus Premium', 'Proteção completa contra vírus, malware e ameaças online. Navegação segura garantida.', 'sva', 990, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Antivírus Premium');

INSERT INTO ecommerce_products (
  nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa
)
SELECT 'Seguro de Aparelho', 'Seguro contra roubo, furto e danos acidentais. Fique tranquilo com seu aparelho protegido.', 'sva', 2490, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Seguro de Aparelho');

-- 3. Criar produto Vivo Controle com calculadora e upsell
DO $$
DECLARE
  sva_ids text[];
  produto_existe boolean;
  produto_id_existente text;
BEGIN
  -- Buscar IDs dos SVAs
  SELECT ARRAY_AGG(id) INTO sva_ids
  FROM ecommerce_products 
  WHERE categoria = 'sva' AND nome IN ('Backup em Nuvem 100GB', 'Antivírus Premium', 'Seguro de Aparelho');
  
  -- Verificar se produto já existe
  SELECT EXISTS(SELECT 1 FROM ecommerce_products WHERE nome = 'Plano Vivo Controle 30GB') INTO produto_existe;
  
  IF produto_existe THEN
    -- Atualizar produto existente
    UPDATE ecommerce_products SET
      permite_calculadora_linhas = true,
      textos_upsell = ARRAY[
        'Proteja seu celular e seus dados! Adicione [nome_servico] por apenas [preco].',
        'Inclua [nome_servico] agora por só [preco] e fique mais seguro!',
        'Não perca essa oportunidade: [nome_servico] por [preco]/mês!',
        'Recomendado: adicione [nome_servico] por apenas [preco].'
      ],
      svas_upsell = sva_ids,
      franquia = '30 GB',
      linhas_inclusas = 1,
      fidelidade = 12,
      beneficios = ARRAY[
        'Ligações ilimitadas',
        'SMS à vontade',
        'WhatsApp sem consumir internet',
        'Instagram e TikTok liberados',
        'Portabilidade grátis'
      ]
    WHERE nome = 'Plano Vivo Controle 30GB';
  ELSE
    -- Criar novo produto
    INSERT INTO ecommerce_products (
      nome, 
      descricao, 
      categoria, 
      preco, 
      ativo, 
      operadora, 
      tipo_pessoa,
      permite_calculadora_linhas, 
      textos_upsell, 
      svas_upsell,
      franquia,
      linhas_inclusas,
      fidelidade,
      beneficios
    ) VALUES (
      'Plano Vivo Controle 30GB',
      'Ligações ilimitadas, SMS à vontade, WhatsApp, Instagram e TikTok sem consumir franquia',
      'movel',
      5990,
      true,
      'V',
      'ambos',
      true,
      ARRAY[
        'Proteja seu celular e seus dados! Adicione [nome_servico] por apenas [preco].',
        'Inclua [nome_servico] agora por só [preco] e fique mais seguro!',
        'Não perca essa oportunidade: [nome_servico] por [preco]/mês!',
        'Recomendado: adicione [nome_servico] por apenas [preco].'
      ],
      sva_ids,
      '30 GB',
      1,
      12,
      ARRAY[
        'Ligações ilimitadas',
DO $$
DECLARE
  produto_existe boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM ecommerce_products WHERE nome = 'Vivo Fibra 500MB') INTO produto_existe;
  
  IF NOT produto_existe THEN
    INSERT INTO ecommerce_products (
      nome, 
      descricao, 
      categoria, 
      preco, 
      ativo, 
      operadora, 
      tipo_pessoa,
      permite_calculadora_linhas,
      velocidade,
      beneficios
    ) VALUES (
      'Vivo Fibra 500MB',
      'Internet ultra rápida com WiFi 6 incluso. Ideal para streaming em 4K e home office.',
      'fibra',
      9990,
      true,
      'V',
      'ambos',
      false,
      '500 Mbps',
      ARRAY[
        'WiFi 6 incluso',
        'Instalação grátis',
        'Velocidade ultra rápida',
        'Suporte 24/7',
        'App Vivo Fibra'
      ]
    );
  END IF;
END $$
ON CONFLICT (nome) DO UPDATE SET
  permite_calculadora_linhas = false,
  velocidade = '500 Mbps',
  beneficios = ARRAY[
    'WiFi 6 incluso',
    'Instalação grátis',
    'Velocidade ultra rápida',
    'Suporte 24/7',
    'App Vivo Fibra'
  ];

-- 5. Verificar produtos criados
SELECT 
  id, 
  nome, 
  categoria, 
  preco, 
  permite_calculadora_linhas,
  array_length(textos_upsell, 1) as qtd_textos,
  array_length(svas_upsell, 1) as qtd_svas
FROM ecommerce_products 
WHERE ativo = true 
ORDER BY categoria, nome;
