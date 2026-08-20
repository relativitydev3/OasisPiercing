const { sql } = require('../config/database');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const { AppError } = require('../utils/errors');
const { requireDb } = require('../utils/db');

class UserService {
  static async findAll() {
    requireDb();
    const rows = await sql`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cc, u.direccion,
             u.rol_id, r.nombre AS rol_nombre, u.activo,
             u.email_verificado, u.created_at, u.updated_at
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC
    `;
    return rows.map(User.toPublic);
  }

  static async findById(id) {
    requireDb();
    const rows = await sql`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cc, u.direccion,
             u.rol_id, r.nombre AS rol_nombre, u.activo,
             u.email_verificado, u.created_at, u.updated_at
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.id = ${id}
      LIMIT 1
    `;
    return User.toPublic(rows[0]);
  }

  static async findByEmail(email) {
    requireDb();
    const rows = await sql`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cc, u.direccion,
             u.rol_id, r.nombre AS rol_nombre, u.activo,
             u.email_verificado, u.password_hash, u.created_at, u.updated_at
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(u.email) = LOWER(${email})
      LIMIT 1
    `;
    return rows[0] || null;
  }

  static async emailExists(email, excludeId = null) {
    requireDb();
    const rows = excludeId
      ? await sql`
          SELECT id FROM usuarios
          WHERE LOWER(email) = LOWER(${email}) AND id <> ${excludeId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM usuarios
          WHERE LOWER(email) = LOWER(${email})
          LIMIT 1
        `;
    return rows.length > 0;
  }

  static async create(data) {
    requireDb();
    const rows = await sql`
      INSERT INTO usuarios (
        nombre, apellido, email, password_hash, telefono, cc, direccion, rol_id, activo, email_verificado
      ) VALUES (
        ${data.nombre},
        ${data.apellido || null},
        ${data.email},
        ${data.password_hash},
        ${data.telefono || null},
        ${data.cc || null},
        ${data.direccion || null},
        ${data.rol_id},
        ${data.activo ?? true},
        ${data.email_verificado ?? false}
      )
      RETURNING id
    `;
    return this.findById(rows[0].id);
  }

  static async update(id, data) {
    requireDb();
    const current = await this.findById(id);
    if (!current) throw new AppError('Usuario no encontrado.', 404);

    await sql`
      UPDATE usuarios SET
        nombre = ${data.nombre},
        apellido = ${data.apellido || null},
        email = ${data.email},
        telefono = ${data.telefono || null},
        rol_id = ${data.rol_id},
        activo = ${data.activo},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    if (data.password_hash) {
      await sql`
        UPDATE usuarios SET password_hash = ${data.password_hash}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return this.findById(id);
  }

  static async toggleActive(id, activo) {
    requireDb();
    const rows = await sql`
      UPDATE usuarios SET activo = ${activo}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;
    if (!rows.length) throw new AppError('Usuario no encontrado.', 404);
    return this.findById(id);
  }

  static async delete(id) {
    requireDb();
    const rows = await sql`
      DELETE FROM usuarios WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) throw new AppError('Usuario no encontrado.', 404);
    return true;
  }

  static async countActiveAdmins(excludeId = null) {
    requireDb();
    const rows = excludeId
      ? await sql`
          SELECT COUNT(*)::int AS count
          FROM usuarios
          WHERE rol_id = ${ROLES.ADMINISTRADOR} AND activo = true AND id <> ${excludeId}
        `
      : await sql`
          SELECT COUNT(*)::int AS count
          FROM usuarios
          WHERE rol_id = ${ROLES.ADMINISTRADOR} AND activo = true
        `;
    return rows[0]?.count || 0;
  }

  static getDefaultClienteRoleId() {
    return ROLES.CLIENTE;
  }

  static async findClientsForPedidoSelect() {
    requireDb();
    const rows = await sql`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cc, u.direccion, u.activo
      FROM usuarios u
      WHERE u.rol_id = ${ROLES.CLIENTE}
      ORDER BY u.nombre ASC, u.apellido ASC NULLS LAST, u.email ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido || '',
      email: row.email,
      telefono: row.telefono || '',
      cc: row.cc || '',
      direccion: row.direccion || '',
      activo: row.activo,
    }));
  }
}

module.exports = UserService;
