const pool = require('../services/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * EMAIL REGISTER
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // 1. Check if user already exists
    // [SQL]: SELECT * FROM users WHERE email = ?
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert new user
    // [SQL]: INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)
    const userId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
      [userId, email, name, hashedPassword]
    );

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.status(201).json({ message: "Registered", token, userId });

  } catch (error) {
    next(error);
  }
};

/**
 * EMAIL LOGIN
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error) {
    next(error);
  }
};

/**
 * GOOGLE AUTH
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name } = ticket.getPayload();

    // 1. Check if they exist
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = users[0];

    if (!user) {
      // 2. If not, Create them
      const userId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO users (id, email, name, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [userId, email, name, 'GOOGLE_USER', 'active']
      );
      user = { id: userId, email, name };
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user });

  } catch (error) {
    res.status(401).json({ error: "Google verification failed" });
  }
};
