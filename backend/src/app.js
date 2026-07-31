const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const periodRoutes = require('./routes/periods');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const homecomingRoutes = require('./routes/homecomings');
const financeRoutes = require('./routes/finance');
const publicRoutes = require('./routes/public');
const configRoutes = require('./routes/config');

const app = express();

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/periods', periodRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/homecomings', homecomingRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/config', configRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: true, message: 'Internal server error' });
});

module.exports = app;
