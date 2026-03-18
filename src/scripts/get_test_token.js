/**
 * 🔑 Firebase Token Getter
 * Run this to get a fresh Firebase ID Token for Postman testing.
 *
 * Usage: 
 *   node src/scripts/get_test_token.js test@example.com yourpassword
 */

const https = require('https');
require('dotenv').config();

const email = process.argv[2];
const password = process.argv[3];
const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

if (!email || !password) {
  console.error('❌ Usage: node src/scripts/get_test_token.js <email> <password>');
  process.exit(1);
}

if (!WEB_API_KEY) {
  console.error('❌ Missing FIREBASE_WEB_API_KEY in .env file!');
  console.error('   Go to Firebase Console → Project Settings → General → Web API Key');
  process.exit(1);
}

const body = JSON.stringify({ email, password, returnSecureToken: true });

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.error) {
      console.error('❌ Firebase Error:', parsed.error.message);
      process.exit(1);
    }
    console.log('\n✅ Firebase ID Token (valid for 1 hour):');
    console.log('─'.repeat(60));
    console.log(parsed.idToken);
    console.log('─'.repeat(60));
    console.log('\n📋 Copy the token above and use it in Postman:');
    console.log('   Header: Authorization: Bearer <token>\n');
  });
});

req.on('error', (e) => console.error('❌ Request error:', e.message));
req.write(body);
req.end();
