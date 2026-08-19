const VentaService = require('../services/ventaService');
const { renderAdmin } = require('../utils/renderAdmin');
const { setFlash } = require('../utils/flash');

exports.list = async (req, res, next) => {
  try {
    const parsed = VentaService.parseFilters(req.query);
    if (parsed.error) {
      setFlash(req, 'error', parsed.error);
      return res.redirect('/admin/ventas');
    }

    const ventas = await VentaService.findAll(parsed);
    const summary = VentaService.buildSummary(ventas);

    await renderAdmin(res, 'pages/admin/ventas/index', {
      title: 'Ventas',
      page: 'admin-ventas',
      layoutWide: true,
      ventas,
      summary,
      filters: parsed,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const venta = await VentaService.findById(req.params.id);

    await renderAdmin(res, 'pages/admin/ventas/show', {
      title: `Venta ${venta.numero_pedido}`,
      page: 'admin-ventas',
      layoutForm: 'wide',
      venta,
    });
  } catch (err) {
    next(err);
  }
};
