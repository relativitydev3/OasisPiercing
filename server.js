const app = require('./src/app');
const env = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`Oasis Piercing corriendo en ${env.appUrl} (puerto ${env.port})`);
});
