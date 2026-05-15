// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               'mysql.railway.internal',
  port:               3306,
  user:               'root',
  password:           'rAomLQcrSyodCfofOvEMpbhYkIwROxDT',
  database:           'railway',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00',
});

const testConnection = async () => {
  const conn = await pool.getConnection();
  console.log('✅ Connecté à MySQL : railway');
  conn.release();
};

module.exports = { pool, testConnection };