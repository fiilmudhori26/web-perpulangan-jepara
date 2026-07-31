const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const brand = require('../config/brand');

const router = express.Router();

// GET /api/v1/config/brand — ambil brand config (public)
router.get('/brand', async (req, res) => {
  try {
    const config = await brand.getBrand(db);
    res.json({ config });
  } catch (err) {
    console.error('Error loading brand config:', err);
    res.json({ config: brand.getDefaultBrand() });
  }
});

// PUT /api/v1/config/brand — update brand config (admin only)
router.put('/brand', authenticateToken, async (req, res) => {
  try {
    const config = await brand.saveBrand(db, req.body);
    res.json({ config });
  } catch (err) {
    console.error('Error saving brand config:', err);
    res.status(500).json({ error: true, message: 'Gagal menyimpan konfigurasi' });
  }
});

module.exports = router;
