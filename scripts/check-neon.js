/**
 * Prueba rápida de Neon usando la misma config que la app (src/config/database.js).
 * Uso: node scripts/check-neon.js
 */
const { sql, pool } = require('../src/config/database');

async function main() {
  if (!sql || !pool) {
    console.error('DATABASE_URL no está en .env');
    process.exit(1);
  }

  try {
    const versionRows = await sql`SELECT version()`;
    console.log('Neon OK —', versionRows[0].version.split(',')[0]);

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY 1
    `;
    const names = tables.map((r) => r.table_name);
    console.log('Tablas public:', names.length ? names.join(', ') : '(ninguna — ejecuta sql/install-completo.sql)');
  } catch (err) {
    console.error('Conexión fallida:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
