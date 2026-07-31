const express = require('express');
const { getOne, getAll } = require('../config/database');

const router = express.Router();

router.post('/santri/search', async (req, res) => {
  const { studentName, guardianPhone } = req.body;
  if (!studentName || !guardianPhone) {
    return res.status(400).json({ error: true, message: 'studentName dan guardianPhone wajib diisi' });
  }

  const cleanPhone = guardianPhone.replace(/[^0-9]/g, '');

  if (studentName.trim().length < 2 || cleanPhone.length < 5) {
    return res.status(400).json({ error: true, message: 'Nama terlalu pendek atau nomor tidak valid' });
  }

  const student = await getOne(
    'SELECT * FROM students WHERE LOWER(name) = LOWER($1) AND isarchived = 0 LIMIT 1',
    [studentName.trim()]
  );

  if (!student) {
    return res.status(404).json({ error: true, message: 'Data santri tidak ditemukan' });
  }

  const studentPhone = student.guardianphone.replace(/[^0-9]/g, '');
  if (!studentPhone.endsWith(cleanPhone)) {
    return res.status(404).json({ error: true, message: 'Data santri tidak ditemukan' });
  }

  const period = await getOne('SELECT * FROM periods WHERE isactive = 1 AND isarchived = 0 LIMIT 1');
  if (!period) {
    return res.status(404).json({ error: true, message: 'Tidak ada periode aktif' });
  }

  const homecoming = await getOne(
    'SELECT * FROM homecomings WHERE studentid = $1 AND periodid = $2 ORDER BY createdat DESC LIMIT 1',
    [student.id, period.id]
  );

  const payments = await getAll(
    'SELECT * FROM payments WHERE studentid = $1 AND periodid = $2 AND isarchived = 0',
    [student.id, period.id]
  );

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const multiplier = homecoming?.plan === 'PULANG PERGI' ? 2 : 1;
  const totalFee = period.feeamount * multiplier;
  const remaining = Math.max(0, totalFee - totalPaid);
  const paymentStatus = totalPaid <= 0 ? 'BELUM BAYAR' : totalPaid >= totalFee ? 'LUNAS' : 'DP';

  res.json({
    studentName: student.name,
    room: student.room,
    guardianPhone: student.guardianphone,
    periodName: period.name,
    plan: homecoming?.plan || 'BELUM DITENTUKAN',
    departureDate: homecoming?.departuredate || period.startdate,
    mandatoryReturnDate: homecoming?.mandatoryreturndate || period.returndeadlinedate,
    actualReturnDate: homecoming?.actualreturndate || null,
    feeAmount: totalFee,
    baseFee: period.feeamount,
    totalPaid,
    remainingFee: remaining,
    paymentStatus
  });
});

module.exports = router;
