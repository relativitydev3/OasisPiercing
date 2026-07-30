const Producto = require('../models/Producto');
const PedidoService = require('../services/pedidoService');
const { validatePedidoForm } = require('../validations/pedido.validation');
const { PEDIDO_ESTADOS, isPedidoEditable } = require('../config/pedidoEstados');
const { setFlash, setFormErrors } = require('../utils/flash');
const { renderAdmin } = require('../utils/renderAdmin');
const { requireDb } = require('../utils/db');

async function loadProductosForForm() {
  requireDb();
  return Producto.findAllForSelect();
}

function buildFormLocals(options) {
  return {
    pedidoEstados: PEDIDO_ESTADOS,
    ...options,
  };
}

exports.list = async (req, res, next) => {
  try {
    const pedidos = await PedidoService.findAll();
    await renderAdmin(res, 'pages/admin/pedidos/index', {
      title: 'Ventas',
      page: 'admin-pedidos',
      layoutWide: true,
      pedidos,
      pedidoEstados: PEDIDO_ESTADOS,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const productos = await loadProductosForForm();
    await renderAdmin(res, 'pages/admin/pedidos/form', buildFormLocals({
      title: 'Registrar venta',
      page: 'admin-pedidos',
      layoutForm: 'wide',
      mode: 'create',
      pedido: null,
      readOnly: false,
      productos,
    }));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const validation = validatePedidoForm(req.body);

    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/admin/pedidos/nuevo');
    }

    await PedidoService.create(
      {
        cliente_nombre: req.body.cliente_nombre.trim(),
        cliente_apellido: req.body.cliente_apellido.trim(),
        cliente_direccion: req.body.cliente_direccion.trim(),
        estado: validation.estado,
        notas: validation.notas,
      },
      validation.rawItems,
    );

    setFlash(req, 'success', 'Venta registrada correctamente.');
    res.redirect('/admin/pedidos');
  } catch (err) {
    if (err.statusCode === 400) {
      setFormErrors(req, { items: err.message }, req.body);
      return res.redirect('/admin/pedidos/nuevo');
    }
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const pedido = await PedidoService.findById(req.params.id);

    await renderAdmin(res, 'pages/admin/pedidos/show', buildFormLocals({
      title: `Pedido ${pedido.numero_pedido}`,
      page: 'admin-pedidos',
      layoutForm: 'wide',
      pedido,
      editable: isPedidoEditable(pedido.estado),
    }));
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const [pedido, productos] = await Promise.all([
      PedidoService.findById(req.params.id),
      loadProductosForForm(),
    ]);

    const readOnly = !isPedidoEditable(pedido.estado);

    await renderAdmin(res, 'pages/admin/pedidos/form', buildFormLocals({
      title: readOnly ? `Pedido ${pedido.numero_pedido}` : 'Editar venta',
      page: 'admin-pedidos',
      layoutForm: 'wide',
      mode: readOnly ? 'view' : 'edit',
      pedido,
      readOnly,
      productos,
    }));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const { id } = req.params;

  try {
    const current = await PedidoService.findById(id);
    if (!isPedidoEditable(current.estado)) {
      setFlash(req, 'error', 'No se puede editar un pedido entregado.');
      return res.redirect(`/admin/pedidos/${id}/editar`);
    }

    const validation = validatePedidoForm(req.body);

    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect(`/admin/pedidos/${id}/editar`);
    }

    await PedidoService.update(
      id,
      {
        cliente_nombre: req.body.cliente_nombre.trim(),
        cliente_apellido: req.body.cliente_apellido.trim(),
        cliente_direccion: req.body.cliente_direccion.trim(),
        estado: validation.estado,
        notas: validation.notas,
      },
      validation.rawItems,
    );

    setFlash(req, 'success', 'Pedido actualizado correctamente.');
    res.redirect('/admin/pedidos');
  } catch (err) {
    if (err.statusCode === 400 || err.statusCode === 403) {
      setFormErrors(req, { items: err.message }, req.body);
      return res.redirect(`/admin/pedidos/${id}/editar`);
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await PedidoService.delete(req.params.id);
    setFlash(req, 'success', 'Pedido eliminado correctamente.');
    res.redirect('/admin/pedidos');
  } catch (err) {
    if (err.statusCode === 403) {
      setFlash(req, 'error', err.message);
      return res.redirect('/admin/pedidos');
    }
    next(err);
  }
};
