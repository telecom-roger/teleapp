-- Migration: Add customer role support
-- Date: 2025-12-13

-- 1. Update role column to support customer
-- (role já existe, apenas garantir que aceita 'customer')

-- 2. Add clientId column to users (link para clients quando role=customer)
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- 3. Add index on role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Update existing users to have proper roles (if needed)
-- UPDATE users SET role = 'admin' WHERE role = 'manager';

COMMENT ON COLUMN users.role IS 'User role: admin (full access), agent (internal system), customer (ecommerce panel only)';
COMMENT ON COLUMN users.client_id IS 'Reference to clients table when role=customer';
