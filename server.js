// server.js
require('dotenv').config();

console.log('🔍 Variables détectées :');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);

const app                = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Serveur Tayamana démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de se connecter à MySQL :', err.message);
    process.exit(1);
  });