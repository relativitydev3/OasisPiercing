const CategoriaService = require('../services/categoriaService');
const { validateCategoriaForm } = require('../validations/categoria.validation');
const { setFlash, setFormErrors } = require('../utils/flash');
const { AppError } = require('../utils/errors');

function parseActivo(body, fallback = true) {
  if (typeof body.activo === 'undefined') return fallback;
  return body.activo === 'on' || body.activo === 'true' || body.activo === true;
}

exports.list = async (req, res, next) => {
  try {
    const categorias = await CategoriaService.findAll();
    res.render('pages/admin/categorias/index', {
      title: 'Categorías',
      page: 'admin-categorias',
      categorias,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = (req, res) => {
  res.render('pages/admin/categorias/form', {
    title: 'Nueva categoría',
    page: 'admin-categorias',
    mode: 'create',
    categoria: null,
  });
};

exports.create = async (req, res, next) => {
  try {
    const validation = validateCategoriaForm(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/admin/categorias/nuevo');
    }

    const exists = await CategoriaService.nombreExists(req.body.nombre);
    if (exists) {
      setFormErrors(req, { nombre: 'Ya existe una categoría con ese nombre.' }, req.body);
      return res.redirect('/admin/categorias/nuevo');
    }

    await CategoriaService.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      activo: parseActivo(req.body),
    });

    setFlash(req, 'success', 'Categoría creada correctamente.');
    res.redirect('/admin/categorias');
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const categoria = await CategoriaService.findById(req.params.id);
    if (!categoria) throw new AppError('Categoría no encontrada.', 404);

    res.render('pages/admin/categorias/form', {
      title: 'Editar categoría',
      page: 'admin-categorias',
      mode: 'edit',
      categoria,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = validateCategoriaForm(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect(`/admin/categorias/${id}/editar`);
    }

    const exists = await CategoriaService.nombreExists(req.body.nombre, id);
    if (exists) {
      setFormErrors(req, { nombre: 'Ya existe una categoría con ese nombre.' }, req.body);
      return res.redirect(`/admin/categorias/${id}/editar`);
    }

    await CategoriaService.update(id, {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
    });

    setFlash(req, 'success', 'Categoría actualizada correctamente.');
    res.redirect('/admin/categorias');
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const activo = req.body.activo === 'true';
    await CategoriaService.toggleActive(req.params.id, activo);
    setFlash(req, 'success', activo ? 'Categoría activada.' : 'Categoría desactivada.');
    res.redirect('/admin/categorias');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await CategoriaService.delete(req.params.id);
    setFlash(req, 'success', 'Categoría eliminada correctamente.');
    res.redirect('/admin/categorias');
  } catch (err) {
    next(err);
  }
};
