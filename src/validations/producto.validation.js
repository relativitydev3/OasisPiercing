const { hasValue } = require('./auth.validation');

function parseCategoriaIds(body) {
  const raw = body.categorias;
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).map(String).filter(Boolean);
}

function validateProductoForm(body, { isCreate, hasImage } = {}) {
  const errors = {};

  if (!hasValue(body.nombre)) {
    errors.nombre = 'El nombre es obligatorio.';
  } else if (body.nombre.trim().length > 150) {
    errors.nombre = 'El nombre es demasiado largo (máx. 150 caracteres).';
  }

  if (!hasValue(body.codigo)) {
    errors.codigo = 'El código es obligatorio.';
  } else if (body.codigo.trim().length > 50) {
    errors.codigo = 'El código es demasiado largo (máx. 50 caracteres).';
  }

  if (!hasValue(body.tipo)) {
    errors.tipo = 'El tipo es obligatorio.';
  } else if (body.tipo.trim().length > 80) {
    errors.tipo = 'El tipo es demasiado largo (máx. 80 caracteres).';
  }

  if (!hasValue(body.material)) {
    errors.material = 'El material es obligatorio.';
  } else if (body.material.trim().length > 80) {
    errors.material = 'El material es demasiado largo (máx. 80 caracteres).';
  }

  if (!hasValue(body.descripcion)) {
    errors.descripcion = 'La descripción es obligatoria.';
  } else if (body.descripcion.trim().length > 2000) {
    errors.descripcion = 'La descripción es demasiado larga (máx. 2000 caracteres).';
  }

  const precioRaw = String(body.precio ?? '').trim().replace(',', '.');
  if (!hasValue(precioRaw)) {
    errors.precio = 'El precio es obligatorio.';
  } else {
    const precio = Number(precioRaw);
    if (Number.isNaN(precio)) {
      errors.precio = 'El precio debe ser un número válido.';
    } else if (precio <= 0) {
      errors.precio = 'El precio debe ser mayor que cero.';
    }
  }

  const stockRaw = String(body.stock ?? '').trim();
  if (stockRaw === '') {
    errors.stock = 'El stock es obligatorio.';
  } else {
    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.stock = 'El stock debe ser un número entero mayor o igual a cero.';
    }
  }

  const categoriaIds = parseCategoriaIds(body);
  if (!categoriaIds.length) {
    errors.categorias = 'Selecciona al menos una categoría.';
  }

  if (isCreate && !hasImage) {
    errors.imagen = 'La imagen es obligatoria al crear un producto.';
  }

  const precio = Number(precioRaw.replace(',', '.'));
  const stock = Number(stockRaw);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    precio: Number.isNaN(precio) ? null : precio,
    stock: Number.isNaN(stock) ? null : stock,
    categoriaIds,
  };
}

module.exports = { validateProductoForm, parseCategoriaIds };
