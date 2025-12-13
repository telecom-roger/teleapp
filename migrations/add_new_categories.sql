-- Adicionar novas categorias de produtos
INSERT INTO ecommerce_categories (nome, slug, descricao, icone, cor, ativo, ordem) VALUES
  ('Combo Fibra + TV', 'combo', 'Pacotes completos de internet e TV por assinatura', 'Package', 'purple', TRUE, 4),
  ('Aparelhos', 'aparelhos', 'Smartphones, tablets e outros dispositivos', 'Smartphone', 'slate', TRUE, 5),
  ('Office 365', 'office', 'Licenças Microsoft 365 para empresas', 'Briefcase', 'blue', TRUE, 6),
  ('Internet Dedicada', 'internet-dedicada', 'Conexão dedicada com SLA para empresas', 'Globe', 'green', TRUE, 7),
  ('PABX Virtual', 'pabx', 'Telefonia corporativa em nuvem', 'Phone', 'orange', TRUE, 8),
  ('Locação de Equipamentos', 'locacao', 'Aluguel de modems, roteadores e equipamentos', 'Box', 'gray', TRUE, 9)
ON CONFLICT (slug) DO NOTHING;

-- Verificar categorias inseridas
SELECT id, nome, slug, icone, cor, ordem FROM ecommerce_categories ORDER BY ordem;
