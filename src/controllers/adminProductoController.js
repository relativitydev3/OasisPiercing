const CategoriaService = require('../services/categoriaService');
const ProductoService = require('../services/productoService');
const { processProductoUpload } = require('../utils/productImage');
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
    req.uploadError = 'No se pudo optimizar la imagen.';
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

exports.showEdit = async (req, res, next) => {
  try {
    const [producto, categorias] = await Promise.all([
      ProductoService.findById(req.params.id),
      CategoriaService.findAllForSelect(),
    ]);

    if (!producto) throw new AppError('Producto no encontrado.', 404);

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

    const imagen = ProductoService.replaceImage(current.imagen, req.file);

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

exports.toggleActive = async (req, res, next) => {
  try {
    const activo = req.body.activo === 'true';
    await ProductoService.toggleActive(req.params.id, activo);
    setFlash(req, 'success', activo ? 'Producto activado.' : 'Producto desactivado.');
    res.redirect('/admin/productos');
  } catch (err) {
    next(err);
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
