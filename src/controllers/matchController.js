const pool = require('../services/db');
const crypto = require('crypto');

/**
 * PICK / SWIPE
 */
exports.pickUser = async (req, res, next) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user.id;

    // 1. Save the pick
    await pool.query(
      'INSERT INTO picks (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    // 2. CHECK FOR MATCH (Does the other person also like me?)
    // [SQL]: Find if there is a row where the other person (followingId) liked me (followerId)
    const [matches] = await pool.query(
      'SELECT id FROM picks WHERE follower_id = ? AND following_id = ?',
      [followingId, followerId]
    );

    if (matches.length > 0) {
      // It's a match! Create a chat room
      const roomId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO chat_rooms (id, last_message) VALUES (?, ?)',
        [roomId, 'You matched!']
      );

      return res.json({ message: "It's a Match!", isMatch: true, chatRoomId: roomId });
    }

    res.json({ message: "Liked", isMatch: false });
  } catch (error) {
    next(error);
  }
};

/**
 * MY PICKS
 */
exports.getMyPicks = async (req, res, next) => {
  try {
    // [SQL]: Join picks with users to see who I liked
    const [picks] = await pool.query(
      `SELECT u.name, u.email, p.created_at 
       FROM picks p 
       JOIN users u ON p.following_id = u.id 
       WHERE p.follower_id = ?`,
      [req.user.id]
    );
    res.json(picks);
  } catch (error) {
    next(error);
  }
};

/**
 * LIST PEOPLE WHO PICKED ME
 */
exports.getWhoPickedMe = async (req, res, next) => {
  try {
    const [picks] = await pool.query(
      `SELECT u.name, u.email, p.created_at 
       FROM picks p 
       JOIN users u ON p.follower_id = u.id 
       WHERE p.following_id = ?`,
      [req.user.id]
    );
    res.json(picks);
  } catch (error) {
    next(error);
  }
};

