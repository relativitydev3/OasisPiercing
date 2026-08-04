const AdmZip = require('adm-zip');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const ProductoService = require('./productoService');
const CatalogService = require('./catalogService');
const { parseCsv } = require('../utils/parseCsv');
const { generateUniqueSlug } = require('../utils/slug');
const { processProductoUpload } = require('../utils/productImage');
const { requireDb } = require('../utils/db');

const REQUIRED_FIELDS = [
  'codigo', 'nombre', 'tipo', 'material', 'descripcion', 'precio', 'stock', 'categoria_slug',
];

function buildImageMapFromZip(zipBuffer) {
  const map = new Map();
  if (!zipBuffer?.length) return map;

  const zip = new AdmZip(zipBuffer);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split('/').pop();
    if (!name || name.startsWith('.')) continue;
    const key = name.toLowerCase();
    map.set(key, {
      name,
      buffer: entry.getData(),
      mimetype: guessMime(name),
    });
  }
  return map;
}

function guessMime(filename) {
  const ext = String(filename).split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

function parseActivo(value) {
  if (value === undefined || value === null || value === '') return true;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'si' || v === 'sí' || v === 'yes';
}

function resolveImageForRow(row, imageMap) {
  const imagenCol = String(row.imagen || '').trim();
  if (/^https?:\/\//i.test(imagenCol)) {
    return { type: 'url', value: imagenCol };
  }

  const candidates = [
    imagenCol,
    `${row.codigo}.jpg`,
    `${row.codigo}.jpeg`,
    `${row.codigo}.png`,
    `${row.codigo}.webp`,
  ].filter(Boolean);

  for (const c of candidates) {
    const base = c.split(/[/\\]/).pop().toLowerCase();
    const file = imageMap.get(base);
    if (file) return { type: 'file', file };
  }

  return null;
}

function validateRow(row, lineIndex) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!String(row[field] ?? '').trim()) {
      errors.push(`Fila ${lineIndex}: falta «${field}».`);
    }
  }

  const precio = Number(String(row.precio).replace(',', '.'));
  if (Number.isNaN(precio) || precio <= 0) {
    errors.push(`Fila ${lineIndex}: precio inválido.`);
  }

  const stock = Number(String(row.stock).trim());
  if (!Number.isInteger(stock) || stock < 0) {
    errors.push(`Fila ${lineIndex}: stock debe ser entero ≥ 0.`);
  }

  return { precio, stock, errors };
}

class ProductoBulkImportService {
  static async importFromUpload({ csvBuffer, zipBuffer }) {
    requireDb();

    if (!csvBuffer?.length) {
      return { created: 0, skipped: 0, failed: 0, errors: ['Sube un archivo CSV.'] };
    }

    const rows = parseCsv(csvBuffer.toString('utf8'));
    if (!rows.length) {
      return { created: 0, skipped: 0, failed: 0, errors: ['El CSV no tiene filas de datos.'] };
    }

    const imageMap = buildImageMapFromZip(zipBuffer);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const lineNum = i + 2;
      const { precio, stock, errors: rowErrors } = validateRow(row, lineNum);
      if (rowErrors.length) {
        failed += 1;
        errors.push(...rowErrors);
        continue;
      }

      const codigo = String(row.codigo).trim();
      try {
        if (await Producto.codigoExists(codigo)) {
          skipped += 1;
          errors.push(`Fila ${lineNum} (${codigo}): ya existe, omitido.`);
          continue;
        }

        const categoriaSlug = String(row.categoria_slug).trim().toLowerCase();
        const categoria = await Categoria.findBySlug(categoriaSlug);
        if (!categoria) {
          failed += 1;
          errors.push(`Fila ${lineNum} (${codigo}): categoría «${categoriaSlug}» no encontrada.`);
          continue;
        }

        const imageRef = resolveImageForRow(row, imageMap);
        let imagen;
        if (imageRef?.type === 'url') {
          imagen = imageRef.value;
        } else if (imageRef?.type === 'file') {
          const processed = await processProductoUpload({
            originalname: imageRef.file.name,
            buffer: imageRef.file.buffer,
            mimetype: imageRef.file.mimetype,
          });
          imagen = ProductoService.buildImagePath(processed);
        } else {
          failed += 1;
          errors.push(
            `Fila ${lineNum} (${codigo}): falta imagen en el ZIP (columna imagen o ${codigo}.jpg).`,
          );
          continue;
        }

        const nombre = String(row.nombre).trim();
        let slug = String(row.slug || '').trim();
        if (!slug) {
          slug = await generateUniqueSlug(
            nombre,
            (candidate) => Producto.slugExists(candidate),
          );
        } else if (await Producto.slugExists(slug)) {
          failed += 1;
          errors.push(`Fila ${lineNum} (${codigo}): slug «${slug}» ya existe.`);
          continue;
        }

        const productoId = await Producto.create({
          nombre,
          codigo,
          tipo: String(row.tipo).trim(),
          material: String(row.material).trim(),
          descripcion: String(row.descripcion).trim(),
          precio,
          imagen,
          stock,
          slug,
          activo: parseActivo(row.activo),
        });

        await Producto.setCategorias(productoId, [categoria.id]);
        created += 1;
      } catch (err) {
        failed += 1;
        errors.push(`Fila ${lineNum} (${codigo}): ${err.message || 'Error desconocido.'}`);
      }
    }

    if (created > 0) {
      CatalogService.invalidateCache();
    }

    return {
      created,
      skipped,
      failed,
      errors: errors.slice(0, 50),
      errorsTruncated: errors.length > 50,
    };
  }
}

module.exports = ProductoBulkImportService;
