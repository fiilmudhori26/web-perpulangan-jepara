const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, execute } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  let query = 'SELECT * FROM payments WHERE isarchived = 0';
  const params = [];

  if (req.query.periodId) {
    query += ' AND periodid = $1';
    params.push(req.query.periodId);
  }
  query += ' ORDER BY createdat DESC';

  const payments = await getAll(query, params);
  res.json(payments.map(mapPayment));
});

router.get('/student/:studentId', authenticateToken, async (req, res) => {
  let query = 'SELECT * FROM payments WHERE studentid = $1 AND isarchived = 0';
  const params = [req.params.studentId];

  if (req.query.periodId) {
    query += ' AND periodid = $2';
    params.push(req.query.periodId);
  }
  query += ' ORDER BY createdat DESC';

  const payments = await getAll(query, params);
  res.json(payments.map(mapPayment));
});

router.post('/', authenticateToken, async (req, res) => {
  const { studentId, periodId, amount, date, method, notes, receiptPath } = req.body;
  if (!studentId || !periodId || amount === undefined || !date || !method) {
    return res.status(400).json({ error: true, message: 'studentId, periodId, amount, date, method wajib diisi' });
  }

  const id = uuidv4();
  const now = Date.now();

  await execute(
    'INSERT INTO payments (id, studentid, periodid, amount, date, method, notes, receiptpath, isarchived, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)',
    [id, studentId, periodId, amount, date, method, notes || null, receiptPath || null, now, now]
  );

  const payment = await getOne('SELECT * FROM payments WHERE id = $1', [id]);
  await syncIncomeFromPayment(payment, 'create');

  res.status(201).json(mapPayment(payment));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const existing = await getOne('SELECT * FROM payments WHERE id = $1 AND isarchived = 0', [req.params.id]);
  if (!existing) return res.status(404).json({ error: true, message: 'Pembayaran tidak ditemukan' });

  await execute('UPDATE payments SET isarchived = 1, updatedat = $1 WHERE id = $2', [Date.now(), req.params.id]);
  await execute('UPDATE incomes SET isarchived = 1 WHERE paymentid = $1', [req.params.id]);

  res.status(204).send();
});

async function syncIncomeFromPayment(payment, action) {
  if (action === 'create') {
    const income = await getOne('SELECT * FROM incomes WHERE paymentid = $1', [payment.id]);
    if (!income) {
      await execute(
        'INSERT INTO incomes (id, periodid, date, category, description, amount, attachmentpath, ispaymentauto, paymentid, isarchived, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, 0, $9, $10)',
        [uuidv4(), payment.periodid, payment.date, 'Pembayaran Santri', 'Pembayaran santri', payment.amount, payment.receiptpath, payment.id, Date.now(), Date.now()]
      );
    }
  }
}

function mapPayment(row) {
  return {
    id: row.id,
    studentId: row.studentid,
    periodId: row.periodid,
    amount: row.amount,
    date: row.date,
    method: row.method,
    notes: row.notes,
    receiptPath: row.receiptpath,
    isArchived: Boolean(row.isarchived),
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

module.exports = router;
