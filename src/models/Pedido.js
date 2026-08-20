const { sql } = require('../config/database');

class Pedido {
  static toPublic(row) {
    if (!row) return null;

    let items = row.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }
    if (!Array.isArray(items)) items = [];

    return {
      id: row.id,
      numero_pedido: row.numero_pedido,
      cliente_nombre: row.cliente_nombre,
      cliente_apellido: row.cliente_apellido,
      cliente_direccion: row.cliente_direccion,
      cliente_telefono: row.cliente_telefono ?? null,
      cliente_email: row.cliente_email ?? null,
      cliente_cc: row.cliente_cc ?? null,
      usuario_id: row.usuario_id ?? null,
      usuario_email: row.usuario_email ?? null,
      estado: row.estado,
      total: row.total,
      notas: row.notas,
      total_items: row.total_items != null ? Number(row.total_items) : items.length,
      items,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async findAll() {
    const rows = await sql`
      SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
             p.cliente_direccion, p.cliente_telefono, p.cliente_email, p.cliente_cc,
             p.usuario_id, p.estado, p.total, p.notas,
             p.created_at, p.updated_at,
             COUNT(pi.id)::int AS total_items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map(Pedido.toPublic);
  }

  /** Pedidos visibles en el módulo Pedidos (sin entregados; esos van a Ventas). */
  static async findAllForAdmin() {
    const rows = await sql`
      SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
             p.cliente_direccion, p.cliente_telefono, p.cliente_email, p.cliente_cc,
             p.usuario_id, p.estado, p.total, p.notas,
             p.created_at, p.updated_at,
             COUNT(pi.id)::int AS total_items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      WHERE p.estado != 'entregado'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map(Pedido.toPublic);
  }

  static async findByUsuarioId(usuarioId) {
    const rows = await sql`
      SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
             p.cliente_direccion, p.cliente_telefono, p.cliente_email, p.cliente_cc,
             p.usuario_id, p.estado, p.total, p.notas,
             p.created_at, p.updated_at,
             COUNT(pi.id)::int AS total_items,
             (
               SELECT pr.imagen
               FROM pedido_items pi2
               JOIN productos pr ON pr.id = pi2.producto_id
               WHERE pi2.pedido_id = p.id
               ORDER BY pi2.created_at
               LIMIT 1
             ) AS preview_imagen
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      WHERE p.usuario_id = ${usuarioId}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map((row) => ({
      ...Pedido.toPublic(row),
      preview_imagen: row.preview_imagen ?? null,
    }));
  }

  static async countActivosByUsuarioId(usuarioId) {
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM pedidos
      WHERE usuario_id = ${usuarioId}
        AND estado NOT IN ('entregado', 'cancelado')
    `;
    return rows[0]?.count || 0;
  }

  static async findByIdForUsuario(id, usuarioId) {
    const rows = await sql`
      SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
             p.cliente_direccion, p.cliente_telefono, p.cliente_email, p.cliente_cc,
             p.usuario_id, p.estado, p.total, p.notas,
             p.created_at, p.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pi.id,
                   'producto_id', pi.producto_id,
                   'cantidad', pi.cantidad,
                   'precio_unitario', pi.precio_unitario,
                   'subtotal', pi.subtotal,
                   'producto_nombre', pi.producto_nombre,
                   'producto_codigo', pi.producto_codigo
                 )
                 ORDER BY pi.created_at
               ) FILTER (WHERE pi.id IS NOT NULL),
               '[]'
             ) AS items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      WHERE p.id = ${id} AND p.usuario_id = ${usuarioId}
      GROUP BY p.id
      LIMIT 1
    `;
    return Pedido.toPublic(rows[0]);
  }

  static async findById(id) {
    const rows = await sql`
      SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
             p.cliente_direccion, p.cliente_telefono, p.cliente_email, p.cliente_cc,
             p.usuario_id, p.estado, p.total, p.notas,
             p.created_at, p.updated_at,
             MAX(u.email) AS usuario_email,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pi.id,
                   'producto_id', pi.producto_id,
                   'cantidad', pi.cantidad,
                   'precio_unitario', pi.precio_unitario,
                   'subtotal', pi.subtotal,
                   'producto_nombre', pi.producto_nombre,
                   'producto_codigo', pi.producto_codigo
                 )
                 ORDER BY pi.created_at
               ) FILTER (WHERE pi.id IS NOT NULL),
               '[]'
             ) AS items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ${id}
      GROUP BY p.id
      LIMIT 1
    `;
    return Pedido.toPublic(rows[0]);
  }

  static async create(data) {
    const rows = await sql`
      INSERT INTO pedidos (
        numero_pedido, cliente_nombre, cliente_apellido, cliente_direccion,
        cliente_telefono, cliente_email, cliente_cc,
        usuario_id, estado, total, notas
      ) VALUES (
        ${data.numero_pedido},
        ${data.cliente_nombre},
        ${data.cliente_apellido},
        ${data.cliente_direccion},
        ${data.cliente_telefono ?? null},
        ${data.cliente_email ?? null},
        ${data.cliente_cc ?? null},
        ${data.usuario_id ?? null},
        ${data.estado},
        ${data.total},
        ${data.notas}
      )
      RETURNING id
    `;
    return rows[0].id;
  }

  static async update(id, data) {
    await sql`
      UPDATE pedidos SET
        cliente_nombre = ${data.cliente_nombre},
        cliente_apellido = ${data.cliente_apellido},
        cliente_direccion = ${data.cliente_direccion},
        cliente_telefono = ${data.cliente_telefono ?? null},
        cliente_email = ${data.cliente_email ?? null},
        cliente_cc = ${data.cliente_cc ?? null},
        usuario_id = ${data.usuario_id ?? null},
        estado = ${data.estado},
        total = ${data.total},
        notas = ${data.notas},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return Pedido.findById(id);
  }

  static async updateEstado(id, estado) {
    const rows = await sql`
      UPDATE pedidos SET estado = ${estado}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;
    if (!rows.length) return null;
    return Pedido.findById(id);
  }

  static async setItems(pedidoId, items) {
    await sql`DELETE FROM pedido_items WHERE pedido_id = ${pedidoId}`;

    for (const item of items) {
      await sql`
        INSERT INTO pedido_items (
          pedido_id, producto_id, cantidad, precio_unitario, subtotal,
          producto_nombre, producto_codigo
        ) VALUES (
          ${pedidoId},
          ${item.producto_id},
          ${item.cantidad},
          ${item.precio_unitario},
          ${item.subtotal},
          ${item.producto_nombre},
          ${item.producto_codigo}
        )
      `;
    }
  }

  static async delete(id) {
    const rows = await sql`
      DELETE FROM pedidos WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }
}

module.exports = Pedido;
