const pool = require('../services/pg_db');
const crypto = require('crypto');

/**
 * PICK / SWIPE (Support Like and Skip)
 */
exports.pickUser = async (req, res, next) => {
  try {
    const { followingId, type } = req.body; // type can be 'like' or 'skip'
    const followerId = req.user.id;

    // 1. Save the pick with the specific type
    await pool.query(
      'INSERT INTO picks (follower_id, following_id, type) VALUES ($1, $2, $3)',
      [followerId, followingId, type || 'like']
    );

    // 2. CHECK FOR MATCH (Only if it's a "Like")
    if (type === 'like' || !type) {
      // Find if there is a 'like' from the other person back to me
      const { rows: matches } = await pool.query(
        'SELECT id FROM picks WHERE follower_id = $1 AND following_id = $2 AND type = "like"  ',
        [followingId, followerId]
      );

      if (matches.length > 0) {
        // It's a match! Create a chat room
        const roomId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO chat_rooms (id,user1_id, user2_id, last_message) VALUES ($1, $2, $3, $4)',
          [roomId, followerId, followingId, 'You matched!']
        );

        return res.json({ message: "It's a Match!", isMatch: true, chatRoomId: roomId });
      }
    }

    res.json({ message: type === 'skip' ? "Skipped" : "Liked", isMatch: false });
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
    const { rows: picks } = await pool.query(
      `SELECT u.name, u.email, p.created_at 
       FROM picks p 
       JOIN users u ON p.following_id = u.id 
       WHERE p.follower_id = $1`,
      [req.user.id]
    );
    res.json(picks);
  } catch (error) {
    next(error);
  }
};
exports.getMatches = async (req, res, next) => {
  try {
    // [SQL]: Join picks with users to see who I liked
    const { rows: picks } = await pool.query(
      `SELECT
    u.name,
    cr.id as chat_room_id,
    u.id as userId,
    up.photo_url
FROM picks p1
-- Join to another row in Picks where the IDs are flipped (Reciprocal like)
JOIN picks p2 ON p1.follower_id = p2.following_id
              AND p1.following_id = p2.follower_id
-- Join to Users to get the details of the other person (p1.following_id)
JOIN users u ON p1.following_id = u.id
-- Join to chat_rooms to get the chat room id
JOIN chat_rooms cr ON
   (cr.user1_id = p1.follower_id AND cr.user2_id = p1.following_id)
   OR
   (cr.user1_id = p1.following_id AND cr.user2_id = p1.follower_id)
-- Join to Photos to get their profile picture
LEFT JOIN user_photos up ON u.id = up.user_id AND up.is_profile_pic = 1
WHERE p1.follower_id = $1 -- Only for ME
  AND p1.type = 'like'
  AND p2.type = 'like';

`,
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
    const { rows: picks } = await pool.query(
      `SELECT u.name, u.email, p.created_at 
       FROM picks p 
       JOIN users u ON p.follower_id = u.id 
       WHERE p.following_id = $1`,
      [req.user.id]
    );
    res.json(picks);
  } catch (error) {
    next(error);
  }
};

