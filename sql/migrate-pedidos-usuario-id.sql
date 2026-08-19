-- Oasis Piercing — Vincular pedidos con usuarios registrados
-- Ejecutar en Neon (o tu PostgreSQL) sobre la base existente.

BEGIN;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos (usuario_id);

COMMIT;
