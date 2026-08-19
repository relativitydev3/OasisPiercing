const bcrypt = require('bcrypt');
const UserService = require('./userService');
const User = require('../models/User');
const { ROLES, isAdmin } = require('../config/roles');
const { AppError } = require('../utils/errors');

const SALT_ROUNDS = 12;

class AuthService {
  static async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static async login(email, password) {
    const user = await UserService.findByEmail(email);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 401, {
        email: 'Email o contraseña incorrectos.',
      });
    }

    if (!user.activo) {
      throw new AppError('Usuario inactivo.', 403, {
        email: 'Tu cuenta está inactiva. Contacta al administrador.',
      });
    }

    const valid = await this.comparePassword(password, user.password_hash);
    if (!valid) {
      throw new AppError('Contraseña incorrecta.', 401, {
        password: 'Email o contraseña incorrectos.',
      });
    }

    return User.toPublic(user);
  }

  static async register(data) {
    const exists = await UserService.emailExists(data.email);
    if (exists) {
      throw new AppError('Email ya registrado.', 409, {
        email: 'Este email ya está registrado.',
      });
    }

    const password_hash = await this.hashPassword(data.password);

    return UserService.create({
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email.toLowerCase().trim(),
      telefono: data.telefono,
      cc: data.cc,
      direccion: data.direccion,
      password_hash,
      rol_id: ROLES.CLIENTE,
      activo: true,
      email_verificado: false,
    });
  }

  static getRedirectPath(user) {
    return isAdmin(user.rol_id) ? '/admin/dashboard' : '/';
  }
}

module.exports = AuthService;
