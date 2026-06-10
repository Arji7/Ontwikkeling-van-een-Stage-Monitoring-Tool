
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'stage_monitor',
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connectie mislukt:', err.message);
    return;
  }
  console.log('✅ Verbonden met MySQL database');
  connection.release();
});

module.exports = pool.promise();