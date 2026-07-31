const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, execute } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const periods = await getAll('SELECT * FROM periods WHERE isArchived = 0 ORDER BY createdAt DESC');
  res.json(periods.map(mapPeriod));
});

router.get('/:id', authenticateToken, async (req, res) => {
  const period = await getOne('SELECT * FROM periods WHERE id = $1 AND isArchived = 0', [req.params.id]);
  if (!period) return res.status(404).json({ error: true, message: 'Periode tidak ditemukan' });
  res.json(mapPeriod(period));
});

router.post('/', authenticateToken, async (req, res) => {
  const { name, startDate, returnDeadlineDate, feeAmount, description, isActive } = req.body;
  if (!name || !startDate || !returnDeadlineDate || feeAmount === undefined) {
    return res.status(400).json({ error: true, message: 'name, startDate, returnDeadlineDate, feeAmount wajib diisi' });
  }

  if (isActive) {
    await execute('UPDATE periods SET isActive = 0 WHERE isActive = 1');
  }

  const id = uuidv4();
  const now = Date.now();
  await execute(
    'INSERT INTO periods (id, name, startDate, returnDeadlineDate, feeAmount, description, isActive, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [id, name, startDate, returnDeadlineDate, feeAmount, description || null, isActive ? 1 : 0, now, now]
  );

  const period = await getOne('SELECT * FROM periods WHERE id = $1', [id]);
  res.status(201).json(mapPeriod(period));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { name, startDate, returnDeadlineDate, feeAmount, description, isActive } = req.body;
  const existing = await getOne('SELECT * FROM periods WHERE id = $1 AND isArchived = 0', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Periode tidak ditemukan' });

  if (isActive) {
    await execute('UPDATE periods SET isActive = 0 WHERE isActive = 1 AND id != $1', [req.params.id]);
  }

  await execute(
    'UPDATE periods SET name=$1, startDate=$2, returnDeadlineDate=$3, feeAmount=$4, description=$5, isActive=$6, updatedAt=$7 WHERE id=$8',
    [
      name || existing.name,
      startDate || existing.startdate,
      returnDeadlineDate || existing.returndeadlinedate,
      feeAmount !== undefined ? feeAmount : existing.feeamount,
      description !== undefined ? description : existing.description,
      isActive !== undefined ? (isActive ? 1 : 0) : existing.isactive,
      Date.now(),
      req.params.id
    ]
  );

  const updated = await getOne('SELECT * FROM periods WHERE id = $1', [req.params.id]);
  res.json(mapPeriod(updated));
});

router.put('/:id/active', authenticateToken, async (req, res) => {
  const existing = await getOne('SELECT * FROM periods WHERE id = $1 AND isArchived = 0', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Periode tidak ditemukan' });

  await execute('UPDATE periods SET isActive = 0 WHERE isActive = 1');
  await execute('UPDATE periods SET isActive = 1, updatedAt = $1 WHERE id = $2', [Date.now(), req.params.id]);

  const updated = await getOne('SELECT * FROM periods WHERE id = $1', [req.params.id]);
  res.json(mapPeriod(updated));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const existing = await getOne('SELECT * FROM periods WHERE id = $1 AND isArchived = 0', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Periode tidak ditemukan' });

  await execute('UPDATE periods SET isArchived = 1, updatedAt = $1 WHERE id = $2', [Date.now(), req.params.id]);
  res.status(204).send();
});

function mapPeriod(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startdate,
    returnDeadlineDate: row.returndeadlinedate,
    feeAmount: row.feeamount,
    description: row.description,
    isActive: Boolean(row.isactive),
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

module.exports = router;
