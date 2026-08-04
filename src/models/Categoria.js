const { sql } = require('../config/database');

class Categoria {
  static toPublic(row) {
    if (!row) return null;

    return {
      id: row.id,
      nombre: row.nombre,
      slug: row.slug,
      descripcion: row.descripcion,
      activo: row.activo,
      total_productos: row.total_productos != null ? Number(row.total_productos) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async findAllWithProductCount() {
    const rows = await sql`
      SELECT c.id, c.nombre, c.slug, c.descripcion, c.activo,
             c.created_at, c.updated_at,
             COUNT(pc.producto_id)::int AS total_productos
      FROM categorias c
      LEFT JOIN producto_categorias pc ON pc.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;
    return rows.map(Categoria.toPublic);
  }

  static async findAllActiveForStorefront() {
    const rows = await sql`
      SELECT c.id, c.nombre, c.slug, c.descripcion, c.activo,
             c.created_at, c.updated_at,
             COUNT(DISTINCT p.id) FILTER (WHERE p.activo = true)::int AS total_productos
      FROM categorias c
      LEFT JOIN producto_categorias pc ON pc.categoria_id = c.id
      LEFT JOIN productos p ON p.id = pc.producto_id AND p.activo = true
      WHERE c.activo = true
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;
    return rows.map(Categoria.toPublic);
  }

  static async findAll() {
    const rows = await sql`
      SELECT id, nombre, slug, descripcion, activo, created_at, updated_at
      FROM categorias
      ORDER BY nombre ASC
    `;
    return rows.map(Categoria.toPublic);
  }

  static async findById(id) {
    const rows = await sql`
      SELECT id, nombre, slug, descripcion, activo, created_at, updated_at
      FROM categorias
      WHERE id = ${id}
      LIMIT 1
    `;
    return Categoria.toPublic(rows[0]);
  }

  static async findBySlug(slug) {
    const rows = await sql`
      SELECT id, nombre, slug, descripcion, activo, created_at, updated_at
      FROM categorias
      WHERE slug = ${String(slug).trim().toLowerCase()}
      LIMIT 1
    `;
    return Categoria.toPublic(rows[0]);
  }

  static async nombreExists(nombre, excludeId = null) {
    const rows = excludeId
      ? await sql`
          SELECT id FROM categorias
          WHERE LOWER(nombre) = LOWER(${nombre}) AND id <> ${excludeId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM categorias
          WHERE LOWER(nombre) = LOWER(${nombre})
          LIMIT 1
        `;
    return rows.length > 0;
  }

  static async slugExists(slug, excludeId = null) {
    const rows = excludeId
      ? await sql`
          SELECT id FROM categorias
          WHERE slug = ${slug} AND id <> ${excludeId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM categorias
          WHERE slug = ${slug}
          LIMIT 1
        `;
    return rows.length > 0;
  }

  static async create(data) {
    const rows = await sql`
      INSERT INTO categorias (nombre, slug, descripcion, activo)
      VALUES (${data.nombre}, ${data.slug}, ${data.descripcion || null}, ${data.activo ?? true})
      RETURNING id
    `;
    return Categoria.findById(rows[0].id);
  }

  static async update(id, data) {
    await sql`
      UPDATE categorias SET
        nombre = ${data.nombre},
        slug = ${data.slug},
        descripcion = ${data.descripcion || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return Categoria.findById(id);
  }

  static async toggleActive(id, activo) {
    const rows = await sql`
      UPDATE categorias SET activo = ${activo}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;
    return rows.length > 0;
  }

  static async delete(id) {
    await sql`DELETE FROM producto_categorias WHERE categoria_id = ${id}`;
    const rows = await sql`
      DELETE FROM categorias WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }

  static async countActiveByIds(ids) {
    if (!ids.length) return 0;
    const rows = await sql`
      SELECT COUNT(*)::int AS count
      FROM categorias
      WHERE activo = true AND id = ANY(${ids}::uuid[])
    `;
    return rows[0]?.count || 0;
  }
}

module.exports = Categoria;
