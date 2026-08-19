const { requireDb } = require('../utils/db');
const { PEDIDO_ESTADOS } = require('../config/pedidoEstados');
const { getCategoryImage } = require('../config/categoryImages');

const STOCK_BAJO_UMBRAL = 5;
const TOP_PRODUCTOS_DIAS = 30;
const VENTAS_CHART_DIAS = 7;
const VENTAS_CHART_MAX_DIAS = 90;
const DETAIL_LIMIT = 60;

function toNumber(value) {
  return Number(value) || 0;
}

function mapPedidoRow(row) {
  return {
    id: row.id,
    numero_pedido: row.numero_pedido,
    cliente_nombre: row.cliente_nombre,
    cliente_apellido: row.cliente_apellido,
    estado: row.estado,
    total: toNumber(row.total),
    total_items: toNumber(row.total_items),
    created_at: row.created_at,
  };
}

function mapProductoRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    stock: toNumber(row.stock),
    precio: toNumber(row.precio),
    activo: row.activo,
    imagen: row.imagen || null,
    tipo: row.tipo || null,
    material: row.material || null,
  };
}

function formatDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayAtMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildLastDays(count) {
  const today = todayAtMidnight();
  const desde = new Date(today);
  desde.setDate(today.getDate() - (count - 1));
  return buildDayRange(formatDayKey(desde), formatDayKey(today));
}

