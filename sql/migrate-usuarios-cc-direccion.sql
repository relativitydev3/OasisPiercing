-- Campos adicionales para registro de clientes (ejecutar en Neon SQL Editor)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cc VARCHAR(10);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Si ya creaste cc como VARCHAR(20), opcional:
-- ALTER TABLE usuarios ALTER COLUMN cc TYPE VARCHAR(10);
