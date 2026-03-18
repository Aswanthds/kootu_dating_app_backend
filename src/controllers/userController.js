const pool = require('../services/db');

/**
 * GET ME
 */
exports.getMe = async (req, res, next) => {
  try {
    // [SQL]: Get user info and their photos
    const [users] = await pool.query('SELECT id, email, name, bio, gender,latitude,longitude, status FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    // Get photos
    const [photos] = await pool.query('SELECT * FROM user_photos WHERE user_id = ? ORDER BY sort_order ASC', [req.user.id]);
    user.photos = photos;

    // Get interests
    const [interests] = await pool.query(
      'SELECT i.id, i.name FROM interests i JOIN user_interests ui ON i.id = ui.interest_id WHERE ui.user_id = ?',
      [req.user.id]
    );
    user.interests = interests;

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

    // 1. UPDATE: We add the new fields to the query
    await pool.query(
      'UPDATE users SET name = ?, bio = ?, gender = ?, latitude = ?, longitude = ? WHERE id = ?',
      [name, bio, gender, latitude, longitude, userId]
    );

    // 2. RE-FETCH: Get the full updated profile to send back to the app
    const [users] = await pool.query(
      'SELECT id, email, name, bio, gender, latitude, longitude, status FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];

    // 3. ATTACH EXTRAS: Get photos and interests as well
    const [photos] = await pool.query('SELECT * FROM user_photos WHERE user_id = ? ORDER BY sort_order ASC', [userId]);
    user.photos = photos;

    const [interests] = await pool.query(
      'SELECT i.id, i.name FROM interests i JOIN user_interests ui ON i.id = ui.interest_id WHERE ui.user_id = ?',
      [userId]
    );
    user.interests = interests;

    // 4. RETURN: The app now has the latest data immediately
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });

  } catch (error) {
    next(error);
  }
};


/**
 * FEED (Smarter Discovery with Distance/Proximity)
 */
exports.getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // 1. Get the current user's coordinates first
    const [me] = await pool.query('SELECT latitude, longitude FROM users WHERE id = ?', [currentUserId]);
    const { latitude: myLat, longitude: myLon } = me[0];

    // If the user hasn't shared their location, we show random users
    if (!myLat || !myLon) {
      const [users] = await pool.query('SELECT id, name, bio FROM users WHERE id != ? LIMIT 30', [currentUserId]);
      return res.json({ message: "Share your location for better matches!", users });
    }

    // 2. The Big Matchmaking Query (Now with Profile Filtering!)
    const sql = `
      SELECT 
        u.id, u.name, u.bio,
        COUNT(target_ui.interest_id) as shared_interest_count,
        -- HAVERSINE FORMULA (Calculates distance in Miles)
        (3959 * acos(cos(radians(?)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(?)) + sin(radians(?)) * sin(radians(u.latitude)))) AS distance
      FROM users u
      LEFT JOIN user_interests target_ui ON u.id = target_ui.user_id
        AND target_ui.interest_id IN (
          SELECT interest_id FROM user_interests WHERE user_id = ?
        )
      WHERE u.id != ? 
        AND u.status = 'active'
        AND u.is_incognito = 0
        AND u.latitude IS NOT NULL 
        -- 🔥 NEW: EXCLUSION LOGIC 🔥
        -- "Only show people I HAVEN'T already liked/swiped"
        AND u.id NOT IN (
          SELECT following_id FROM picks WHERE follower_id = ?
        )
      GROUP BY u.id
      HAVING distance < 50 
      ORDER BY distance ASC, shared_interest_count DESC
      LIMIT 30
    `;

    // We pass our latitude and longitude into the query placeholders
    // Now we also pass currentUserId one extra time for the NOT IN clause
    const [users] = await pool.query(sql, [myLat, myLon, myLat, currentUserId, currentUserId, currentUserId]);


    res.json(users);
  } catch (error) {
    next(error);
  }
};


/**
 * GET ALL AVAILABLE INTERESTS
 */
exports.getAllInterests = async (req, res, next) => {
  try {
    const [interests] = await pool.query('SELECT * FROM interests ORDER BY id ASC');
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
    const { interestIds } = req.body; // Expecting an array of numbers like [1, 3, 5]
    const userId = req.user.id;

    // 1. Remove old interests
    await pool.query('DELETE FROM user_interests WHERE user_id = ?', [userId]);

    // 2. Add new ones (if any)
    if (interestIds && interestIds.length > 0) {
      // Bulding a bulk insert: INSERT INTO user_interests (user_id, interest_id) VALUES (?,?), (?,?) ...
      const values = interestIds.map(id => [userId, id]);
      await pool.query('INSERT INTO user_interests (user_id, interest_id) VALUES ?', [values]);
    }

    res.json({ message: "Interests updated successfully" });
  } catch (error) {
    next(error);
  }
};

