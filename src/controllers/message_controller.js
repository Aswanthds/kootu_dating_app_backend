const { admin, db } = require('../services/firebase');

/**
 * GET MESSAGES (with authorization check)
 */
exports.getMessages = async (req, res, next) => {
  try {
    const roomId = req.body.roomId || req.query.roomId;

    // Security: Verify caller belongs to this chat room
    const roomDoc = await db.collection('chat_rooms').doc(roomId).get();
    if (!roomDoc.exists) return res.status(404).json({ success: false, message: 'Chat room not found' });

    const { user1_id, user2_id } = roomDoc.data();
    if (req.user.id !== user1_id && req.user.id !== user2_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not belong to this chat room' });
    }

    const snap = await db.collection('messages')
      .where('chat_room_id', '==', roomId)
      .orderBy('sent_time', 'asc')
      .get();

    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: messages });

  } catch (err) {
    next(err);
  }
};

/**
 * SEND MESSAGE (with authorization check)
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId, message } = req.body;
    const userId = req.user.id;

    // Security: Verify caller belongs to this chat room before sending
    const roomRef = db.collection('chat_rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ success: false, message: 'Chat room not found' });

    const { user1_id, user2_id } = roomDoc.data();
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to chat room.' });
    }

    // Add message
    const newMsgRef = await db.collection('messages').add({
      chat_room_id: roomId,
      sender_id: userId,
      content: message,
      sent_time: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update last_message on the room for the matches list
    await roomRef.update({
      last_message: message,
      last_message_time: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, data: { messageId: newMsgRef.id } });
  } catch (err) {
    next(err);
  }
};