const express = require('express');
const bcrypt = require('bcryptjs');
const { getOne } = require('../config/database');
const { generateTokens, refreshAccessToken, revokeRefreshTokens, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: true, message: 'Email dan password harus diisi' });
  }

  const admin = await getOne('SELECT * FROM admins WHERE email = $1', [email.trim().toLowerCase()]);
  if (!admin) {
    return res.status(401).json({ error: true, message: 'Email atau password salah' });
  }

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) {
    return res.status(401).json({ error: true, message: 'Email atau password salah' });
  }

  const tokens = await generateTokens(admin);
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: true, message: 'Refresh token diperlukan' });
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: true, message: err.message });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  await revokeRefreshTokens(req.admin.id);
  res.json({ message: 'Logout berhasil' });
});

router.post('/me', authenticateToken, async (req, res) => {
  const admin = await getOne('SELECT id, email, name, role FROM admins WHERE id = $1', [req.admin.id]);
  if (!admin) return res.status(404).json({ error: true, message: 'Admin tidak ditemukan' });
  res.json({ admin });
});

module.exports = router;
