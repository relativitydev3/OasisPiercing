const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const { isPedidoEditable, PEDIDO_ESTADO_VALUES } = require('../config/pedidoEstados');
const { stripHtml } = require('../utils/sanitize');
const { requireDb } = require('../utils/db');
const { AppError } = require('../utils/errors');

function generateNumeroPedido() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OP-${y}${m}${d}-${rand}`;
}

class PedidoService {
  static async findAll() {
    requireDb();
    return Pedido.findAllForAdmin();
  }

  static async findById(id) {
    requireDb();
    const pedido = await Pedido.findById(id);
    if (!pedido) throw new AppError('Pedido no encontrado.', 404);
    return pedido;
  }

  static async findByUsuarioId(userId) {
    requireDb();
    if (!userId) return [];
    return Pedido.findByUsuarioId(userId);
  }

  static async countActivosByUsuarioId(userId) {
    requireDb();
    if (!userId) return 0;
    return Pedido.countActivosByUsuarioId(userId);
  }

  static async findByIdForUser(id, userId) {
    requireDb();
    const pedido = await Pedido.findByIdForUsuario(id, userId);
    if (!pedido) throw new AppError('Pedido no encontrado.', 404);
    return this.enrichItemsWithImages(pedido);
  }

  static async enrichItemsWithImages(pedido) {
    if (!pedido?.items?.length) return pedido;
    const ids = [...new Set(pedido.items.map((i) => i.producto_id).filter(Boolean))];
    if (!ids.length) return pedido;

    const productos = await Producto.findImagesByIds(ids);
    const byId = new Map(productos.map((p) => [String(p.id), p.imagen ?? null]));

    return {
      ...pedido,
      items: pedido.items.map((item) => ({
        ...item,
        producto_imagen: byId.get(String(item.producto_id)) || null,
      })),
    };
  }

  static sanitizeCliente(data) {
    return {
      cliente_nombre: stripHtml(data.cliente_nombre),
      cliente_apellido: stripHtml(data.cliente_apellido),
      cliente_direccion: stripHtml(data.cliente_direccion),
      cliente_telefono: data.cliente_telefono ? stripHtml(data.cliente_telefono) : null,
      cliente_email: data.cliente_email ? stripHtml(data.cliente_email) : null,
      cliente_cc: data.cliente_cc ? stripHtml(data.cliente_cc) : null,
      usuario_id: data.usuario_id || null,
      notas: data.notas ? stripHtml(data.notas) : null,
    };
  }

  static async resolveItems(rawItems) {
    const productoIds = [...new Set(rawItems.map((i) => i.producto_id))];
    const productos = await Producto.findByIds(productoIds);
    const byId = new Map(productos.map((p) => [String(p.id), p]));

    const items = [];
    for (const raw of rawItems) {
      const producto = byId.get(String(raw.producto_id));
      if (!producto) {
        throw new AppError('Uno o más productos seleccionados no existen.', 400);
      }
      if (!producto.activo) {
        throw new AppError(`El producto "${producto.nombre}" no está activo.`, 400);
      }

      const cantidad = Number(raw.cantidad);
      const precioUnitario = Number(producto.precio);
      items.push({
        producto_id: producto.id,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: cantidad * precioUnitario,
        producto_nombre: producto.nombre,
        producto_codigo: producto.codigo,
      });
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    return { items, total };
  }

  static async create(data, rawItems) {
    requireDb();
    const { items, total } = await this.resolveItems(rawItems);
    const clean = this.sanitizeCliente(data);

    const pedidoId = await Pedido.create({
      numero_pedido: generateNumeroPedido(),
      ...clean,
      estado: data.estado,
      total,
    });

    await Pedido.setItems(pedidoId, items);
    return Pedido.findById(pedidoId);
  }

  static async update(id, data, rawItems) {
    requireDb();
    const current = await Pedido.findById(id);
    if (!current) throw new AppError('Pedido no encontrado.', 404);
    if (!isPedidoEditable(current.estado)) {
      throw new AppError('No se puede editar un pedido entregado.', 403);
    }

    const { items, total } = await this.resolveItems(rawItems);
    const clean = this.sanitizeCliente(data);

    await Pedido.update(id, {
      ...clean,
      estado: data.estado,
      total,
    });
    await Pedido.setItems(id, items);
    return Pedido.findById(id);
  }

  static async delete(id) {
    requireDb();
    const current = await Pedido.findById(id);
    if (!current) throw new AppError('Pedido no encontrado.', 404);
    if (!isPedidoEditable(current.estado)) {
      throw new AppError('No se puede eliminar un pedido entregado.', 403);
    }
    await Pedido.delete(id);
    return true;
  }

  static async updateEstado(id, nuevoEstado) {
    requireDb();
    const current = await Pedido.findById(id);
    if (!current) throw new AppError('Pedido no encontrado.', 404);

    const estado = String(nuevoEstado || '').trim();
    if (!PEDIDO_ESTADO_VALUES.includes(estado)) {
      throw new AppError('Estado no válido.', 400);
    }

    const updated = await Pedido.updateEstado(id, estado);
    if (!updated) throw new AppError('Pedido no encontrado.', 404);
    return updated;
  }
}

module.exports = PedidoService;
