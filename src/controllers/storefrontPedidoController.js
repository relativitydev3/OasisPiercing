const PedidoService = require('../services/pedidoService');
const Producto = require('../models/Producto');
const { validateStorefrontOrder } = require('../validations/pedido.validation');
const { getSessionUser } = require('../utils/flash');

function buildStorefrontNotas({ origen, notas, telefono, sessionUser }) {
  const parts = [`Origen: ${origen === 'carrito' ? 'Carrito web' : 'WhatsApp producto'}`];

  if (sessionUser?.email) parts.push(`Email: ${sessionUser.email}`);
  if (telefono) parts.push(`Teléfono: ${telefono}`);
  if (sessionUser?.cc) parts.push(`CC: ${sessionUser.cc}`);
  if (notas) parts.push(notas);

  return parts.join('\n');
}

async function resolveStorefrontItems(rawItems) {
  const withId = rawItems.filter((item) => item.producto_id);
  const withSku = rawItems.filter((item) => !item.producto_id && item.sku);

  const skuList = [...new Set(withSku.map((item) => item.sku))];
  const productosBySku = new Map();

  if (skuList.length) {
    const rows = await Producto.findByCodigos(skuList);
    rows.forEach((row) => productosBySku.set(String(row.codigo).toLowerCase(), row));
  }

  return rawItems.map((item) => {
    if (item.producto_id) {
      return {
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
      };
    }

    const producto = productosBySku.get(String(item.sku).toLowerCase());
    if (!producto) {
      throw Object.assign(new Error(`Producto no encontrado: ${item.sku}`), { statusCode: 400 });
    }

    return {
      producto_id: producto.id,
      cantidad: Number(item.cantidad),
    };
  });
}

exports.create = async (req, res, next) => {
  try {
    const validation = validateStorefrontOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, errors: validation.errors });
    }

    const sessionUser = getSessionUser(req);
    const resolvedItems = await resolveStorefrontItems(validation.rawItems);

    const pedido = await PedidoService.create(
      {
        cliente_nombre: validation.cliente.cliente_nombre,
        cliente_apellido: validation.cliente.cliente_apellido,
        cliente_direccion: validation.cliente.cliente_direccion,
        usuario_id: sessionUser?.id ?? null,
        estado: 'pendiente',
        notas: buildStorefrontNotas({
          origen: validation.origen,
          notas: validation.notas,
          telefono: validation.cliente.cliente_telefono,
          sessionUser,
        }),
      },
      resolvedItems,
    );

    res.status(201).json({
      ok: true,
      pedido: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        total: pedido.total,
        estado: pedido.estado,
      },
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    next(err);
  }
};
