const AuthService = require('../services/authService');
const UserService = require('../services/userService');
const { ROLES, ROLE_NAMES } = require('../config/roles');
const { validateUserForm } = require('../validations/user.validation');
const { setFlash, setFormErrors } = require('../utils/flash');
const { renderAdmin } = require('../utils/renderAdmin');
const { AppError } = require('../utils/errors');

const rolesOptions = [
  { id: ROLES.CLIENTE, nombre: ROLE_NAMES[ROLES.CLIENTE] },
  { id: ROLES.ADMINISTRADOR, nombre: ROLE_NAMES[ROLES.ADMINISTRADOR] },
];

exports.list = async (req, res, next) => {
  try {
    const usuarios = await UserService.findAll();
    await renderAdmin(res, 'pages/admin/usuarios/index', {
      title: 'Usuarios',
      page: 'admin-usuarios',
      usuarios,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    await renderAdmin(res, 'pages/admin/usuarios/form', {
      title: 'Nuevo usuario',
      page: 'admin-usuarios',
      layoutForm: true,
      mode: 'create',
      roles: rolesOptions,
      usuario: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const validation = validateUserForm(req.body, { isCreate: true });
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/admin/usuarios/nuevo');
    }

    const exists = await UserService.emailExists(req.body.email.trim());
    if (exists) {
      setFormErrors(req, { email: 'Este email ya está registrado.' }, req.body);
      return res.redirect('/admin/usuarios/nuevo');
    }

    const password_hash = await AuthService.hashPassword(req.body.password);

    await UserService.create({
      nombre: req.body.nombre.trim(),
      apellido: req.body.apellido?.trim() || null,
      email: req.body.email.trim().toLowerCase(),
      telefono: req.body.telefono?.trim() || null,
      password_hash,
      rol_id: validation.rolId,
      activo: req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === true,
      email_verificado: req.body.email_verificado === 'on',
    });

    setFlash(req, 'success', 'Usuario creado correctamente.');
    res.redirect('/admin/usuarios');
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const usuario = await UserService.findById(req.params.id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    await renderAdmin(res, 'pages/admin/usuarios/show', {
      title: `${usuario.nombre}${usuario.apellido ? ` ${usuario.apellido}` : ''}`,
      page: 'admin-usuarios',
      layoutForm: 'wide',
      usuario,
    });
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const usuario = await UserService.findById(req.params.id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    await renderAdmin(res, 'pages/admin/usuarios/form', {
      title: 'Editar usuario',
      page: 'admin-usuarios',
      layoutForm: true,
      mode: 'edit',
      roles: rolesOptions,
      usuario,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = validateUserForm(req.body, { isCreate: false });
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect(`/admin/usuarios/${id}/editar`);
    }

    const exists = await UserService.emailExists(req.body.email.trim(), id);
    if (exists) {
      setFormErrors(req, { email: 'Este email ya está registrado.' }, req.body);
      return res.redirect(`/admin/usuarios/${id}/editar`);
    }

    const target = await UserService.findById(id);
    if (!target) throw new AppError('Usuario no encontrado.', 404);

    const nextActivo = req.body.activo === 'on' || req.body.activo === 'true' || req.body.activo === true;
    const demotingAdmin = target.rol_id === ROLES.ADMINISTRADOR
      && validation.rolId !== ROLES.ADMINISTRADOR;
    const deactivatingAdmin = target.rol_id === ROLES.ADMINISTRADOR
      && target.activo
      && !nextActivo;

    if (id === req.session.user?.id && demotingAdmin) {
      setFlash(req, 'error', 'No puedes quitarte el rol de administrador a ti mismo.');
      return res.redirect(`/admin/usuarios/${id}/editar`);
    }

    if (demotingAdmin || deactivatingAdmin) {
      const remaining = await UserService.countActiveAdmins(id);
      if (remaining === 0) {
        setFlash(req, 'error', 'Debe permanecer al menos un administrador activo.');
        return res.redirect(`/admin/usuarios/${id}/editar`);
      }
    }

    const payload = {
      nombre: req.body.nombre.trim(),
      apellido: req.body.apellido?.trim() || null,
      email: req.body.email.trim().toLowerCase(),
      telefono: req.body.telefono?.trim() || null,
      rol_id: validation.rolId,
      activo: nextActivo,
    };

    if (req.body.password?.trim()) {
      payload.password_hash = await AuthService.hashPassword(req.body.password);
    }

    await UserService.update(id, payload);
    setFlash(req, 'success', 'Usuario actualizado correctamente.');
    res.redirect('/admin/usuarios');
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.session.user?.id === id) {
      setFlash(req, 'error', 'No puedes cambiar el estado de tu propia cuenta.');
      return res.redirect('/admin/usuarios');
    }

    const activo = req.body.activo === 'true';
    const target = await UserService.findById(id);

    if (target?.rol_id === ROLES.ADMINISTRADOR && target.activo && !activo) {
      const remaining = await UserService.countActiveAdmins(id);
      if (remaining === 0) {
        setFlash(req, 'error', 'Debe permanecer al menos un administrador activo.');
        return res.redirect('/admin/usuarios');
      }
    }

    await UserService.toggleActive(id, activo);
    setFlash(req, 'success', activo ? 'Usuario activado.' : 'Usuario desactivado.');
    res.redirect('/admin/usuarios');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.session.user?.id === id) {
      setFlash(req, 'error', 'No puedes eliminar tu propia cuenta.');
      return res.redirect('/admin/usuarios');
    }

    const target = await UserService.findById(id);
    if (target?.rol_id === ROLES.ADMINISTRADOR && target.activo) {
      const remaining = await UserService.countActiveAdmins(id);
      if (remaining === 0) {
        setFlash(req, 'error', 'No puedes eliminar al último administrador activo.');
        return res.redirect('/admin/usuarios');
      }
    }

    await UserService.delete(id);
    setFlash(req, 'success', 'Usuario eliminado correctamente.');
    res.redirect('/admin/usuarios');
  } catch (err) {
    next(err);
  }
};
