const fs = require('fs');
const path = require('path');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Replace array destructuring with row destructuring
  // e.g., const [users] = await pool.query -> const { rows: users } = await pool.query
  content = content.replace(/const\s+\[\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*await\s+pool\.query\(/g, 'const { rows: $1 } = await pool.query(');
  
  // Also handle cases like: const [result] = ...
  // Although sometimes we don't care about result, it's fine.

  // 2. Replace placeholders `?` with `$1, $2`
  // This is slightly tricky, we have to match query strings and replace ? inside them
  const queryRegex = /(pool\.query\s*\(\s*)(`[^`]+`|'[^']+'|"[^"]+")/g;
  content = content.replace(queryRegex, (match, prefix, queryString) => {
    let index = 1;
    // Replace ? not inside string quotes? The query string itself is inside backticks or quotes.
    // So we just replace ? with $index inside that string.
    const newQueryString = queryString.replace(/\?/g, () => `$${index++}`);
    return prefix + newQueryString;
  });

  // 3. PostgreSQL specific UPSERT syntax replacements
  // ON DUPLICATE KEY UPDATE -> ON CONFLICT (...) DO UPDATE
  // This is harder to automate perfectly, so we'll do known ones:
  if (content.includes('ON DUPLICATE KEY UPDATE answer_text = ?')) {
    content = content.replace('ON DUPLICATE KEY UPDATE answer_text = ?', 'ON CONFLICT (user_id, question_id) DO UPDATE SET answer_text = $4');
  }
  
  // 4. Update the DB import 
  // const pool = require('../services/db'); -> const pool = require('../services/pg_db');
  content = content.replace(/require\(['"]\.\.\/services\/db['"]\)/g, "require('../services/pg_db')");
  content = content.replace(/require\(['"]\.\/src\/services\/db['"]\)/g, "require('./src/services/pg_db')");

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Refactored:', filePath);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      refactorFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src/controllers'));
walkDir(path.join(__dirname, 'src/scripts'));
