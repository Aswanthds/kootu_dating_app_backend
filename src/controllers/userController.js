const { admin, db } = require('../services/firebase');

/**
 * GET ME
 * Fetches the logged-in user's profile and their sub-collections from Firestore.
 */
exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const user = { id: userDoc.id, ...userDoc.data() };

    // Get photos (from sub-collection)
    const photosSnap = await db.collection('users').doc(userId).collection('photos').orderBy('sortOrder', 'asc').get();
    user.photos = photosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get interests (from sub-collection)
    const interestsSnap = await db.collection('users').doc(userId).collection('interests').get();
    user.interests = interestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE PROFILE
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, gender, latitude, longitude } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (gender !== undefined) updateData.gender = gender;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(userId).update(updateData);

    const updatedDoc = await db.collection('users').doc(userId).get();
    res.json({ success: true, message: 'Profile updated successfully', data: { id: updatedDoc.id, ...updatedDoc.data() } });

  } catch (error) {
    next(error);
  }
};

/**
 * FEED (Proximity-based Discovery using Firestore)
 * NOTE: Firestore doesn't support HAVERSINE math natively.
 * We fetch nearby users from Firestore using geo-bounds and filter in memory.
 */
exports.getFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const myDoc = await db.collection('users').doc(userId).get();
    const { latitude: myLat, longitude: myLon } = myDoc.data();

    if (!myLat || !myLon) {
      // No location set: return a random sample
      const snap = await db.collection('users').where('status', '==', 'active').limit(30).get();
      const users = snap.docs.filter(d => d.id !== userId).map(d => ({ id: d.id, ...d.data() }));
      return res.json({ message: 'Share your location for better matches!', users });
    }

    // Fetch who I've already swiped on to exclude them
    const swipedSnap = await db.collection('picks').where('follower_id', '==', userId).get();
    const swipedIds = new Set(swipedSnap.docs.map(d => d.data().following_id));
    swipedIds.add(userId); // also exclude myself

    // Simple lat/lon bounding box (~50 miles)
    const DELTA = 0.72; // ~50 miles in degrees
    const snap = await db.collection('users')
      .where('status', '==', 'active')
      .where('isIncognito', '==', false)
      .where('latitude', '>=', myLat - DELTA)
      .where('latitude', '<=', myLat + DELTA)
      .limit(80)
      .get();

    // Haversine distance filter in memory
    const toRad = (deg) => deg * (Math.PI / 180);
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 3959; // Miles
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const users = snap.docs
      .filter(d => !swipedIds.has(d.id))
      .map(d => ({ id: d.id, distance: haversine(myLat, myLon, d.data().latitude, d.data().longitude), ...d.data() }))
      .filter(u => u.distance < 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30);

    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL INTERESTS
 */
exports.getAllInterests = async (req, res, next) => {
  try {
    const snap = await db.collection('interests').orderBy('name', 'asc').get();
    const interests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE USER INTERESTS
 */
exports.updateUserInterests = async (req, res, next) => {
  try {
    const { interestIds } = req.body;
    const userId = req.user.id;
    const interestsRef = db.collection('users').doc(userId).collection('interests');

    // 1. Delete old interests
    const oldSnap = await interestsRef.get();
    const batch = db.batch();
    oldSnap.docs.forEach(d => batch.delete(d.ref));

    // 2. Add new interests
    if (interestIds && interestIds.length > 0) {
      for (const id of interestIds) {
        batch.set(interestsRef.doc(String(id)), { interest_id: id });
      }
    }

    await batch.commit();
    res.json({ message: 'Interests updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE ACCOUNT
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete Firestore document and sub-collections (photos, interests)
    await db.recursiveDelete(db.collection('users').doc(userId));

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);

    res.json({ success: true, message: 'Account and all associated data permanently deleted.' });
  } catch (error) {
    next(error);
  }
};
