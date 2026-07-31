const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getOne, execute } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'lp3ia-dev-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

async function generateTokens(admin) {
  const accessToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: admin.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await execute(
    'INSERT INTO refresh_tokens (id, adminId, token, expiresAt, createdAt) VALUES ($1, $2, $3, $4, $5)',
    [uuidv4(), admin.id, refreshToken, Date.now() + 7 * 24 * 60 * 60 * 1000, Date.now()]
  );

  return { accessToken, refreshToken, expiresIn: 86400 };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: true, message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: true, message: 'Token tidak valid' });
  }
}

async function refreshAccessToken(refreshToken) {
  const stored = await getOne('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
  if (!stored) throw new Error('Refresh token tidak ditemukan');

  if (stored.expiresat < Date.now()) {
    await execute('DELETE FROM refresh_tokens WHERE id = $1', [stored.id]);
    throw new Error('Refresh token expired');
  }

  const decoded = jwt.verify(refreshToken, JWT_SECRET);
  const admin = await getOne('SELECT * FROM admins WHERE id = $1', [decoded.id]);
  if (!admin) throw new Error('Admin tidak ditemukan');

  await execute('DELETE FROM refresh_tokens WHERE id = $1', [stored.id]);

  return generateTokens(admin);
}

async function revokeRefreshTokens(adminId) {
  await execute('DELETE FROM refresh_tokens WHERE adminId = $1', [adminId]);
}

module.exports = { authenticateToken, generateTokens, refreshAccessToken, revokeRefreshTokens, JWT_SECRET };
