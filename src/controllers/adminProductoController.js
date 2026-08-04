const CategoriaService = require('../services/categoriaService');
const sharp = require('sharp');
const ProductoService = require('../services/productoService');
const ProductoBulkImportService = require('../services/productoBulkImportService');
const { removeBackground } = require('../services/removeBgService');
const { enhanceImage } = require('../services/replicateImageService');
const { inpaintWithMask } = require('../services/replicateInpaintService');
const { processProductoUpload, getUploadBuffer } = require('../utils/productImage');
const { readStoredProductoImage } = require('../utils/productImageStorage');
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

exports.removeObject = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ error: req.uploadError });
    }

    const imageFile = req.files?.imagen?.[0];
    const maskFile = req.files?.mascara?.[0];

    if (!imageFile) {
      return res.status(400).json({ error: 'No se recibió la imagen.' });
    }
    if (!maskFile) {
      return res.status(400).json({ error: 'Pinta sobre lo que quieres quitar antes de enviar.' });
    }

    const inputBuffer = await getUploadBuffer(imageFile);
    const maskBuffer = await getUploadBuffer(maskFile);

    const { buffer, mimeType, width, height } = await inpaintWithMask(inputBuffer, maskBuffer);
    ProductoService.discardUploadedFile(imageFile);
    ProductoService.discardUploadedFile(maskFile);

    if (!buffer?.length) {
      return res.status(502).json({ error: 'El modelo no devolvió datos de imagen.' });
    }

    res.json({
      image: `data:${mimeType};base64,${buffer.toString('base64')}`,
      width,
      height,
    });
  } catch (err) {
    const imageFile = req.files?.imagen?.[0];
    const maskFile = req.files?.mascara?.[0];
    ProductoService.discardUploadedFile(imageFile);
    ProductoService.discardUploadedFile(maskFile);
    res.status(502).json({
      error: err.message || 'No se pudo quitar el objeto con IA.',
    });
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
    const { buffer, mimeType, width, height, upscaledWidth, upscaledHeight } = await enhanceImage(
      inputBuffer,
      { mode: req.query.mode || 'full' },
    );
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

exports.serveEditorImage = async (req, res, next) => {
  try {
    const producto = await ProductoService.findById(req.params.id);
    if (!producto?.imagen) {
      return res.status(404).json({ error: 'Este producto no tiene imagen.' });
    }

    const buffer = await readStoredProductoImage(producto.imagen);
    if (!buffer?.length) {
      return res.status(404).json({ error: 'No se encontró el archivo de imagen.' });
    }

    const meta = await sharp(buffer).metadata();
    const format = meta.format || 'webp';
    const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;

    res.set('Cache-Control', 'private, no-store');
    res.type(mime).send(buffer);
  } catch (err) {
    next(err);
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

exports.showBulkImport = async (req, res, next) => {
  try {
    const bulkImportLog = req.session.bulkImportLog || [];
    delete req.session.bulkImportLog;
    await renderAdmin(res, 'pages/admin/productos/bulk', {
      title: 'Carga masiva',
      page: 'admin-productos',
      layoutForm: 'wide',
      bulkImportLog,
    });
  } catch (err) {
    next(err);
  }
};

exports.bulkImport = async (req, res, next) => {
  try {
    if (req.uploadError) {
      setFlash(req, 'error', req.uploadError);
      return res.redirect('/admin/productos/carga-masiva');
    }

    const csvFile = req.files?.csv?.[0];
    const zipFile = req.files?.imagenes_zip?.[0];

    if (!csvFile) {
      setFlash(req, 'error', 'Selecciona un archivo CSV.');
      return res.redirect('/admin/productos/carga-masiva');
    }

    const result = await ProductoBulkImportService.importFromUpload({
      csvBuffer: csvFile.buffer,
      zipBuffer: zipFile?.buffer,
    });

    const parts = [];
    if (result.created) parts.push(`${result.created} creado${result.created === 1 ? '' : 's'}`);
    if (result.skipped) parts.push(`${result.skipped} omitido${result.skipped === 1 ? '' : 's'}`);
    if (result.failed) parts.push(`${result.failed} con error${result.failed === 1 ? '' : 'es'}`);

    const summary = parts.length ? parts.join(', ') : 'No se importó ningún producto.';

    if (!result.created && result.failed) {
      setFlash(req, 'error', summary);
    } else {
      setFlash(req, 'success', summary);
    }

    if (result.errors?.length) {
      req.session.bulkImportLog = result.errors;
      if (result.errorsTruncated) {
        req.session.bulkImportLog.push('… (solo se muestran los primeros 50 mensajes)');
      }
    } else {
      delete req.session.bulkImportLog;
    }

    res.redirect('/admin/productos/carga-masiva');
  } catch (err) {
    next(err);
  }
};
