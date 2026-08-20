const PedidoService = require('../services/pedidoService');
const { PEDIDO_ESTADOS, pedidoEstadoLabel } = require('../config/pedidoEstados');
const { safeImageSrc, formatPrice } = require('../utils/storefrontFormat');

exports.list = async (req, res, next) => {
  try {
    const pedidos = await PedidoService.findByUsuarioId(req.session.user.id);
    res.render('pages/account/pedidos/index', {
      title: 'Mis pedidos',
      page: 'mis-pedidos',
      pedidos,
      pedidoEstados: PEDIDO_ESTADOS,
      pedidoEstadoLabel,
      safeImageSrc,
      formatPrice,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const pedido = await PedidoService.findByIdForUser(req.params.id, req.session.user.id);
    res.render('pages/account/pedidos/show', {
      title: `Pedido ${pedido.numero_pedido}`,
      page: 'mis-pedidos',
      pedido,
      pedidoEstados: PEDIDO_ESTADOS,
      pedidoEstadoLabel,
      safeImageSrc,
      formatPrice,
    });
  } catch (err) {
    next(err);
  }
};
