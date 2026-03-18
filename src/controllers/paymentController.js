const { admin, db } = require('../services/firebase');

/**
 * VERIFY PURCHASE (Server-Side Receipt Verification)
 * Called after a successful in-app purchase from the mobile app.
 * The backend is the only safe place to upgrade a user to premium.
 */
exports.verifyPurchase = async (req, res, next) => {
  try {
    const { purchaseToken, productId } = req.body;
    const userId = req.user.id;

    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    // 1. Log the subscription record in Firestore
    await db.collection('subscriptions').add({
      user_id: userId,
      purchase_token: purchaseToken,
      plan_id: productId,
      expiry_date: admin.firestore.Timestamp.fromDate(expiryDate),
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Grant premium access to the user document
    await db.collection('users').doc(userId).update({
      isPremium: true,
      premiumExpiry: admin.firestore.Timestamp.fromDate(expiryDate)
    });

    res.json({
      success: true,
      data: { message: 'Subscription verified. Premium access granted!' }
    });
  } catch (err) {
    next(err);
  }
};