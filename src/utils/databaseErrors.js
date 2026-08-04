const PG_CODE_HINTS = {
  '28P01': 'La contraseña o el usuario en DATABASE_URL no son válidos. Copia de nuevo la connection string desde Neon (o tu hosting Postgres).',
  '28000': 'El usuario de la base de datos no existe o no tiene permiso. Revisa el usuario en DATABASE_URL.',
  '3D000': 'La base de datos indicada en la URL no existe. Comprueba el nombre en DATABASE_URL.',
  '57P03': 'PostgreSQL no acepta conexiones ahora (mantenimiento o arranque). Intenta en unos segundos.',
  '53300': 'Demasiadas conexiones abiertas. Cierra instancias duplicadas de npm run dev o revisa el límite en Neon.',
  '08006': 'La conexión con el servidor se cortó. Revisa red, VPN o que el proyecto Neon no esté suspendido.',
  '08001': 'No se pudo establecer conexión con el servidor. Revisa host y puerto en DATABASE_URL.',
};

const NETWORK_HINTS = {
  ECONNREFUSED: 'Nada escucha en ese host/puerto. ¿Postgres local encendido o URL de Neon correcta?',
  ENOTFOUND: 'No se resolvió el host de DATABASE_URL. Revisa que la URL esté completa y sin espacios.',
  ETIMEDOUT: 'Tiempo de espera agotado al conectar. Revisa firewall, VPN o estado del servicio.',
  ECONNRESET: 'El servidor cerró la conexión. Suele pasar con credenciales SSL o URL caducada en Neon.',
};

function unwrapError(err, depth = 0) {
  if (!err || depth > 4) return err;
  if (err.cause) return unwrapError(err.cause, depth + 1);
  if (Array.isArray(err.errors) && err.errors[0]) return unwrapError(err.errors[0], depth + 1);
  return err;
}

function isDatabaseError(err) {
  const e = unwrapError(err);
  if (!e) return false;

  if (/base de datos no configurada|DATABASE_URL/i.test(String(e.message || ''))) {
    return true;
  }

  const code = e.code;
  if (typeof code === 'string') {
    if (/^[0-9A-Z]{5}$/.test(code)) return true;
    if (Object.prototype.hasOwnProperty.call(NETWORK_HINTS, code)) return true;
  }

  const msg = String(e.message || e.detail || '');
  return /password authentication failed|connect ECONNREFUSED|Connection terminated|SASL|postgres|neon\.tech|pg\.|connect-pg-simple/i.test(msg);
}

function messageForCode(code) {
  if (code === '28P01') return 'Autenticación fallida con PostgreSQL (usuario o contraseña incorrectos).';
  if (code === '28000') return 'Acceso denegado: usuario o rol inválido en PostgreSQL.';
  if (code === '3D000') return 'La base de datos no existe.';
  if (PG_CODE_HINTS[code]) return `Error de PostgreSQL (${code}).`;
  if (NETWORK_HINTS[code]) return `No se pudo conectar al servidor de base de datos (${code}).`;
  return 'No se pudo conectar o consultar la base de datos.';
}

function parseDatabaseError(err) {
  const root = unwrapError(err);
  const code = root?.code && String(root.code);
  const detail = root?.detail || root?.hint || null;
  const technical = root?.message || String(err);

  let hint = PG_CODE_HINTS[code] || NETWORK_HINTS[code] || null;
  if (!hint && /DATABASE_URL no está|no configurada/i.test(technical)) {
    hint = 'Añade DATABASE_URL en tu archivo .env con la connection string de Neon (postgresql://…). Reinicia el servidor.';
  }
  if (!hint) {
    hint = 'Abre .env, verifica DATABASE_URL, guarda y reinicia npm run dev. En Neon, regenera la contraseña si hace falta.';
  }

  return {
    status: 503,
    title: 'Error de base de datos',
    message: messageForCode(code) || 'No se pudo usar la base de datos.',
    hint,
    code: code || null,
    detail,
    technical,
  };
}

/** Texto breve para banners (home, logs). */
function formatDatabaseErrorBrief(err) {
  const p = parseDatabaseError(err);
  const parts = [p.message];
  if (p.code) parts.push(`Código: ${p.code}`);
  if (p.hint) parts.push(p.hint);
  return parts.join(' — ');
}

module.exports = {
  isDatabaseError,
  parseDatabaseError,
  formatDatabaseErrorBrief,
};
