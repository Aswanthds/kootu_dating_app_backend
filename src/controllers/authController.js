const { admin, db } = require('../services/firebase');

/**
 * REGISTER (Create user in Firebase Auth + Firestore)
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // 1. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // 2. Create a user profile document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      name,
      bio: null,
      gender: null,
      latitude: null,
      longitude: null,
      isPremium: false,
      status: 'active',
      isIncognito: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Create a custom token for the client to sign in with
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    res.status(201).json({ message: 'Registered successfully', customToken, userId: userRecord.uid });

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    next(error);
  }
};

/**
 * LOGIN
 * NOTE: In a Firebase setup, login is typically handled entirely on the client (mobile app)
 * using FirebaseAuth.signInWithEmailAndPassword(). The client gets the ID token and sends
 * it with every request. This endpoint is a server-side fallback.
 */
exports.login = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Look up user by email in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // Generate a custom token for the client to exchange for an ID token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Also fetch profile from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};

    res.json({
      message: 'Login successful',
      customToken,
      user: { id: userRecord.uid, email: userRecord.email, ...userProfile }
    });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    next(error);
  }
};

/**
 * GOOGLE AUTH
 * The client already handles Google sign-in via Firebase Auth SDK.
 * This endpoint exists to ensure a Firestore profile is created after first sign-in.
 */
exports.googleAuth = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware (already verified Firebase token)
    const { id: uid, email, name } = req.user;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // First time Google login: create a profile doc
      await userRef.set({
        id: uid,
        email,
        name: name || 'New User',
        bio: null,
        gender: null,
        latitude: null,
        longitude: null,
        isPremium: false,
        status: 'active',
        isIncognito: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ message: 'Google auth profile verified', user: { id: uid, email, name } });

  } catch (error) {
    next(error);
  }
};
