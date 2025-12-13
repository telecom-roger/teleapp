-- Adicionar ON DELETE SET NULL à foreign key de users.client_id
-- Isso permite deletar clientes sem quebrar a referência de usuários

-- 1. Remover a constraint existente
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_client_id_clients_id_fk;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_client_id_fkey;

-- 2. Adicionar nova constraint com ON DELETE SET NULL
ALTER TABLE users 
ADD CONSTRAINT users_client_id_clients_id_fk 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;
