-- PASSO 2: Criar produtos SVA
INSERT INTO ecommerce_products (nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa)
SELECT 'Backup em Nuvem 100GB', 'Backup automático com sincronização em tempo real. Seus arquivos protegidos onde você estiver.', 'sva', 1990, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Backup em Nuvem 100GB');

INSERT INTO ecommerce_products (nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa)
SELECT 'Antivírus Premium', 'Proteção completa contra vírus, malware e ameaças online. Navegação segura garantida.', 'sva', 990, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Antivírus Premium');

INSERT INTO ecommerce_products (nome, descricao, categoria, preco, ativo, operadora, tipo_pessoa)
SELECT 'Seguro de Aparelho', 'Seguro contra roubo, furto e danos acidentais. Fique tranquilo com seu aparelho protegido.', 'sva', 2490, true, 'V', 'ambos'
WHERE NOT EXISTS (SELECT 1 FROM ecommerce_products WHERE nome = 'Seguro de Aparelho');
