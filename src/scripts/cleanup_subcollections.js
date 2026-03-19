const admin = require("firebase-admin");
const serviceAccount = require("../../firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// const db = admin.firestore();

// const SUBS = ["blocked_by", "myPicks", "notify", "whoPicksMe"];

// // Pick up a single user ID from the command line: node cleanup.js <userId>
// const TARGET_USER_ID = process.argv[2] || null;

// async function cleanUser(userRef) {
//   for (const sub of SUBS) {
//     const snap = await userRef.collection(sub).get();
//     if (snap.size > 0) {
//       for (const doc of snap.docs) {
//         await doc.ref.delete();
//       }
//       console.log(`  🗑️  Deleted ${snap.size} docs from /${userRef.id}/${sub}`);
//     } else {
//       console.log(`  ✔️  /${userRef.id}/${sub} already empty`);
//     }
//   }
//   console.log(`✅ Cleaned user: ${userRef.id}\n`);
// }

// async function run() {
//   if (TARGET_USER_ID) {
//     // ✅ SINGLE USER MODE (safe for testing)
//     console.log(`🎯 Single-user mode. Targeting: ${TARGET_USER_ID}\n`);
//     const userRef = db.collection("users").doc(TARGET_USER_ID);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       console.error(`❌ User ${TARGET_USER_ID} not found in Firestore.`);
//       process.exit(1);
//     }

//     await cleanUser(userRef);
//     console.log("🔥 Done!");
//   } else {
//     // ⚠️ ALL USERS MODE
//     console.log("⚠️  No user ID provided. Running on ALL users...\n");
//     const users = await db.collection("users").get();
//     console.log(`Found ${users.size} users.\n`);
//     for (const user of users.docs) {
//       await cleanUser(user.ref);
//     }
//     console.log("🔥 Done! All sub-collections wiped.");
//   }

//   process.exit(0);
// }

// run().catch((err) => {
//   console.error("❌ Error:", err.message);
//   process.exit(1);
// });

async function deleteAllUsers() {
  let nextPageToken;

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

    const uids = listUsersResult.users.map(user => user.uid);

    if (uids.length > 0) {
      await admin.auth().deleteUsers(uids);
      console.log(`Deleted ${uids.length} users`);
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log("✅ All users deleted");
}

deleteAllUsers();