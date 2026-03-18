const pool = require('../services/pg_db');
const crypto = require('crypto');

/**
 * 🧪 Welcome to PostgreSQL! 
 * This script will create a standalone table and test the two biggest differences 
 * between MySQL and Postgres: Syntax and Placeholders ($1).
 */
async function testPostgres() {
  try {
    console.log('🔗 Connecting to PostgreSQL...');

    // Difference 1: Table Creation Syntax 
    // Notice SERIAL instead of AUTO_INCREMENT, and UUID instead of VARCHAR(36)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pg_test_users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "pg_test_users" created successfully.');

    // Difference 2: Parameterization ($1, $2 instead of ?, ?)
    const newId = crypto.randomUUID();
    const queryName = 'Postgres Pioneer';

    const insertResult = await pool.query(
      'INSERT INTO pg_test_users (id, name) VALUES ($1, $2) RETURNING id, name', 
      [newId, queryName]
    );

    // Difference 3: Return Data Structure is slightly different 
    // In pg, you access results through .rows instead of array destructuring
    console.log(`✅ Inserted User:`, insertResult.rows[0]);

    // Difference 4: UPSERT logic 
    // MySQL: ON DUPLICATE KEY UPDATE | Postgres: ON CONFLICT (id) DO UPDATE
    await pool.query(
      `INSERT INTO pg_test_users (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = $3`,
      [newId, 'Updated Pioneer', 'Updated Pioneer']
    );

    // Fetch and prove update
    const fetchResult = await pool.query('SELECT * FROM pg_test_users WHERE id = $1', [newId]);
    console.log('✅ Fetched User after Upsert:', fetchResult.rows[0]);

    console.log('🏁 PostgreSQL Test Complete! You are now a mult-db developer.');
    process.exit(0);

  } catch (err) {
    console.error('❌ PostgreSQL Error:', err.message);
    console.error('Hint: Make sure POSTGRES_URL is correct in your .env file!');
    process.exit(1);
  }
}

testPostgres();
