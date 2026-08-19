const { requireDb } = require('../utils/db');
const { PEDIDO_ESTADOS } = require('../config/pedidoEstados');

const STOCK_BAJO_UMBRAL = 5;
const TOP_PRODUCTOS_DIAS = 30;
const VENTAS_CHART_DIAS = 7;

function toNumber(value) {
  return Number(value) || 0;
}

function formatDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildLastDays(count) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(formatDayKey(d));
  }
  return days;
}

function mergeVentasPorDia(rows, dayKeys) {
  const byDay = Object.fromEntries(rows.map((r) => [formatDayKey(new Date(r.day)), r]));
  return dayKeys.map((key) => {
    const row = byDay[key] || {};
    const d = new Date(`${key}T12:00:00`);
    return {
      day: key,
      label: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      total: toNumber(row.total),
      orders: toNumber(row.orders),
    };
  });
}

class DashboardService {
  static async getSummary() {
    const sql = requireDb();

    const [summaryRows, estadoRows, ventasRows, recentRows, topRows, stockRows, categoriasRows] =
      await Promise.all([
        sql`
          SELECT
            (SELECT COUNT(*)::int FROM pedidos) AS total_pedidos,
            (SELECT COUNT(*)::int FROM pedidos WHERE estado = 'pendiente') AS pedidos_pendientes,
            (SELECT COUNT(*)::int FROM pedidos WHERE estado NOT IN ('entregado', 'cancelado')) AS pedidos_activos,
            (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado != 'cancelado') AS ingresos_total,
            (SELECT COALESCE(SUM(total), 0) FROM pedidos
              WHERE estado != 'cancelado'
                AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)) AS ingresos_mes,
            (SELECT COALESCE(AVG(total), 0) FROM pedidos WHERE estado != 'cancelado') AS ticket_promedio,
            (SELECT COUNT(*)::int FROM productos) AS total_productos,
            (SELECT COUNT(*)::int FROM productos WHERE activo) AS productos_activos,
            (SELECT COUNT(*)::int FROM productos WHERE activo AND stock <= ${STOCK_BAJO_UMBRAL}) AS stock_bajo_count,
            (SELECT COUNT(*)::int FROM categorias) AS total_categorias,
            (SELECT COUNT(*)::int FROM categorias WHERE activo) AS categorias_activas,
            (SELECT COUNT(*)::int FROM usuarios) AS total_usuarios,
            (SELECT COUNT(*)::int FROM usuarios WHERE activo) AS usuarios_activos,
            (SELECT COUNT(*)::int FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.activo AND r.nombre = 'administrador') AS admins_activos
        `,
        sql`
          SELECT estado, COUNT(*)::int AS count
          FROM pedidos
          GROUP BY estado
        `,
        sql`
          SELECT DATE(created_at) AS day,
                 COALESCE(SUM(total), 0) AS total,
                 COUNT(*)::int AS orders
          FROM pedidos
          WHERE created_at >= CURRENT_TIMESTAMP - (${VENTAS_CHART_DIAS} || ' days')::interval
            AND estado != 'cancelado'
          GROUP BY DATE(created_at)
          ORDER BY day ASC
        `,
        sql`
          SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                 p.estado, p.total, p.created_at,
                 COUNT(pi.id)::int AS total_items
          FROM pedidos p
          LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT 8
        `,
        sql`
          SELECT pi.producto_nombre AS nombre,
                 pi.producto_codigo AS codigo,
                 SUM(pi.cantidad)::int AS unidades,
                 COALESCE(SUM(pi.subtotal), 0) AS ingresos
          FROM pedido_items pi
          INNER JOIN pedidos p ON p.id = pi.pedido_id
          WHERE p.created_at >= CURRENT_TIMESTAMP - (${TOP_PRODUCTOS_DIAS} || ' days')::interval
            AND p.estado != 'cancelado'
          GROUP BY pi.producto_nombre, pi.producto_codigo
          ORDER BY unidades DESC, ingresos DESC
          LIMIT 5
        `,
        sql`
          SELECT id, nombre, codigo, stock, precio, activo
          FROM productos
          WHERE activo AND stock <= ${STOCK_BAJO_UMBRAL}
          ORDER BY stock ASC, nombre ASC
          LIMIT 6
        `,
        sql`
          SELECT c.id, c.nombre, c.slug, c.activo,
                 COUNT(pc.producto_id)::int AS productos
          FROM categorias c
          LEFT JOIN producto_categorias pc ON pc.categoria_id = c.id
          LEFT JOIN productos p ON p.id = pc.producto_id AND p.activo
          GROUP BY c.id
          ORDER BY productos DESC, c.nombre ASC
          LIMIT 6
        `,
      ]);

    const summary = summaryRows[0] || {};
    const dayKeys = buildLastDays(VENTAS_CHART_DIAS);
    const ventasPorDia = mergeVentasPorDia(ventasRows, dayKeys);

    const estadoMap = Object.fromEntries(
      PEDIDO_ESTADOS.map((e) => [e.value, { ...e, count: 0 }]),
    );
    estadoRows.forEach((row) => {
      if (estadoMap[row.estado]) {
        estadoMap[row.estado].count = toNumber(row.count);
      }
    });

    const pedidosPorEstado = PEDIDO_ESTADOS.map((e) => ({
      value: e.value,
      label: e.label,
      count: estadoMap[e.value]?.count || 0,
    }));

    const maxVentasDia = Math.max(...ventasPorDia.map((d) => d.total), 1);
    const maxEstado = Math.max(...pedidosPorEstado.map((e) => e.count), 1);

    return {
      summary: {
        totalPedidos: toNumber(summary.total_pedidos),
        pedidosPendientes: toNumber(summary.pedidos_pendientes),
        pedidosActivos: toNumber(summary.pedidos_activos),
        ingresosTotal: toNumber(summary.ingresos_total),
        ingresosMes: toNumber(summary.ingresos_mes),
        ticketPromedio: toNumber(summary.ticket_promedio),
        totalProductos: toNumber(summary.total_productos),
        productosActivos: toNumber(summary.productos_activos),
        stockBajoCount: toNumber(summary.stock_bajo_count),
        totalCategorias: toNumber(summary.total_categorias),
        categoriasActivas: toNumber(summary.categorias_activas),
        totalUsuarios: toNumber(summary.total_usuarios),
        usuariosActivos: toNumber(summary.usuarios_activos),
        adminsActivos: toNumber(summary.admins_activos),
      },
      pedidosPorEstado,
      ventasPorDia,
      maxVentasDia,
      maxEstado,
      pedidosRecientes: recentRows.map((row) => ({
        id: row.id,
        numero_pedido: row.numero_pedido,
        cliente_nombre: row.cliente_nombre,
        cliente_apellido: row.cliente_apellido,
        estado: row.estado,
        total: toNumber(row.total),
        total_items: toNumber(row.total_items),
        created_at: row.created_at,
      })),
      topProductos: topRows.map((row) => ({
        nombre: row.nombre,
        codigo: row.codigo,
        unidades: toNumber(row.unidades),
        ingresos: toNumber(row.ingresos),
      })),
      stockBajo: stockRows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        codigo: row.codigo,
        stock: toNumber(row.stock),
        precio: toNumber(row.precio),
        activo: row.activo,
      })),
      categoriasTop: categoriasRows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        slug: row.slug,
        activo: row.activo,
        productos: toNumber(row.productos),
      })),
      meta: {
        stockBajoUmbral: STOCK_BAJO_UMBRAL,
        topProductosDias: TOP_PRODUCTOS_DIAS,
        ventasChartDias: VENTAS_CHART_DIAS,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = DashboardService;
