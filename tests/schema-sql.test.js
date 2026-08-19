const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SQL_DIR = path.join(__dirname, '..', 'sql');

/** Columnas que el código JS usa en consultas (validación estática del SQL). */
const REQUIRED = {
  roles: ['id', 'nombre'],
  usuarios: [
    'id', 'nombre', 'apellido', 'email', 'password_hash', 'telefono', 'cc', 'direccion',
    'rol_id', 'activo', 'email_verificado', 'created_at', 'updated_at',
  ],
  categorias: ['id', 'nombre', 'slug', 'descripcion', 'activo', 'created_at', 'updated_at'],
  productos: [
    'id', 'nombre', 'codigo', 'tipo', 'material', 'descripcion', 'precio',
    'imagen', 'stock', 'slug', 'activo', 'created_at', 'updated_at',
  ],
  producto_categorias: ['producto_id', 'categoria_id'],
  pedidos: [
    'id', 'numero_pedido', 'cliente_nombre', 'cliente_apellido',
    'cliente_direccion', 'usuario_id', 'estado', 'total', 'notas', 'created_at', 'updated_at',
  ],
  pedido_items: [
    'id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal',
    'producto_nombre', 'producto_codigo', 'created_at',
  ],
  session: ['sid', 'sess', 'expire'],
};

function readSql(name) {
  return fs.readFileSync(path.join(SQL_DIR, name), 'utf8');
}

function assertSchemaCovers(sqlText, label) {
  for (const [table, columns] of Object.entries(REQUIRED)) {
    assert.match(
      sqlText,
      new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`, 'i'),
      `${label}: falta CREATE TABLE ${table}`,
    );
    for (const col of columns) {
      assert.match(
        sqlText,
        new RegExp(`\\b${col}\\b`, 'i'),
        `${label}: tabla ${table} debería definir columna ${col}`,
      );
    }
  }
}

describe('schema SQL vs modelos', () => {
  it('install-completo.sql define todas las tablas y columnas usadas por la app', () => {
    assertSchemaCovers(readSql('install-completo.sql'), 'install-completo.sql');
  });

  it('base-schema + pedidos.sql cubren catálogo y pedidos', () => {
    const combined = `${readSql('base-schema.sql')}\n${readSql('pedidos.sql')}`;
    assertSchemaCovers(combined, 'base-schema + pedidos');
  });

  it('roles seed incluye ids 1 y 2 (roles.js)', () => {
    const sql = readSql('install-completo.sql');
    assert.match(sql, /\(1,\s*'cliente'\)/);
    assert.match(sql, /\(2,\s*'administrador'\)/);
  });

  it('pedidos_estado_check coincide con pedidoEstados.js', () => {
    const estados = [
      'pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado',
    ];
    const pedidosSql = readSql('pedidos.sql');
    for (const e of estados) {
      assert.match(pedidosSql, new RegExp(`'${e}'`), `pedidos.sql debe incluir estado ${e}`);
    }
  });
});
