-- Script para inicializar etapas padrão do Kanban E-commerce
-- Execute este script manualmente no banco de dados

INSERT INTO ecommerce_stages (titulo, descricao, ordem, cor) VALUES
('Novo Pedido', 'Pedido recebido, aguardando processamento', 1, 'blue'),
('Dados Recebidos', 'Dados do cliente confirmados', 2, 'cyan'),
('Documentos Pendentes', 'Aguardando envio de documentos', 3, 'amber'),
('Em Análise', 'Pedido em análise pela equipe', 4, 'purple'),
('Pronto para Contrato', 'Análise aprovada, pronto para contrato', 5, 'indigo'),
('Contrato Enviado', 'Contrato enviado para assinatura', 6, 'violet'),
('Instalando', 'Instalação/Ativação em andamento', 7, 'orange'),
('Concluído', 'Pedido finalizado com sucesso', 8, 'green'),
('Cancelado', 'Pedido cancelado', 9, 'red')
ON CONFLICT DO NOTHING;
