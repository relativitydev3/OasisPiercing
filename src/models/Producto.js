const { sql } = require('../config/database');

class Producto {
  static toPublic(row) {
    if (!row) return null;

    let categorias = row.categorias;
    if (typeof categorias === 'string') {
      try {
        categorias = JSON.parse(categorias);
      } catch {
        categorias = [];
      }
    }
    if (!Array.isArray(categorias)) categorias = [];

    return {
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      tipo: row.tipo,
      material: row.material,
      descripcion: row.descripcion,
      precio: row.precio,
      imagen: row.imagen,
      stock: row.stock,
      slug: row.slug,
      activo: row.activo,
      categorias,
      categoria_ids: categorias.map((c) => c.id),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async findAllWithCategorias() {
    const rows = await sql`
      SELECT p.id, p.nombre, p.codigo, p.tipo, p.material, p.descripcion,
             p.precio, p.imagen, p.stock, p.slug, p.activo,
             p.created_at, p.updated_at,
             COALESCE(
               json_agg(
                 json_build_object('id', c.id, 'nombre', c.nombre, 'slug', c.slug)
               ) FILTER (WHERE c.id IS NOT NULL),
               '[]'
             ) AS categorias
      FROM productos p
      LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map(Producto.toPublic);
  }

  static async findAllActiveForStorefront() {
    const rows = await sql`
      SELECT p.id, p.nombre, p.codigo, p.tipo, p.material, p.descripcion,
             p.precio, p.imagen, p.stock, p.slug, p.activo,
             p.created_at, p.updated_at,
             COALESCE(
               json_agg(
                 json_build_object('id', c.id, 'nombre', c.nombre, 'slug', c.slug)
               ) FILTER (WHERE c.id IS NOT NULL),
               '[]'
             ) AS categorias
      FROM productos p
      LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id AND c.activo = true
      WHERE p.activo = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map(Producto.toPublic);
  }

  static async findById(id) {
    const rows = await sql`
      SELECT p.id, p.nombre, p.codigo, p.tipo, p.material, p.descripcion,
             p.precio, p.imagen, p.stock, p.slug, p.activo,
             p.created_at, p.updated_at,
             COALESCE(
               json_agg(
                 json_build_object('id', c.id, 'nombre', c.nombre, 'slug', c.slug)
               ) FILTER (WHERE c.id IS NOT NULL),
               '[]'
             ) AS categorias
      FROM productos p
      LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id
      WHERE p.id = ${id}
      GROUP BY p.id
      LIMIT 1
    `;
    return Producto.toPublic(rows[0]);
  }

  static async findAllForSelect() {
    const rows = await sql`
      SELECT p.id, p.nombre, p.codigo, p.tipo, p.material, p.precio, p.stock, p.imagen, p.activo,
             COALESCE(string_agg(c.nombre, ', ' ORDER BY c.nombre), '') AS categorias_text
      FROM productos p
      LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id
      WHERE p.activo = true
      GROUP BY p.id
      ORDER BY p.nombre ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      tipo: row.tipo,
      material: row.material,
      precio: row.precio,
      stock: row.stock,
      imagen: row.imagen,
      activo: row.activo,
      categorias: row.categorias_text || '',
    }));
  }

  static async findByIds(ids) {
    if (!ids.length) return [];
    const rows = await sql`
      SELECT id, nombre, codigo, precio, stock, activo
      FROM productos
      WHERE id = ANY(${ids}::uuid[])
    `;
    return rows;
  }

  static async findByCodigos(codigos) {
    if (!codigos.length) return [];
    const normalized = codigos.map((c) => String(c).trim()).filter(Boolean);
    if (!normalized.length) return [];
    const rows = await sql`
      SELECT id, nombre, codigo, precio, stock, activo
      FROM productos
      WHERE LOWER(codigo) = ANY(${normalized.map((c) => c.toLowerCase())}::text[])
    `;
    return rows;
  }

  static async codigoExists(codigo, excludeId = null) {
    const rows = excludeId
      ? await sql`
          SELECT id FROM productos
          WHERE LOWER(codigo) = LOWER(${codigo}) AND id <> ${excludeId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM productos
          WHERE LOWER(codigo) = LOWER(${codigo})
          LIMIT 1
        `;
    return rows.length > 0;
  }

  static async slugExists(slug, excludeId = null) {
    const rows = excludeId
      ? await sql`
          SELECT id FROM productos
          WHERE slug = ${slug} AND id <> ${excludeId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM productos
          WHERE slug = ${slug}
          LIMIT 1
        `;
    return rows.length > 0;
  }

  static async create(data) {
    const rows = await sql`
      INSERT INTO productos (
        nombre, codigo, tipo, material, descripcion,
        precio, imagen, stock, slug, activo
      ) VALUES (
        ${data.nombre},
        ${data.codigo},
        ${data.tipo},
        ${data.material},
        ${data.descripcion},
        ${data.precio},
        ${data.imagen},
        ${data.stock},
        ${data.slug},
        ${data.activo ?? true}
      )
      RETURNING id
    `;
    return rows[0].id;
  }

  static async update(id, data) {
    await sql`
      UPDATE productos SET
        nombre = ${data.nombre},
        codigo = ${data.codigo},
        tipo = ${data.tipo},
        material = ${data.material},
        descripcion = ${data.descripcion},
        precio = ${data.precio},
        imagen = ${data.imagen},
        stock = ${data.stock},
        slug = ${data.slug},
        activo = ${data.activo},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return Producto.findById(id);
  }

  static async setCategorias(productoId, categoriaIds) {
    await sql`DELETE FROM producto_categorias WHERE producto_id = ${productoId}`;

    for (const categoriaId of categoriaIds) {
      await sql`
        INSERT INTO producto_categorias (producto_id, categoria_id)
        VALUES (${productoId}, ${categoriaId})
      `;
    }
  }

  static async toggleActive(id, activo) {
    const rows = await sql`
      UPDATE productos SET activo = ${activo}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;
    return rows.length > 0;
  }

  static async delete(id) {
    await sql`DELETE FROM producto_categorias WHERE producto_id = ${id}`;
    const rows = await sql`
      DELETE FROM productos WHERE id = ${id} RETURNING imagen
    `;
    return rows[0] || null;
  }
}

module.exports = Producto;
