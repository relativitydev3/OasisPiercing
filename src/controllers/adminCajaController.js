const CajaService = require('../services/cajaService');
const { validateMovimientoForm } = require('../validations/caja.validation');
const { CAJA_TIPOS } = require('../config/cajaTipos');
const { setFlash, setFormErrors } = require('../utils/flash');
const { renderAdmin } = require('../utils/renderAdmin');
const { AppError } = require('../utils/errors');

function mesQueryRedirect(mes) {
  return mes ? `/admin/caja?mes=${encodeURIComponent(mes)}` : '/admin/caja';
}

exports.index = async (req, res, next) => {
  try {
    const resumen = await CajaService.getResumen(req.query.mes);

    await renderAdmin(res, 'pages/admin/caja/index', {
      title: 'Caja',
      page: 'admin-caja',
      layoutWide: true,
      resumen,
      cajaTipos: CAJA_TIPOS,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const mes = req.query.mes || '';
    await renderAdmin(res, 'pages/admin/caja/form', {
      title: 'Registrar movimiento',
      page: 'admin-caja',
      layoutForm: true,
      mode: 'create',
      movimiento: null,
      mes,
      cajaTipos: CAJA_TIPOS,
      defaultFecha: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const mes = req.query.mes || req.body.mes || '';
    const validation = validateMovimientoForm(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      const mesParam = mes || validation.data?.fecha?.slice(0, 7) || '';
      return res.redirect(`/admin/caja/nuevo${mesParam ? `?mes=${encodeURIComponent(mesParam)}` : ''}`);
    }

    await CajaService.create(validation.data, req.session.user?.id);
    setFlash(req, 'success', 'Movimiento registrado correctamente.');
    res.redirect(mesQueryRedirect(mes));
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const movimiento = await CajaService.findById(req.params.id);
    const mes = req.query.mes || '';

    await renderAdmin(res, 'pages/admin/caja/show', {
      title: 'Ver movimiento',
      page: 'admin-caja',
      layoutWide: true,
      movimiento,
      mes,
      cajaTipos: CAJA_TIPOS,
    });
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const movimiento = await CajaService.findById(req.params.id);
    const mes = req.query.mes || '';

    await renderAdmin(res, 'pages/admin/caja/form', {
      title: 'Editar movimiento',
      page: 'admin-caja',
      layoutForm: true,
      mode: 'edit',
      movimiento,
      mes,
      cajaTipos: CAJA_TIPOS,
      defaultFecha: movimiento.fecha,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const mes = req.query.mes || req.body.mes || '';
    const validation = validateMovimientoForm(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect(`/admin/caja/${req.params.id}/editar?mes=${encodeURIComponent(mes)}`);
    }

    await CajaService.update(req.params.id, validation.data);
    setFlash(req, 'success', 'Movimiento actualizado.');
    res.redirect(mesQueryRedirect(mes));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const mes = req.query.mes || req.body.mes || '';
    const movimiento = await CajaService.findById(req.params.id);
    await CajaService.delete(req.params.id);
    setFlash(req, 'success', 'Movimiento eliminado.');
    res.redirect(mesQueryRedirect(mes));
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      setFlash(req, 'error', err.message);
      return res.redirect(mesQueryRedirect(req.query.mes));
    }
    next(err);
  }
};
