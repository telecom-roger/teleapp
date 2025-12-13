-- PASSO 3: Criar/Atualizar Vivo Controle 30GB
DO $$
DECLARE
  sva_ids text[];
  produto_existe boolean;
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
        'SMS à vontade',
        'WhatsApp sem consumir internet',
        'Instagram e TikTok liberados',
        'Portabilidade grátis'
      ]
    );
  END IF;
END $$;
