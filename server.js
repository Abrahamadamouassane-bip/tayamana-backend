// server.js
require('dotenv').config();

// Log de débogage pour voir les variables
console.log('🔍 Variables DB détectées :');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

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