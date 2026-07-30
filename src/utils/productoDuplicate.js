/**
 * Utilidades puras para duplicar productos en admin.
 */

function buildDuplicateNombre(nombre) {
  const base = String(nombre || '').trim();
  if (!base) return 'Copia de producto';
  if (/\(copia\)$/i.test(base)) return base;
  return `${base} (copia)`;
}

/**
 * Genera un código único para la copia: CODIGO-copia, CODIGO-copia-2, ...
 * @param {string} codigoOriginal
 * @param {(codigo: string) => Promise<boolean>} codigoExists
 */
async function generateDuplicateCodigo(codigoOriginal, codigoExists) {
  const base = String(codigoOriginal || '').trim() || 'PROD';
  const candidates = [`${base}-copia`];

  for (let i = 2; i <= 99; i += 1) {
    candidates.push(`${base}-copia-${i}`);
  }

  for (const candidate of candidates) {
    if (!(await codigoExists(candidate))) {
      return candidate;
    }
  }

  throw new Error('No se pudo generar un código único para la copia del producto.');
}

module.exports = {
  buildDuplicateNombre,
  generateDuplicateCodigo,
};
