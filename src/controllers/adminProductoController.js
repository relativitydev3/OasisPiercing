const CategoriaService = require('../services/categoriaService');
const sharp = require('sharp');
const ProductoService = require('../services/productoService');
const { removeBackground } = require('../services/removeBgService');
const { enhanceImage } = require('../services/replicateImageService');
const { processProductoUpload, getUploadBuffer } = require('../utils/productImage');
const { validateProductoForm } = require('../validations/producto.validation');
const { setFlash, setFormErrors } = require('../utils/flash');
const { renderAdmin } = require('../utils/renderAdmin');
const { AppError } = require('../utils/errors');

function parseActivo(body, fallback = true) {
  if (typeof body.activo === 'undefined') return fallback;
  return body.activo === 'on' || body.activo === 'true' || body.activo === true;
}

function handleUploadError(req, redirectPath) {
  if (!req.uploadError) return false;
  setFormErrors(req, { imagen: req.uploadError }, req.body);
  return true;
}

async function processUpload(req) {
  if (!req.file) return;
  try {
    req.file = await processProductoUpload(req.file);
  } catch (err) {
    ProductoService.discardUploadedFile(req.file);
    req.file = undefined;
    console.error('[processUpload]', err?.message || err);
    req.uploadError = err.message || 'No se pudo optimizar la imagen.';
  }
}

