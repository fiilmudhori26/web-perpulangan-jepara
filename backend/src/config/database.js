const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 5,
});

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

async function getOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function getAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function execute(sql, params = []) {
  const result = await pool.query(sql, params);
  return { changes: result.rowCount };
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'admin',
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      startDate TEXT NOT NULL,
      returnDeadlineDate TEXT NOT NULL,
      feeAmount DOUBLE PRECISION NOT NULL,
      description TEXT,
      isActive INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      room TEXT NOT NULL,
      guardianPhone TEXT NOT NULL,
      address TEXT,
      emergencyContact TEXT,
      notes TEXT,
      isArchived INTEGER DEFAULT 0,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      periodId TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      date TEXT NOT NULL,
      method TEXT NOT NULL,
      notes TEXT,
      receiptPath TEXT,
      isArchived INTEGER DEFAULT 0,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homecomings (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      periodId TEXT NOT NULL,
      plan TEXT NOT NULL,
      departureDate TEXT NOT NULL,
      mandatoryReturnDate TEXT NOT NULL,
      actualReturnDate TEXT,
      notes TEXT,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      periodId TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      attachmentPath TEXT,
      isPaymentAuto INTEGER DEFAULT 0,
      paymentId TEXT,
      isArchived INTEGER DEFAULT 0,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      periodId TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      attachmentPath TEXT,
      isArchived INTEGER DEFAULT 0,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      adminId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt BIGINT NOT NULL,
      createdAt BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  console.log('Database schema initialized');
}

async function closePool() {
  await pool.end();
}

module.exports = { initDb, getOne, getAll, execute, query, closePool };
