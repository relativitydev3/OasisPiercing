const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.js "tu_contraseña"');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});
