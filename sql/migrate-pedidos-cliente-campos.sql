-- Oasis Piercing — Campos de cliente en pedidos (teléfono, email, CC, usuario)
-- Ejecutar en Neon sobre la base existente.

BEGIN;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cliente_telefono VARCHAR(30);

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cliente_cc VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos (usuario_id);

COMMIT;
