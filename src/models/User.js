const { ROLE_NAMES } = require('../config/roles');

class User {
  static toPublic(row) {
    if (!row) return null;

    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      telefono: row.telefono,
      rol_id: row.rol_id,
      rol_nombre: row.rol_nombre || ROLE_NAMES[row.rol_id] || null,
      activo: row.activo,
      email_verificado: row.email_verificado,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

module.exports = User;
