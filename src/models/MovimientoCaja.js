const { sql } = require('../config/database');

class MovimientoCaja {
  static toPublic(row) {
    if (!row) return null;
    return {
      id: row.id,
      tipo: row.tipo,
      concepto: row.concepto,
      monto: Number(row.monto),
      fecha: row.fecha,
      notas: row.notas ?? null,
      usuario_id: row.usuario_id ?? null,
      usuario_nombre: row.usuario_nombre ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async findAll() {
    const rows = await sql`
      SELECT m.*, u.nombre AS usuario_nombre
      FROM movimientos_caja m
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      ORDER BY m.fecha DESC, m.created_at DESC
    `;
    return rows.map(MovimientoCaja.toPublic);
  }

  static async findByMonth(desde, hastaExclusive) {
    const rows = await sql`
      SELECT m.*, u.nombre AS usuario_nombre
      FROM movimientos_caja m
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.fecha >= ${desde}::date
        AND m.fecha < ${hastaExclusive}::date
      ORDER BY m.fecha DESC, m.created_at DESC
    `;
    return rows.map(MovimientoCaja.toPublic);
  }

  static async findById(id) {
    const rows = await sql`
      SELECT m.*, u.nombre AS usuario_nombre
      FROM movimientos_caja m
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.id = ${id}
      LIMIT 1
    `;
    return MovimientoCaja.toPublic(rows[0]);
  }

  static async create(data) {
    const rows = await sql`
      INSERT INTO movimientos_caja (tipo, concepto, monto, fecha, notas, usuario_id)
      VALUES (
        ${data.tipo},
        ${data.concepto},
        ${data.monto},
        ${data.fecha},
        ${data.notas ?? null},
        ${data.usuario_id ?? null}
      )
      RETURNING id
    `;
    return MovimientoCaja.findById(rows[0].id);
  }

  static async update(id, data) {
    await sql`
      UPDATE movimientos_caja SET
        tipo = ${data.tipo},
        concepto = ${data.concepto},
        monto = ${data.monto},
        fecha = ${data.fecha},
        notas = ${data.notas ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return MovimientoCaja.findById(id);
  }

  static async delete(id) {
    const rows = await sql`
      DELETE FROM movimientos_caja WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }

  static async sumByTipoAll() {
    const rows = await sql`
      SELECT tipo, COALESCE(SUM(monto), 0) AS total
      FROM movimientos_caja
      GROUP BY tipo
    `;
    return MovimientoCaja.mapSumByTipo(rows);
  }

  static async sumByTipoInRange(desde, hastaExclusive) {
    const rows = await sql`
      SELECT tipo, COALESCE(SUM(monto), 0) AS total
      FROM movimientos_caja
      WHERE fecha >= ${desde}::date
        AND fecha < ${hastaExclusive}::date
      GROUP BY tipo
    `;
    return MovimientoCaja.mapSumByTipo(rows);
  }

  static mapSumByTipo(rows) {
    const map = { gasto: 0, ingreso: 0 };
    rows.forEach((r) => {
      map[r.tipo] = Number(r.total) || 0;
    });
    return map;
  }
}

module.exports = MovimientoCaja;
