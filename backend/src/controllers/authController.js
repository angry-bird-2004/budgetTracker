const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_EXPIRES = '30d';
const REFRESH_DAYS = 365;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: ACCESS_EXPIRES,
});

const createRefreshToken = async (userId, deviceLabel) => {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    deviceLabel: deviceLabel || '',
  });
  return token;
};

const buildAuthPayload = async (user, deviceLabel) => {
  const token = generateAccessToken(user._id);
  let refreshToken = '';
  try {
    refreshToken = await createRefreshToken(user._id, deviceLabel);
  } catch (error) {
    console.error('Failed to create refresh token:', error.message);
  }

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    token,
    refreshToken,
  };
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password, deviceLabel } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });

    if (user) {
      return res.status(201).json(await buildAuthPayload(user, deviceLabel));
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = req.body.password;
    const deviceLabel = req.body.deviceLabel;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (user && (await user.matchPassword(password))) {
      return res.json(await buildAuthPayload(user, deviceLabel));
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incoming = req.body.refreshToken;
    if (!incoming || typeof incoming !== 'string') {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(incoming) });
    if (!stored || stored.revokedAt) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      stored.revokedAt = new Date();
      await stored.save();
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      stored.revokedAt = new Date();
      await stored.save();
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    stored.revokedAt = new Date();
    await stored.save();

    return res.json(await buildAuthPayload(user, stored.deviceLabel || req.body.deviceLabel));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const incoming = req.body.refreshToken;
    if (incoming && typeof incoming === 'string') {
      const stored = await RefreshToken.findOne({ tokenHash: hashToken(incoming) });
      if (stored && !stored.revokedAt) {
        stored.revokedAt = new Date();
        await stored.save();
      }
    }
    return res.json({ message: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
