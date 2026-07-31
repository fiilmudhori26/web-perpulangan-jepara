require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, execute, getOne } = require('./config/database');
const brand = require('./config/brand');

async function seed() {
  await initDb();

  const existing = await getOne('SELECT id FROM admins LIMIT 1');
  if (existing) {
    console.log('Database already has data, skipping seed.');
    process.exit(0);
  }

  const now = Date.now();

  // Admin default
  await execute(
    'INSERT INTO admins (id, email, password, name, role, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [uuidv4(), 'admin@ponpes.com', bcrypt.hashSync('admin123', 10), 'Admin Pondok', 'admin', now, now]
  );
  console.log('✓ Admin: admin@ponpes.com / admin123');

  // Default brand config
  await execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
    ['brand.name', 'Santri LP3IA']
  );
  await execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
    ['brand.shortName', 'LP3IA']
  );
  await execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
    ['brand.tagline', 'Pondok Pesantren Al-Qur\'an LP3IA']
  );
  console.log('✓ Brand config: default');

  // Periode contoh
  const periodId = uuidv4();
  await execute(
    'INSERT INTO periods (id, name, startDate, returnDeadlineDate, feeAmount, description, isActive, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [periodId, 'Pulang Semester Genap 2025', '2025-06-20', '2025-07-15', 150000, 'Periode pulang santri semester genap tahun ajaran 2024/2025', 1, 0, now, now]
  );
  console.log('✓ Periode: Pulang Semester Genap 2025');

  // Santri contoh
  const students = [
    { name: 'Ahmad Riziq', room: 'A1', phone: '081234567890' },
    { name: 'Budi Hartono', room: 'A1', phone: '081234567891' },
    { name: 'Chaerul Umam', room: 'B2', phone: '081234567892' },
    { name: 'Dian Kusuma', room: 'B2', phone: '081234567893' },
    { name: 'Eko Saputra', room: 'C1', phone: '081234567894' },
    { name: 'Fitriani', room: 'C1', phone: '081234567895' },
    { name: 'Gilang Pratama', room: 'A2', phone: '081234567896' },
    { name: 'Hana Safitri', room: 'A2', phone: '081234567897' },
    { name: 'Irfan Maulana', room: 'B1', phone: '081234567898' },
    { name: 'Joko Susilo', room: 'B1', phone: '081234567899' },
  ];

  for (const s of students) {
    const id = uuidv4();
    await execute(
      'INSERT INTO students (id, name, room, guardianPhone, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, 0, $5, $6)',
      [id, s.name, s.room, s.phone, now, now]
    );

    // Pembayaran untuk setengah santri
    if (Math.random() > 0.5) {
      const amount = Math.random() > 0.5 ? 150000 : 75000;
      const paymentId = uuidv4();
      await execute(
        'INSERT INTO payments (id, studentId, periodId, amount, date, method, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)',
        [paymentId, id, periodId, amount, '2025-06-15', 'TUNAI', now, now]
      );
      await execute(
        'INSERT INTO incomes (id, periodId, date, category, description, amount, isPaymentAuto, paymentId, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, 1, $7, 0, $8, $9)',
        [uuidv4(), periodId, '2025-06-15', 'Pembayaran Santri', `Pembayaran santri ${s.name}`, amount, paymentId, now, now]
      );
    }

    // Rencana pulang
    if (Math.random() > 0.3) {
      const plan = Math.random() > 0.5 ? 'AKAN PULANG' : 'TIDAK PULANG';
      await execute(
        'INSERT INTO homecomings (id, studentId, periodId, plan, departureDate, mandatoryReturnDate, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [uuidv4(), id, periodId, plan, '2025-06-20', '2025-07-15', now, now]
      );
    }
  }
  console.log(`✓ ${students.length} santri contoh dengan data pembayaran & perpulangan`);

  // Pemasukan contoh
  await execute(
    'INSERT INTO incomes (id, periodId, date, category, description, amount, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)',
    [uuidv4(), periodId, '2025-06-10', 'Donasi', 'Donasi dari wali santri', 500000, now, now]
  );

  // Pengeluaran contoh
  await execute(
    'INSERT INTO expenses (id, periodId, date, category, description, amount, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)',
    [uuidv4(), periodId, '2025-06-12', 'Transportasi', 'Sewa bus perpulangan', 300000, now, now]
  );
  await execute(
    'INSERT INTO expenses (id, periodId, date, category, description, amount, isArchived, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)',
    [uuidv4(), periodId, '2025-06-14', 'Konsumsi', 'Snack perjalanan', 75000, now, now]
  );

  console.log('✓ Pemasukan & pengeluaran contoh');
  console.log('');
  console.log('✅ Seed selesai!');
  console.log('   Login: admin@ponpes.com / admin123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
