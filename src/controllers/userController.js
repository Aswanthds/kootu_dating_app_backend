const pool = require('../services/db');

/**
 * GET ME
 */
exports.getMe = async (req, res, next) => {
  try {
    // [SQL]: Get user info and their photos
    const [users] = await pool.query('SELECT id, email, name, bio, gender, status FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    // Get photos in a separate query for simplicity
    const [photos] = await pool.query('SELECT * FROM user_photos WHERE user_id = ? ORDER BY sort_order ASC', [req.user.id]);
    user.photos = photos;

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
    const { name, bio, gender } = req.body;

    // [SQL]: UPDATE users SET name = ?, bio = ?, gender = ? WHERE id = ?
    await pool.query(
      'UPDATE users SET name = ?, bio = ?, gender = ? WHERE id = ?',
      [name, bio, gender, req.user.id]
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    next(error);
  }
};

/**
 * FEED
 */
exports.getFeed = async (req, res, next) => {
  try {
    // [SQL]: List other active users
    const [users] = await pool.query(
      'SELECT id, name, bio FROM users WHERE id != ? AND status = "active" LIMIT 20',
      [req.user.id]
    );

    res.json(users);
  } catch (error) {
    next(error);
  }
};
