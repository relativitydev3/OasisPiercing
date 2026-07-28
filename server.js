require('./src/config/env');
const app = require('./src/app');
const env = require('./src/config/env');
const { validateEnv } = require('./src/config/env');

validateEnv();

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Oasis Piercing corriendo en ${env.appUrl} (puerto ${env.port})`);
    if (!env.databaseUrl || env.databaseUrl.includes('ep-xxxx')) {
      console.warn('\n⚠️  DATABASE_URL no configurada correctamente.');
      console.warn('   Ve a https://console.neon.tech → tu proyecto → Connect');
      console.warn('   Copia la connection string y pégala en .env\n');
    }
  });
}

module.exports = app;
