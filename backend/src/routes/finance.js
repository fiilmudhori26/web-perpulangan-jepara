const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, execute } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', authenticateToken, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: true, message: 'periodId wajib diisi' });

  const totalIncomeRow = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE periodid = $1 AND isarchived = 0', [periodId]);
  const totalExpenseRow = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE periodid = $1 AND isarchived = 0', [periodId]);
  const studentPayRow = await getOne(
    `SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE periodid = $1 AND (category = 'Pembayaran Santri' OR ispaymentauto = 1) AND isarchived = 0`,
    [periodId]
  );

  const totalIncome = parseFloat(totalIncomeRow?.total || 0);
  const totalExpense = parseFloat(totalExpenseRow?.total || 0);
  const studentPaymentIncome = parseFloat(studentPayRow?.total || 0);
  const otherIncome = totalIncome - studentPaymentIncome;

  res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, studentPaymentIncome, otherIncome });
});

router.get('/incomes', authenticateToken, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: true, message: 'periodId wajib diisi' });

  const incomes = await getAll('SELECT * FROM incomes WHERE periodid = $1 AND isarchived = 0 ORDER BY createdat DESC', [periodId]);
  res.json(incomes.map(mapIncome));
});

router.post('/incomes', authenticateToken, async (req, res) => {
  const { periodId, date, category, description, amount, attachmentPath } = req.body;
  if (!periodId || !date || !category || !description || amount === undefined) {
    return res.status(400).json({ error: true, message: 'periodId, date, category, description, amount wajib diisi' });
  }

  const id = uuidv4();
  const now = Date.now();

  await execute(
    'INSERT INTO incomes (id, periodid, date, category, description, amount, attachmentpath, ispaymentauto, paymentid, isarchived, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NULL, 0, $8, $9)',
    [id, periodId, date, category, description, amount, attachmentPath || null, now, now]
  );

  const income = await getOne('SELECT * FROM incomes WHERE id = $1', [id]);
  res.status(201).json(mapIncome(income));
});

router.get('/expenses', authenticateToken, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: true, message: 'periodId wajib diisi' });

  const expenses = await getAll('SELECT * FROM expenses WHERE periodid = $1 AND isarchived = 0 ORDER BY createdat DESC', [periodId]);
  res.json(expenses.map(mapExpense));
});

router.post('/expenses', authenticateToken, async (req, res) => {
  const { periodId, date, category, description, amount, attachmentPath } = req.body;
  if (!periodId || !date || !category || !description || amount === undefined) {
    return res.status(400).json({ error: true, message: 'periodId, date, category, description, amount wajib diisi' });
  }

  const id = uuidv4();
  const now = Date.now();

  await execute(
    'INSERT INTO expenses (id, periodid, date, category, description, amount, attachmentpath, isarchived, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)',
    [id, periodId, date, category, description, amount, attachmentPath || null, now, now]
  );

  const expense = await getOne('SELECT * FROM expenses WHERE id = $1', [id]);
  res.status(201).json(mapExpense(expense));
});

function mapIncome(row) {
  return {
    id: row.id,
    periodId: row.periodid,
    date: row.date,
    category: row.category,
    description: row.description,
    amount: row.amount,
    attachmentPath: row.attachmentpath,
    isArchived: Boolean(row.isarchived),
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

function mapExpense(row) {
  return {
    id: row.id,
    periodId: row.periodid,
    date: row.date,
    category: row.category,
    description: row.description,
    amount: row.amount,
    attachmentPath: row.attachmentpath,
    isArchived: Boolean(row.isarchived),
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

module.exports = router;
