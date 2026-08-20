-- Oasis Piercing — Instalación completa en Neon (SQL Editor → neondb → Run)
-- Orden: esquema base → pedidos → (opcional) seed de demo
--
-- 1) Ejecuta TODO este archivo, o por partes:
--    sql/base-schema.sql
--    sql/pedidos.sql
--    sql/seed-categorias.sql   (opcional, catálogo demo)

-- ===================== BASE (roles, usuarios, catálogo, session) =====================

BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  id SMALLINT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, nombre) VALUES
  (1, 'cliente'),
  (2, 'administrador')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30),
  cc VARCHAR(10),
  direccion TEXT,
  rol_id SMALLINT NOT NULL REFERENCES roles (id),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_lower ON usuarios (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios (activo);

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  descripcion VARCHAR(500),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias (activo);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  material VARCHAR(80) NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC(12, 2) NOT NULL,
  imagen TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  slug VARCHAR(200) NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_precio_check CHECK (precio > 0),
  CONSTRAINT productos_stock_check CHECK (stock >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_codigo_lower ON productos (LOWER(codigo));
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos (created_at DESC);

CREATE TABLE IF NOT EXISTS producto_categorias (
  producto_id UUID NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias (id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_producto_categorias_categoria_id
  ON producto_categorias (categoria_id);

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

COMMIT;

-- ===================== PEDIDOS (admin ventas) =====================

BEGIN;

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido VARCHAR(30) NOT NULL UNIQUE,
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100) NOT NULL,
  cliente_direccion TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  cliente_telefono VARCHAR(30),
  cliente_email VARCHAR(255),
  cliente_cc VARCHAR(10),
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pedidos_estado_check CHECK (
    estado IN (
      'pendiente', 'confirmado', 'en_preparacion',
      'enviado', 'entregado', 'cancelado'
    )
  ),
  CONSTRAINT pedidos_total_check CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos (id) ON DELETE RESTRICT,
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

-- Después: ejecuta sql/seed-categorias.sql si quieres productos de ejemplo.
-- Admin: node scripts/hash-password.js "clave"  → INSERT en usuarios (rol_id = 2).
