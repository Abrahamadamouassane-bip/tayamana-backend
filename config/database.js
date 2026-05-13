// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.MYSQLPORT     || process.env.DB_PORT)    || 3306,
  user:               process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
  password:           process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database:           process.env.MYSQLDATABASE || process.env.DB_NAME     || 'railway',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00',
});

const testConnection = async () => {
  const conn = await pool.getConnection();
  console.log('✅ Connecté à MySQL :', process.env.MYSQLDATABASE || process.env.DB_NAME);
  conn.release();
};

module.exports = { pool, testConnection };