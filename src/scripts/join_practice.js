const pool = require('../services/pg_db');

async function practice() {
  try {
    console.log('\n--- 🧪 SQL JOIN PRACTICE SESSION ---\n');

    // 1. SIMPLE INNER JOIN (Matching Users and Interests)
    console.log('1. INNER JOIN: Users and their Interest names');
    const { rows: rows1 } = await pool.query(`
      SELECT u.name as user_name, i.name as interest_name 
      FROM users u 
      INNER JOIN user_interests ui ON u.id = ui.user_id 
      INNER JOIN interests i ON ui.interest_id = i.id 
      LIMIT 10
    `);
    console.table(rows1);
    console.log('Check: Note how each row pairs a user with ONE interest.\n');

    // 2. AGGREGATE JOIN (Counting)
    console.log('2. JOIN + GROUP BY: Counting Interests per User');
    const { rows: rows2 } = await pool.query(`
      SELECT u.name, COUNT(ui.interest_id) as total_interests 
      FROM users u 
      LEFT JOIN user_interests ui ON u.id = ui.user_id 
      GROUP BY u.id 
      LIMIT 10
    `);
    console.table(rows2);
    console.log('Check: LEFT JOIN ensures even users with 0 interests show up.\n');

    // 3. THE "LINKEDIN" STYLE JOIN (Picks/Likes)
    console.log('3. SELF-JOIN ANALOGY: Who liked whom?');
    const { rows: rows3 } = await pool.query(`
      SELECT 
        u1.name as "Who Liked", 
        u2.name as "Who was Liked"
      FROM picks p
      JOIN users u1 ON p.follower_id = u1.id
      JOIN users u2 ON p.following_id = u2.id
      LIMIT 10
    `);
    console.table(rows3);
    console.log('Check: Here we join the "users" table TWICE to get names for both IDs.\n');

    console.log('--- ✅ End of Practice ---');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

practice();
