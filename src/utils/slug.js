function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(baseText, existsFn, excludeId = null) {
  const base = slugify(baseText) || 'item';
  let slug = base;
  let counter = 1;

  while (await existsFn(slug, excludeId)) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

module.exports = { slugify, generateUniqueSlug };
