const { admin } = require('../services/firebase');

/**
 * Firebase Auth Middleware
 * Verifies the Firebase ID Token sent in "Authorization: Bearer <token>"
 * The mobile app gets this token from: FirebaseAuth.instance.currentUser.getIdToken()
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
    // Verify token with Firebase Admin SDK - no JWT secret needed!
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Expose req.user.id across all controllers (mapped from Firebase uid)
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };

    next();
  } catch (err) {
    console.error('Firebase Auth Error:', err.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired Firebase token' });
  }
};

module.exports = authMiddleware;