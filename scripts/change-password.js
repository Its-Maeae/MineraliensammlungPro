const bcrypt = require('bcrypt');
const database = require('./lib/database');

const newPassword = '';
bcrypt.hash(newPassword, 10, async (err, hash) => {
  await database.run('UPDATE admin_users SET password_hash = ? WHERE id = 1', [hash]);
  console.log('Passwort erfolgreich geändert');
});