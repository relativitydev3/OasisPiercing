-- Oasis Piercing — Tabla movimientos_caja (ejecutar en Neon si ya tienes la BD)
BEGIN;

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL,
  concepto VARCHAR(200) NOT NULL,
  monto NUMERIC(12, 2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  usuario_id UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT movimientos_caja_tipo_check CHECK (tipo IN ('gasto', 'ingreso')),
  CONSTRAINT movimientos_caja_monto_check CHECK (monto > 0)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_caja_fecha ON movimientos_caja (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tipo ON movimientos_caja (tipo);

COMMIT;
