const Pedido = require('../models/Pedido');
const { requireDb } = require('../utils/db');
const { AppError } = require('../utils/errors');

const ESTADO_VENTA = 'entregado';

function parseDateOnly(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : str;
}

function parseFilters(query = {}) {
  const desde = parseDateOnly(query.desde);
  const hasta = parseDateOnly(query.hasta);
  if (desde && hasta && desde > hasta) {
    return { error: 'La fecha inicial no puede ser posterior a la final.' };
  }
  return { desde, hasta };
}

function toNumber(value) {
  return Number(value) || 0;
}

class VentaService {
  static parseFilters(query) {
    return parseFilters(query);
  }

  static async findAll(filters = {}) {
    const sql = requireDb();
    const { desde, hasta } = filters;

    let rows;
    if (desde && hasta) {
      rows = await sql`
        SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
               p.cliente_direccion, p.estado, p.total, p.notas,
               p.created_at, p.updated_at,
               COUNT(pi.id)::int AS total_items
        FROM pedidos p
        LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
        WHERE p.estado = ${ESTADO_VENTA}
          AND DATE(p.updated_at) >= ${desde}::date
          AND DATE(p.updated_at) <= ${hasta}::date
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `;
    } else if (desde) {
      rows = await sql`
        SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
               p.cliente_direccion, p.estado, p.total, p.notas,
               p.created_at, p.updated_at,
               COUNT(pi.id)::int AS total_items
        FROM pedidos p
        LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
        WHERE p.estado = ${ESTADO_VENTA}
          AND DATE(p.updated_at) >= ${desde}::date
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `;
    } else if (hasta) {
      rows = await sql`
        SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
               p.cliente_direccion, p.estado, p.total, p.notas,
               p.created_at, p.updated_at,
               COUNT(pi.id)::int AS total_items
        FROM pedidos p
        LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
        WHERE p.estado = ${ESTADO_VENTA}
          AND DATE(p.updated_at) <= ${hasta}::date
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `;
    } else {
      rows = await sql`
        SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
               p.cliente_direccion, p.estado, p.total, p.notas,
               p.created_at, p.updated_at,
               COUNT(pi.id)::int AS total_items
        FROM pedidos p
        LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
        WHERE p.estado = ${ESTADO_VENTA}
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `;
    }

    return rows.map(Pedido.toPublic);
  }

  static async findById(id) {
    requireDb();
    const pedido = await Pedido.findById(id);
    if (!pedido) throw new AppError('Venta no encontrada.', 404);
    if (pedido.estado !== ESTADO_VENTA) {
      throw new AppError('Este pedido aún no está entregado. Solo los pedidos entregados cuentan como venta.', 404);
    }
    return pedido;
  }

  static buildSummary(ventas) {
    const total = ventas.reduce((sum, v) => sum + toNumber(v.total), 0);
    const count = ventas.length;
    const unidades = ventas.reduce((sum, v) => sum + toNumber(v.total_items), 0);

    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const ventasMes = ventas.filter((v) => new Date(v.updated_at) >= mesInicio);
    const ingresosMes = ventasMes.reduce((sum, v) => sum + toNumber(v.total), 0);

    return {
      count,
      total,
      unidades,
      promedio: count ? total / count : 0,
      ingresosMes,
      ventasMes: ventasMes.length,
    };
  }
}

module.exports = VentaService;
module.exports.ESTADO_VENTA = ESTADO_VENTA;