function buildDayRange(desdeKey, hastaKey) {
  const days = [];
  const cur = new Date(`${desdeKey}T12:00:00`);
  const end = new Date(`${hastaKey}T12:00:00`);
  while (cur <= end) {
    days.push(formatDayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function parseVentasRange(desdeStr, hastaStr) {
  const today = todayAtMidnight();
  const hastaDate = parseDateOnly(hastaStr) || today;
  let desdeDate = parseDateOnly(desdeStr);
  if (!desdeDate) {
    desdeDate = new Date(hastaDate);
    desdeDate.setDate(hastaDate.getDate() - (VENTAS_CHART_DIAS - 1));
  }

  if (desdeDate > hastaDate) {
    return { error: 'invalid_range', message: 'La fecha inicial no puede ser posterior a la final.' };
  }

  const dayCount = Math.round((hastaDate - desdeDate) / 86400000) + 1;
  if (dayCount > VENTAS_CHART_MAX_DIAS) {
    return {
      error: 'max_days',
      message: `El rango máximo es de ${VENTAS_CHART_MAX_DIAS} días.`,
    };
  }

  return {
    desde: formatDayKey(desdeDate),
    hasta: formatDayKey(hastaDate),
    dayCount,
  };
}

function formatVentasDayLabel(key, compact) {
  const d = new Date(`${key}T12:00:00`);
  if (compact) {
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
}

function mergeVentasPorDia(rows, dayKeys) {
  const compact = dayKeys.length > 14;
  const byDay = Object.fromEntries(rows.map((r) => [formatDayKey(new Date(r.day)), r]));
  return dayKeys.map((key) => {
    const row = byDay[key] || {};
    return {
      day: key,
      label: formatVentasDayLabel(key, compact),
      total: toNumber(row.total),
      orders: toNumber(row.orders),
    };
  });
}

async function fetchVentasChart(sql, range) {
  const ventasRows = await sql`
    SELECT DATE(created_at) AS day,
           COALESCE(SUM(total), 0) AS total,
           COUNT(*)::int AS orders
    FROM pedidos
    WHERE DATE(created_at) >= ${range.desde}::date
      AND DATE(created_at) <= ${range.hasta}::date
      AND estado != 'cancelado'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;

  const dayKeys = buildDayRange(range.desde, range.hasta);
  const ventasPorDia = mergeVentasPorDia(ventasRows, dayKeys);
  const ventasTotal = ventasPorDia.reduce((sum, d) => sum + d.total, 0);
  const ventasPedidos = ventasPorDia.reduce((sum, d) => sum + d.orders, 0);
  const maxVentasDia = Math.max(...ventasPorDia.map((d) => d.total), 1);

  return {
    ventasPorDia,
    maxVentasDia,
    meta: {
      ventasDesde: range.desde,
      ventasHasta: range.hasta,
      ventasChartDias: range.dayCount,
      ventasTotal,
      ventasPedidos,
    },
  };
}

class DashboardService {
  static parseVentasRange(desde, hasta) {
    return parseVentasRange(desde, hasta);
  }

  static async getVentasChart(desde, hasta) {
    const sql = requireDb();
    const range = parseVentasRange(desde, hasta);
    if (range.error) return range;
    return fetchVentasChart(sql, range);
  }

  static async getSummary(options = {}) {
    const sql = requireDb();
    const ventasRange = parseVentasRange(options.ventasDesde, options.ventasHasta);
    if (ventasRange.error) {
      const err = new Error(ventasRange.message);
      err.code = ventasRange.error;
      throw err;
    }

    const [summaryRows, estadoRows, ventasChart, recentRows, topRows, stockRows, categoriasRows] =
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
        fetchVentasChart(sql, ventasRange),
        sql`
          SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                 p.estado, p.total, p.created_at,
                 COUNT(pi.id)::int AS total_items
          FROM pedidos p
          LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
          WHERE p.estado != 'entregado'
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
          SELECT id, nombre, codigo, stock, precio, activo, imagen, tipo, material
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
    const { ventasPorDia, maxVentasDia } = ventasChart;

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
      stockBajo: stockRows.map(mapProductoRow),
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
        ventasChartDias: ventasChart.meta.ventasChartDias,
        ventasDesde: ventasChart.meta.ventasDesde,
        ventasHasta: ventasChart.meta.ventasHasta,
        ventasTotal: ventasChart.meta.ventasTotal,
        ventasPedidos: ventasChart.meta.ventasPedidos,
        ventasMaxDias: VENTAS_CHART_MAX_DIAS,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  static async getDetail(type, params = {}) {
    const sql = requireDb();

    switch (type) {
      case 'ingresos-mes': {
        const rows = await sql`
          SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                 p.estado, p.total, p.created_at,
                 COUNT(pi.id)::int AS total_items
          FROM pedidos p
          LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
          WHERE p.estado != 'cancelado'
            AND p.created_at >= date_trunc('month', CURRENT_TIMESTAMP)
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${DETAIL_LIMIT}
        `;
        const total = rows.reduce((s, r) => s + toNumber(r.total), 0);
        return {
          type,
          view: 'pedidos',
          title: 'Ingresos del mes',
          subtitle: `${rows.length} pedido${rows.length === 1 ? '' : 's'} · ${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`,
          items: rows.map(mapPedidoRow),
          linkAll: '/admin/pedidos',
        };
      }

      case 'pendientes':
      case 'pedidos-estado': {
        const estado = type === 'pendientes' ? 'pendiente' : params.estado;
        if (!estado || !PEDIDO_ESTADOS.some((e) => e.value === estado)) {
          return null;
        }
        const label = PEDIDO_ESTADOS.find((e) => e.value === estado)?.label || estado;
        const rows = await sql`
          SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                 p.estado, p.total, p.created_at,
                 COUNT(pi.id)::int AS total_items
          FROM pedidos p
          LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
          WHERE p.estado = ${estado}
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${DETAIL_LIMIT}
        `;
        return {
          type: type === 'pendientes' ? type : 'pedidos-estado',
          view: 'pedidos',
          title: type === 'pendientes' ? 'Pedidos pendientes' : `Pedidos — ${label}`,
          subtitle: `${rows.length} registro${rows.length === 1 ? '' : 's'}`,
          items: rows.map(mapPedidoRow),
          linkAll: '/admin/pedidos',
        };
      }

      case 'productos-activos': {
        const rows = await sql`
          SELECT id, nombre, codigo, stock, precio, activo, imagen, tipo, material
          FROM productos
          WHERE activo
          ORDER BY nombre ASC
          LIMIT ${DETAIL_LIMIT}
        `;
        const total = await sql`SELECT COUNT(*)::int AS c FROM productos WHERE activo`;
        return {
          type,
          view: 'productos',
          title: 'Productos activos',
          subtitle: `${total[0]?.c || rows.length} en catálogo${rows.length < (total[0]?.c || 0) ? ` · mostrando ${rows.length}` : ''}`,
          items: rows.map(mapProductoRow),
          linkAll: '/admin/productos',
        };
      }

      case 'stock-bajo': {
        const rows = await sql`
          SELECT id, nombre, codigo, stock, precio, activo, imagen, tipo, material
          FROM productos
          WHERE activo AND stock <= ${STOCK_BAJO_UMBRAL}
          ORDER BY stock ASC, nombre ASC
          LIMIT ${DETAIL_LIMIT}
        `;
        return {
          type,
          view: 'productos',
          title: 'Stock bajo',
          subtitle: `${rows.length} producto${rows.length === 1 ? '' : 's'} con ≤ ${STOCK_BAJO_UMBRAL} unidades`,
          items: rows.map(mapProductoRow),
          linkAll: '/admin/productos',
          alert: true,
        };
      }

      case 'ingresos-total':
      case 'pedidos': {
        const rows = await sql`
          SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                 p.estado, p.total, p.created_at,
                 COUNT(pi.id)::int AS total_items
          FROM pedidos p
          LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${DETAIL_LIMIT}
        `;
        const ingresos = await sql`
          SELECT COALESCE(SUM(total), 0) AS total
          FROM pedidos WHERE estado != 'cancelado'
        `;
        return {
          type,
          view: 'pedidos',
          title: type === 'ingresos-total' ? 'Ingresos totales' : 'Todos los pedidos',
          subtitle: type === 'ingresos-total'
            ? `Acumulado ${toNumber(ingresos[0]?.total).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} · ${rows.length} pedidos recientes`
            : `${rows.length} pedido${rows.length === 1 ? '' : 's'} recientes`,
          items: rows.map(mapPedidoRow),
          linkAll: '/admin/pedidos',
        };
      }

      case 'ticket-promedio': {
        const [statsRows, sampleRows] = await Promise.all([
          sql`
            SELECT
              COALESCE(AVG(total), 0) AS promedio,
              COALESCE(MIN(total), 0) AS minimo,
              COALESCE(MAX(total), 0) AS maximo,
              COUNT(*)::int AS total
            FROM pedidos
            WHERE estado != 'cancelado'
          `,
          sql`
            SELECT p.id, p.numero_pedido, p.cliente_nombre, p.cliente_apellido,
                   p.estado, p.total, p.created_at,
                   COUNT(pi.id)::int AS total_items
            FROM pedidos p
            LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
            WHERE p.estado != 'cancelado'
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 12
          `,
        ]);
        const st = statsRows[0] || {};
        return {
          type,
          view: 'ticket',
          title: 'Ticket promedio',
          subtitle: 'Basado en pedidos no cancelados',
          stats: {
            promedio: toNumber(st.promedio),
            minimo: toNumber(st.minimo),
            maximo: toNumber(st.maximo),
            total: toNumber(st.total),
          },
          items: sampleRows.map(mapPedidoRow),
          linkAll: '/admin/pedidos',
        };
      }

      case 'categorias': {
        const rows = await sql`
          SELECT c.id, c.nombre, c.slug, c.activo, c.descripcion,
                 COUNT(pc.producto_id)::int AS productos
          FROM categorias c
          LEFT JOIN producto_categorias pc ON pc.categoria_id = c.id
          LEFT JOIN productos p ON p.id = pc.producto_id AND p.activo
          WHERE c.activo
          GROUP BY c.id
          ORDER BY productos DESC, c.nombre ASC
        `;
        return {
          type,
          view: 'categorias',
          title: 'Categorías activas',
          subtitle: `${rows.length} categoría${rows.length === 1 ? '' : 's'}`,
          items: rows.map((row) => ({
            id: row.id,
            nombre: row.nombre,
            slug: row.slug,
            activo: row.activo,
            descripcion: row.descripcion,
            productos: toNumber(row.productos),
            imagen: getCategoryImage(row.slug),
          })),
          linkAll: '/admin/categorias',
        };
      }

      case 'usuarios': {
        const rows = await sql`
          SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.activo,
                 u.created_at, r.nombre AS rol_nombre
          FROM usuarios u
          JOIN roles r ON r.id = u.rol_id
          WHERE u.activo
          ORDER BY u.nombre ASC, u.apellido ASC
        `;
        return {
          type,
          view: 'usuarios',
          title: 'Usuarios activos',
          subtitle: `${rows.length} cuenta${rows.length === 1 ? '' : 's'}`,
          items: rows.map((row) => ({
            id: row.id,
            nombre: row.nombre,
            apellido: row.apellido,
            email: row.email,
            telefono: row.telefono,
            rol_nombre: row.rol_nombre,
            created_at: row.created_at,
          })),
          linkAll: '/admin/usuarios',
        };
      }

      default:
        return null;
    }
  }
}

module.exports = DashboardService;
module.exports.STOCK_BAJO_UMBRAL = STOCK_BAJO_UMBRAL;
module.exports.VENTAS_CHART_DIAS = VENTAS_CHART_DIAS;
module.exports.VENTAS_CHART_MAX_DIAS = VENTAS_CHART_MAX_DIAS;
