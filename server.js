const app = require('./src/app');
const env = require('./src/config/env');

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Oasis Piercing corriendo en ${env.appUrl} (puerto ${env.port})`);
  });
}

module.exports = app;
