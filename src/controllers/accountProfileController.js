const UserService = require('../services/userService');
const PedidoService = require('../services/pedidoService');
const { validateProfileForm } = require('../validations/profile.validation');
const { setFlash, setFormErrors } = require('../utils/flash');
const { AppError } = require('../utils/errors');

function buildProfileSuccessMessage(pedidosActivosCount) {
  if (!pedidosActivosCount) {
    return 'Tu perfil se actualizó correctamente. Los próximos pedidos usarán esta información.';
  }

  const label = pedidosActivosCount === 1 ? 'pedido en curso' : 'pedidos en curso';
  return (
    `Tu perfil se actualizó correctamente. Tienes ${pedidosActivosCount} ${label}: `
    + 'seguirán usando los datos que tenías al comprarlos. '
    + 'Solo los pedidos nuevos tomarán tu información actualizada.'
  );
}

exports.showEdit = async (req, res, next) => {
  try {
    const user = await UserService.findById(req.session.user.id);
    if (!user) throw new AppError('Usuario no encontrado.', 404);

    const pedidosActivosCount = await PedidoService.countActivosByUsuarioId(user.id);

    res.render('pages/account/perfil/form', {
      title: 'Mi perfil',
      page: 'mi-perfil',
      profile: user,
      pedidosActivosCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    const validation = validateProfileForm(req.body);

    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/mi-perfil');
    }

    const email = req.body.email.trim().toLowerCase();
    if (await UserService.emailExists(email, sessionUser.id)) {
      setFormErrors(req, { email: 'Este email ya está registrado.' }, req.body);
      return res.redirect('/mi-perfil');
    }

    const pedidosActivosCount = await PedidoService.countActivosByUsuarioId(sessionUser.id);

    const updated = await UserService.update(sessionUser.id, {
      nombre: req.body.nombre.trim(),
      apellido: req.body.apellido.trim(),
      email,
      telefono: req.body.telefono.trim(),
      cc: req.body.cc.trim(),
      direccion: req.body.direccion.trim(),
      rol_id: sessionUser.rol_id,
      activo: sessionUser.activo,
      email_verificado: sessionUser.email_verificado,
    });

    req.session.user = updated;
    setFlash(req, 'success', buildProfileSuccessMessage(pedidosActivosCount));
    res.redirect('/mi-perfil');
  } catch (err) {
    next(err);
  }
};
