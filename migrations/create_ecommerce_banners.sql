-- Migration: Create ecommerce_banners table
-- Created: 2025-01-13

CREATE TABLE IF NOT EXISTS ecommerce_banners (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT NOT NULL,
  imagem_mobile_url TEXT,
  pagina VARCHAR(50) NOT NULL,
  posicao VARCHAR(50) DEFAULT 'topo',
  link_destino TEXT,
  link_texto VARCHAR(100),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ecommerce_banners_pagina ON ecommerce_banners(pagina);
CREATE INDEX idx_ecommerce_banners_ativo ON ecommerce_banners(ativo);
CREATE INDEX idx_ecommerce_banners_ordem ON ecommerce_banners(ordem);

-- Inserir banner exemplo para a home
INSERT INTO ecommerce_banners (titulo, subtitulo, imagem_url, pagina, posicao, ordem, ativo)
VALUES (
  'Compare e Escolha o Plano Perfeito',
  'Os melhores planos de telecomunicações em minutos',
  '',
  'home',
  'topo',
  0,
  true
);
