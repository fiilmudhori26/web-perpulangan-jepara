require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const express = require('express');
const { initDb } = require('./config/database');
const app = require('./app');

const frontendPath = path.join(__dirname, '..', '..', 'web', 'dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 8000;

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Perpulangan Santri API running on http://0.0.0.0:${PORT}`);
    console.log(`📚 API base: http://localhost:${PORT}/api/v1/`);
    console.log(`🔑 Server ready`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
