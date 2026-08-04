const { pool } = require('../src/config/database');

async function main() {
  if (!pool) {
    console.log('DATABASE_URL no configurada en .env');
    process.exit(1);
  }
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.nombre, u.apellido, u.activo,
             r.nombre AS rol, u.email_verificado, u.created_at
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      ORDER BY u.id
    `);
    if (!rows.length) {
      console.log('No hay usuarios en la tabla usuarios.');
      return;
    }
    console.log('Usuarios registrados (login admin/tienda):\n');
    for (const u of rows) {
      console.log(
        `- ${u.email} | ${u.nombre} ${u.apellido} | rol: ${u.rol} | activo: ${u.activo}`,
      );
    }
  } catch (err) {
    if (err.code === '42P01') {
      console.log('La tabla usuarios no existe. Ejecuta el esquema SQL en Neon primero.');
    } else {
      console.log('Error:', err.code || '', err.message);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
