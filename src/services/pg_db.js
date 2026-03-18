const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
// This uses POSTGRES_URL from your .env file
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // If you are using a cloud provider like Supabase/Render, uncomment the lines below:
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

module.exports = pool;
