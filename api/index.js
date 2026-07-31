const { initDb } = require('../backend/src/config/database');
const app = require('../backend/src/app');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return app(req, res);
};
