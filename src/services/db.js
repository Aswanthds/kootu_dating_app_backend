const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool. 
// A pool is better than a single connection because it can handle multiple users at once.
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// We export the pool so we can run queries in our controllers
module.exports = pool;
