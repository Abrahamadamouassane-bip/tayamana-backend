// server.js
const app                = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Serveur Tayamana démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur MySQL :', err.message);
    process.exit(1);
  });