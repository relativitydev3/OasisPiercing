-- Oasis Piercing — Tablas de ventas / pedidos
-- Ejecutar en Neon sobre la base de datos existente (no recrea productos ni categorías).

BEGIN;

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido VARCHAR(30) NOT NULL UNIQUE,
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100) NOT NULL,
  cliente_direccion TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  cliente_telefono VARCHAR(30),
  cliente_email VARCHAR(255),
  cliente_cc VARCHAR(10),
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pedidos_estado_check CHECK (
    estado IN ('pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado')
  ),
  CONSTRAINT pedidos_total_check CHECK (total >= 0)
);

-- Líneas del pedido (snapshot del producto al momento de la venta)
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  producto_nombre VARCHAR(150) NOT NULL,
  producto_codigo VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pedido_items_cantidad_check CHECK (cantidad > 0),
  CONSTRAINT pedido_items_precio_check CHECK (precio_unitario >= 0),
  CONSTRAINT pedido_items_subtotal_check CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id ON pedido_items (producto_id);

COMMIT;