exports.list = async (req, res, next) => {
  try {
    const productos = await ProductoService.findAll();
    await renderAdmin(res, 'pages/admin/productos/index', {
      title: 'Productos',
      page: 'admin-productos',
      layoutWide: true,
      productos,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const categorias = await CategoriaService.findAllForSelect();
    await renderAdmin(res, 'pages/admin/productos/form', {
      title: 'Nuevo producto',
      page: 'admin-productos',
      layoutForm: 'wide',
      mode: 'create',
      producto: null,
      categorias,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (handleUploadError(req)) {
      return res.redirect('/admin/productos/nuevo');
    }

    await processUpload(req);

    if (handleUploadError(req)) {
      return res.redirect('/admin/productos/nuevo');
    }

    const validation = validateProductoForm(req.body, {
      isCreate: true,
      hasImage: Boolean(req.file),
    });

    if (!validation.isValid) {
      ProductoService.discardUploadedFile(req.file);
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/admin/productos/nuevo');
    }

    const exists = await ProductoService.codigoExists(req.body.codigo);
    if (exists) {
      ProductoService.discardUploadedFile(req.file);
      setFormErrors(req, { codigo: 'Ya existe un producto con ese código.' }, req.body);
      return res.redirect('/admin/productos/nuevo');
    }

    const imagen = ProductoService.buildImagePath(req.file);

    await ProductoService.create(
      {
        nombre: req.body.nombre.trim(),
        codigo: req.body.codigo.trim(),
        tipo: req.body.tipo.trim(),
        material: req.body.material.trim(),
        descripcion: req.body.descripcion.trim(),
        precio: validation.precio,
        stock: validation.stock,
        imagen,
        activo: parseActivo(req.body),
      },
      validation.categoriaIds,
    );

    setFlash(req, 'success', 'Producto creado correctamente.');
    res.redirect('/admin/productos');
  } catch (err) {
    ProductoService.discardUploadedFile(req.file);
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const producto = await ProductoService.findById(req.params.id);
    await renderAdmin(res, 'pages/admin/productos/show', {
      title: producto.nombre,
      page: 'admin-productos',
      layoutForm: 'wide',
      producto,
    });
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const [producto, categorias] = await Promise.all([
      ProductoService.findById(req.params.id),
      CategoriaService.findAllForSelect(),
    ]);

    await renderAdmin(res, 'pages/admin/productos/form', {
      title: 'Editar producto',
      page: 'admin-productos',
      layoutForm: 'wide',
      mode: 'edit',
      producto,
      categorias,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (handleUploadError(req)) {
      return res.redirect(`/admin/productos/${id}/editar`);
    }

    await processUpload(req);

    if (handleUploadError(req)) {
      return res.redirect(`/admin/productos/${id}/editar`);
    }

    const current = await ProductoService.findById(id);

    const validation = validateProductoForm(req.body, {
      isCreate: false,
      hasImage: Boolean(req.file || current.imagen),
    });

    if (!validation.isValid) {
      ProductoService.discardUploadedFile(req.file);
      setFormErrors(req, validation.errors, req.body);
      return res.redirect(`/admin/productos/${id}/editar`);
    }

    const exists = await ProductoService.codigoExists(req.body.codigo, id);
    if (exists) {
      ProductoService.discardUploadedFile(req.file);
      setFormErrors(req, { codigo: 'Ya existe un producto con ese código.' }, req.body);
      return res.redirect(`/admin/productos/${id}/editar`);
    }

    const imagen = await ProductoService.replaceImage(current.imagen, req.file);

    await ProductoService.update(
      id,
      {
        nombre: req.body.nombre.trim(),
        codigo: req.body.codigo.trim(),
        tipo: req.body.tipo.trim(),
        material: req.body.material.trim(),
        descripcion: req.body.descripcion.trim(),
        precio: validation.precio,
        stock: validation.stock,
        imagen,
        activo: parseActivo(req.body, current.activo),
      },
      validation.categoriaIds,
    );

    setFlash(req, 'success', 'Producto actualizado correctamente.');
    res.redirect('/admin/productos');
  } catch (err) {
    ProductoService.discardUploadedFile(req.file);
    next(err);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const producto = await ProductoService.duplicate(req.params.id);
    setFlash(req, 'success', 'Producto duplicado. Revisa los datos y guarda cuando estés listo.');
    res.redirect(`/admin/productos/${producto.id}/editar`);
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  const redirectTo = req.get('Referer') || '/admin/productos';

  try {
    const activo = req.body.activo === 'true';
    await ProductoService.toggleActive(req.params.id, activo);
    setFlash(req, 'success', activo ? 'Producto activado.' : 'Producto desactivado.');
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};

exports.enhanceWithAi = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ error: req.uploadError });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    const inputBuffer = await getUploadBuffer(req.file);
    const { buffer, mimeType, width, height, upscaledWidth, upscaledHeight } = await enhanceImage(inputBuffer);
    ProductoService.discardUploadedFile(req.file);

    if (!buffer?.length) {
      return res.status(502).json({ error: 'El modelo no devolvió datos de imagen.' });
    }

    res.json({
      image: `data:${mimeType};base64,${buffer.toString('base64')}`,
      width,
      height,
      upscaledWidth,
      upscaledHeight,
    });
  } catch (err) {
    ProductoService.discardUploadedFile(req.file);
    res.status(502).json({
      error: err.message || 'No se pudo mejorar la imagen con IA.',
    });
  }
};

exports.removeBackground = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ error: req.uploadError });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    const inputBuffer = await getUploadBuffer(req.file);
    const buffer = await removeBackground(inputBuffer);
    ProductoService.discardUploadedFile(req.file);

    if (!buffer?.length) {
      return res.status(502).json({ error: 'El servicio no devolvió datos de imagen.' });
    }

    const meta = await sharp(buffer).metadata();

    res.json({
      image: `data:image/png;base64,${buffer.toString('base64')}`,
      width: meta.width,
      height: meta.height,
    });
  } catch (err) {
    ProductoService.discardUploadedFile(req.file);
    res.status(502).json({
      error: err.message || 'No se pudo quitar el fondo de la imagen.',
    });
  }
};

exports.remove = async (req, res, next) => {
  try {
    await ProductoService.delete(req.params.id);
    setFlash(req, 'success', 'Producto eliminado correctamente.');
    res.redirect('/admin/productos');
  } catch (err) {
    next(err);
  }
};
