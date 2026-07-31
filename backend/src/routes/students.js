const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, execute } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const archived = req.query.archived === 'true' ? 1 : 0;
  const students = await getAll('SELECT * FROM students WHERE isarchived = $1 ORDER BY name ASC', [archived]);
  res.json(students.map(mapStudent));
});

router.get('/search', authenticateToken, async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json([]);

  const like = `%${q.trim()}%`;
  const students = await getAll(
    `SELECT * FROM students WHERE isarchived = 0 AND (LOWER(name) LIKE LOWER($1) OR LOWER(room) LIKE LOWER($2) OR LOWER(guardianphone) LIKE LOWER($3)) ORDER BY name ASC`,
    [like, like, like]
  );
  res.json(students.map(mapStudent));
});

router.get('/:id', authenticateToken, async (req, res) => {
  const student = await getOne('SELECT * FROM students WHERE id = $1', [req.params.id]);
  if (!student) return res.status(404).json({ error: true, message: 'Santri tidak ditemukan' });
  res.json(mapStudent(student));
});

router.post('/', authenticateToken, async (req, res) => {
  const { name, room, guardianPhone, address, emergencyContact, notes, plan, departureDate, mandatoryReturnDate, periodId } = req.body;
  if (!name || !room || !guardianPhone) {
    return res.status(400).json({ error: true, message: 'name, room, guardianPhone wajib diisi' });
  }

  const id = uuidv4();
  const now = Date.now();

  await execute(
    'INSERT INTO students (id, name, room, guardianphone, address, emergencycontact, notes, isarchived, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)',
    [id, name, room, guardianPhone, address || null, emergencyContact || null, notes || null, now, now]
  );

  // Auto-create homecoming if plan provided (sync with perpulangan)
  if (plan && periodId) {
    const hcId = uuidv4();
    await execute(
      'INSERT INTO homecomings (id, studentid, periodid, plan, departuredate, mandatoryreturndate, notes, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [hcId, id, periodId, plan, departureDate || null, mandatoryReturnDate || null, notes || null, now, now]
    );
  }

  const student = await getOne('SELECT * FROM students WHERE id = $1', [id]);
  res.status(201).json(mapStudent(student));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { name, room, guardianPhone, address, emergencyContact, notes } = req.body;
  const existing = await getOne('SELECT * FROM students WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Santri tidak ditemukan' });

  await execute(
    'UPDATE students SET name=$1, room=$2, guardianphone=$3, address=$4, emergencycontact=$5, notes=$6, updatedat=$7 WHERE id=$8',
    [
      name || existing.name,
      room || existing.room,
      guardianPhone || existing.guardianphone,
      address !== undefined ? address : existing.address,
      emergencyContact !== undefined ? emergencyContact : existing.emergencycontact,
      notes !== undefined ? notes : existing.notes,
      Date.now(),
      req.params.id
    ]
  );

  const updated = await getOne('SELECT * FROM students WHERE id = $1', [req.params.id]);
  res.json(mapStudent(updated));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const existing = await getOne('SELECT * FROM students WHERE id = $1 AND isarchived = 0', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Santri tidak ditemukan' });

  await execute('UPDATE students SET isarchived = 1, updatedat = $1 WHERE id = $2', [Date.now(), req.params.id]);
  res.status(204).send();
});

function mapStudent(row) {
  return {
    id: row.id,
    name: row.name,
    room: row.room,
    guardianPhone: row.guardianphone,
    address: row.address,
    emergencyContact: row.emergencycontact,
    notes: row.notes,
    isArchived: Boolean(row.isarchived),
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

module.exports = router;
