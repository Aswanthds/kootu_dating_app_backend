const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;
try {
  serviceAccount = require('../../firebase-service-account.json');
} catch (e) {
  console.error('❌ firebase-service-account.json not found in project root!');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = { admin, db };
