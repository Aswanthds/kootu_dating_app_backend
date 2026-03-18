const { admin, db } = require('../services/firebase');
const crypto = require('crypto');

/**
 * PICK / SWIPE
 */
exports.pickUser = async (req, res, next) => {
  try {
    const { followingId, type } = req.body; // type: 'like' | 'skip'
    const followerId = req.user.id;

    // 1. Save the pick using a deterministic document ID 
    await db.collection('picks').doc(`${followerId}_${followingId}`).set({
      follower_id: followerId,
      following_id: followingId,
      type: type || 'like',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Check for a mutual match only on 'like'
    if (type === 'like' || !type) {
      const reciprocal = await db.collection('picks').doc(`${followingId}_${followerId}`).get();

      if (reciprocal.exists && reciprocal.data().type === 'like') {
        // It's a match! Create a chat room.
        const roomId = crypto.randomUUID();

        // Canonical ordering: smaller uid is always user1 (prevents duplicate rooms)
        const user1_id = followerId < followingId ? followerId : followingId;
        const user2_id = followerId < followingId ? followingId : followerId;

        await db.collection('chat_rooms').doc(roomId).set({
          id: roomId,
          user1_id,
          user2_id,
          last_message: "You matched!",
          last_message_time: admin.firestore.FieldValue.serverTimestamp(),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({ message: "It's a Match!", isMatch: true, chatRoomId: roomId });
      }
    }

    res.json({ message: type === 'skip' ? 'Skipped' : 'Liked', isMatch: false });
  } catch (error) {
    next(error);
  }
};

/**
 * GET MY PICKS (people I liked)
 */
exports.getMyPicks = async (req, res, next) => {
  try {
    const snap = await db.collection('picks')
      .where('follower_id', '==', req.user.id)
      .where('type', '==', 'like')
      .get();

    const picks = [];
    for (const doc of snap.docs) {
      const userDoc = await db.collection('users').doc(doc.data().following_id).get();
      if (userDoc.exists) {
        picks.push({ userId: userDoc.id, name: userDoc.data().name, email: userDoc.data().email, created_at: doc.data().created_at });
      }
    }
    res.json(picks);
  } catch (error) {
    next(error);
  }
};

/**
 * GET MATCHES (mutual likes + chat room ID)
 */
exports.getMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all chat rooms where I am user1 or user2 (I'm in a match)
    const [rooms1, rooms2] = await Promise.all([
      db.collection('chat_rooms').where('user1_id', '==', userId).get(),
      db.collection('chat_rooms').where('user2_id', '==', userId).get()
    ]);

    const allRooms = [...rooms1.docs, ...rooms2.docs];
    const matches = [];

    for (const roomDoc of allRooms) {
      const room = roomDoc.data();
      const otherUserId = room.user1_id === userId ? room.user2_id : room.user1_id;

      const userDoc = await db.collection('users').doc(otherUserId).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        // Get profile photo
        const photoSnap = await db.collection('users').doc(otherUserId)
          .collection('photos')
          .where('isProfilePic', '==', true)
          .limit(1)
          .get();
        const photo_url = photoSnap.empty ? null : photoSnap.docs[0].data().photoUrl;

        matches.push({
          userId: otherUserId,
          name: u.name,
          photo_url,
          chat_room_id: room.id,
          last_message: room.last_message
        });
      }
    }
    res.json(matches);
  } catch (error) {
    next(error);
  }
};

/**
 * WHO PICKED ME (people who liked me)
 */
exports.getWhoPickedMe = async (req, res, next) => {
  try {
    const snap = await db.collection('picks')
      .where('following_id', '==', req.user.id)
      .where('type', '==', 'like')
      .get();

    const picks = [];
    for (const doc of snap.docs) {
      const userDoc = await db.collection('users').doc(doc.data().follower_id).get();
      if (userDoc.exists) {
        picks.push({ userId: userDoc.id, name: userDoc.data().name, email: userDoc.data().email, created_at: doc.data().created_at });
      }
    }
    res.json(picks);
  } catch (error) {
    next(error);
  }
};
