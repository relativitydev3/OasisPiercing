const DashboardService = require('../services/dashboardService');
const { PEDIDO_ESTADOS, pedidoEstadoLabel } = require('../config/pedidoEstados');
const { renderAdmin } = require('../utils/renderAdmin');
const { safeScriptJson } = require('../utils/safeJson');

exports.index = async (req, res, next) => {
  try {
    const dashboard = await DashboardService.getSummary();
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

exports.data = async (req, res, next) => {
  try {
    const dashboard = await DashboardService.getSummary();
    res.json({ ok: true, dashboard });
  } catch (err) {
    next(err);
  }
};
