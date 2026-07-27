/**
 * Imágenes de categorías en el frontend (slug → ruta pública).
 * La BD no almacena imagen de categoría; se resuelve aquí por convención.
 */
const DEFAULT = '/images/categorias/oreja.png';

const BY_SLUG = {
  oreja: '/images/categorias/oreja.png',
  nariz: '/images/categorias/nariz.png',
  ombligo: '/images/categorias/Ombligo.png',
  ceja: '/images/categorias/Ceja.png',
  labio: '/images/categorias/Labio.png',
  industrial: '/images/categorias/industrial.png',
  lengua: '/images/categorias/Lengua.png',
  pesones: '/images/categorias/pesona.png',
  pesona: '/images/categorias/pesona.png',
};

function getCategoryImage(slug) {
  if (!slug) return DEFAULT;
  return BY_SLUG[slug.toLowerCase()] || DEFAULT;
}

module.exports = { getCategoryImage, DEFAULT };
