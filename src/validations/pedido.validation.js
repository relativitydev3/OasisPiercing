const { hasValue, validateDigits10 } = require('./auth.validation');
const { PEDIDO_ESTADO_VALUES } = require('../config/pedidoEstados');

function validatePedidoForm(body) {
  const errors = {};

  if (!hasValue(body.cliente_nombre)) {
    errors.cliente_nombre = 'El nombre es obligatorio.';
  } else if (body.cliente_nombre.trim().length > 100) {
    errors.cliente_nombre = 'El nombre es demasiado largo (máx. 100 caracteres).';
  }

  if (!hasValue(body.cliente_apellido)) {
    errors.cliente_apellido = 'El apellido es obligatorio.';
  } else if (body.cliente_apellido.trim().length > 100) {
    errors.cliente_apellido = 'El apellido es demasiado largo (máx. 100 caracteres).';
  }

  if (!hasValue(body.cliente_direccion)) {
    errors.cliente_direccion = 'La dirección es obligatoria.';
  } else if (body.cliente_direccion.trim().length > 500) {
    errors.cliente_direccion = 'La dirección es demasiado larga (máx. 500 caracteres).';
  }

  const telefono = body.cliente_telefono ? String(body.cliente_telefono).trim() : '';
  const telefonoError = validateDigits10(telefono, { required: false, fieldLabel: 'El teléfono' });
  if (telefonoError) errors.cliente_telefono = telefonoError;

  const email = body.cliente_email ? String(body.cliente_email).trim() : '';
  if (email && email.length > 255) {
    errors.cliente_email = 'El email es demasiado largo (máx. 255 caracteres).';
  }

  const cc = body.cliente_cc ? String(body.cliente_cc).trim() : '';
  const ccError = validateDigits10(cc, { required: false, fieldLabel: 'La cédula' });
  if (ccError) errors.cliente_cc = ccError;

  const usuarioId = body.usuario_id ? String(body.usuario_id).trim() : '';
  if (usuarioId && !/^[0-9a-f-]{36}$/i.test(usuarioId)) {
    errors.usuario_id = 'Cliente vinculado no válido.';
  }

  const estado = String(body.estado || '').trim();
  if (!hasValue(estado)) {
    errors.estado = 'Selecciona un estado.';
  } else if (!PEDIDO_ESTADO_VALUES.includes(estado)) {
    errors.estado = 'Estado no válido.';
  }

  const rawItems = parsePedidoItems(body);
  if (!rawItems.length) {
    errors.items = 'Agrega al menos un producto al pedido.';
  }

  const itemErrors = [];
  rawItems.forEach((item, index) => {
    const qty = Number(item.cantidad);
    if (!item.producto_id) {
      itemErrors[index] = 'Selecciona un producto.';
    } else if (!Number.isInteger(qty) || qty < 1) {
      itemErrors[index] = 'La cantidad debe ser un entero mayor a cero.';
    }
  });

  if (itemErrors.some(Boolean)) {
    errors.item_rows = itemErrors;
  }

  const notas = body.notas ? String(body.notas).trim() : '';
  if (notas.length > 1000) {
    errors.notas = 'Las notas son demasiado largas (máx. 1000 caracteres).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    estado,
    rawItems,
    notas,
    cliente_extra: {
      cliente_telefono: telefono || null,
      cliente_email: email || null,
      cliente_cc: cc || null,
      usuario_id: usuarioId || null,
    },
  };
}

function parsePedidoItems(body) {
  const productoIds = body.item_producto_id
    ?? body['item_producto_id[]']
    ?? body.items?.producto_id;
  const cantidades = body.item_cantidad
    ?? body['item_cantidad[]']
    ?? body.items?.cantidad;

  if (!productoIds) return [];

  const ids = Array.isArray(productoIds) ? productoIds : [productoIds];
  const qtys = Array.isArray(cantidades) ? cantidades : [cantidades];

  return ids.map((productoId, index) => ({
    producto_id: String(productoId || '').trim(),
    cantidad: String(qtys[index] ?? qtys[qtys.length - 1] ?? '1').trim(),
  })).filter((item) => item.producto_id);
}

function parseStorefrontItems(body) {
  const list = Array.isArray(body.items) ? body.items : [];
  return list.map((item) => ({
    producto_id: item.producto_id ? String(item.producto_id).trim() : '',
    sku: item.sku ? String(item.sku).trim() : '',
    cantidad: String(item.cantidad ?? 1).trim(),
  })).filter((item) => item.producto_id || item.sku);
}

function validateStorefrontOrder(body) {
  const errors = {};

  if (!hasValue(body.cliente_nombre)) {
    errors.cliente_nombre = 'El nombre es obligatorio.';
  } else if (body.cliente_nombre.trim().length > 100) {
    errors.cliente_nombre = 'El nombre es demasiado largo.';
  }

  const apellido = String(body.cliente_apellido || '').trim();
  if (!apellido) {
    errors.cliente_apellido = 'El apellido es obligatorio.';
  } else if (apellido.length > 100) {
    errors.cliente_apellido = 'El apellido es demasiado largo.';
  }

  if (!hasValue(body.cliente_direccion)) {
    errors.cliente_direccion = 'La dirección es obligatoria.';
  } else if (body.cliente_direccion.trim().length > 500) {
    errors.cliente_direccion = 'La dirección es demasiado larga.';
  }

  const telefonoError = validateDigits10(body.cliente_telefono, { required: true, fieldLabel: 'El teléfono' });
  if (telefonoError) errors.cliente_telefono = telefonoError;

  const rawItems = parseStorefrontItems(body);
  if (!rawItems.length) {
    errors.items = 'Agrega al menos un producto.';
  }

  rawItems.forEach((item, index) => {
    if (!item.producto_id && !item.sku) {
      errors[`items.${index}`] = 'Producto no válido.';
    }
    const qty = Number(item.cantidad);
    if (!Number.isInteger(qty) || qty < 1) {
      errors[`items.${index}`] = 'Cantidad inválida.';
    }
  });

  const origen = String(body.origen || 'tienda').trim();
  const allowedOrigen = ['carrito', 'whatsapp', 'tienda'];
  if (!allowedOrigen.includes(origen)) {
    errors.origen = 'Origen no válido.';
  }

  const notas = body.notas ? String(body.notas).trim() : '';
  if (notas.length > 1000) {
    errors.notas = 'Las notas son demasiado largas.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cliente: {
      cliente_nombre: body.cliente_nombre?.trim(),
      cliente_apellido: apellido,
      cliente_direccion: body.cliente_direccion?.trim(),
      cliente_telefono: body.cliente_telefono?.trim(),
    },
    rawItems,
    origen,
    notas,
  };
}

module.exports = {
  validatePedidoForm,
  parsePedidoItems,
  validateStorefrontOrder,
  parseStorefrontItems,
};
