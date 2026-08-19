const DashboardService = require('../services/dashboardService');
const { PEDIDO_ESTADOS, pedidoEstadoLabel } = require('../config/pedidoEstados');
const { renderAdmin } = require('../utils/renderAdmin');
const { safeScriptJson } = require('../utils/safeJson');

function readVentasQuery(query) {
  const desde = query.desde ? String(query.desde).trim() : null;
  const hasta = query.hasta ? String(query.hasta).trim() : null;
  return { ventasDesde: desde, ventasHasta: hasta };
}

exports.index = async (req, res, next) => {
  try {
    const dashboard = await DashboardService.getSummary(readVentasQuery(req.query));
    await renderAdmin(res, 'pages/admin/dashboard/index', {
      title: 'Dashboard',
      page: 'admin-dashboard',
      layoutWide: true,
      dashboard,
      dashboardJson: safeScriptJson(dashboard),
      pedidoEstados: PEDIDO_ESTADOS,
      pedidoEstadoLabel,
    });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const type = String(req.params.type || '').trim();
    const estado = req.query.estado ? String(req.query.estado).trim() : null;
    const detail = await DashboardService.getDetail(type, { estado });

    if (!detail) {
      return res.status(404).json({ ok: false, error: 'Detalle no encontrado' });
    }

    res.json({ ok: true, detail });
  } catch (err) {
    next(err);
  }
};

exports.data = async (req, res, next) => {
  try {
    const dashboard = await DashboardService.getSummary(readVentasQuery(req.query));
    res.json({ ok: true, dashboard });
  } catch (err) {
    next(err);
  }
};

exports.ventas = async (req, res, next) => {
  try {
    const { ventasDesde, ventasHasta } = readVentasQuery(req.query);
    const result = await DashboardService.getVentasChart(ventasDesde, ventasHasta);

    if (result.error) {
      return res.status(400).json({ ok: false, error: result.error, message: result.message });
    }

    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
