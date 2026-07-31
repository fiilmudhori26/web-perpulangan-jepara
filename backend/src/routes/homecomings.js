const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, execute } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  let query = 'SELECT * FROM homecomings';
  const params = [];

  if (req.query.periodId) {
    query += ' WHERE periodid = $1';
    params.push(req.query.periodId);
  }
  query += ' ORDER BY createdat DESC';

  const homecomings = await getAll(query, params);
  res.json(homecomings.map(mapHomecoming));
});

router.get('/student/:studentId', authenticateToken, async (req, res) => {
  let query = 'SELECT * FROM homecomings WHERE studentid = $1';
  const params = [req.params.studentId];

  if (req.query.periodId) {
    query += ' AND periodid = $2';
    params.push(req.query.periodId);
  }
  query += ' ORDER BY createdat DESC LIMIT 1';

  const homecoming = await getOne(query, params);
  res.json(homecoming ? mapHomecoming(homecoming) : null);
});

router.post('/', authenticateToken, async (req, res) => {
  const { studentId, periodId, plan, departureDate, mandatoryReturnDate, actualReturnDate, notes } = req.body;
  if (!studentId || !periodId || !plan || !departureDate || !mandatoryReturnDate) {
    return res.status(400).json({ error: true, message: 'studentId, periodId, plan, departureDate, mandatoryReturnDate wajib diisi' });
  }

  const id = uuidv4();
  const now = Date.now();

  await execute(
    'INSERT INTO homecomings (id, studentid, periodid, plan, departuredate, mandatoryreturndate, actualreturndate, notes, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [id, studentId, periodId, plan, departureDate, mandatoryReturnDate, actualReturnDate || null, notes || null, now, now]
  );

  const homecoming = await getOne('SELECT * FROM homecomings WHERE id = $1', [id]);
  res.status(201).json(mapHomecoming(homecoming));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { plan, departureDate, mandatoryReturnDate, actualReturnDate, notes } = req.body;
  const existing = await getOne('SELECT * FROM homecomings WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Data homecoming tidak ditemukan' });

  await execute(
    'UPDATE homecomings SET plan=$1, departuredate=$2, mandatoryreturndate=$3, actualreturndate=$4, notes=$5, updatedat=$6 WHERE id=$7',
    [
      plan || existing.plan,
      departureDate || existing.departuredate,
      mandatoryReturnDate || existing.mandatoryreturndate,
      actualReturnDate !== undefined ? actualReturnDate : existing.actualreturndate,
      notes !== undefined ? notes : existing.notes,
      Date.now(),
      req.params.id
    ]
  );

  const updated = await getOne('SELECT * FROM homecomings WHERE id = $1', [req.params.id]);
  res.json(mapHomecoming(updated));
});

function mapHomecoming(row) {
  return {
    id: row.id,
    studentId: row.studentid,
    periodId: row.periodid,
    plan: row.plan,
    departureDate: row.departuredate,
    mandatoryReturnDate: row.mandatoryreturndate,
    actualReturnDate: row.actualreturndate,
    notes: row.notes,
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

module.exports = router;
