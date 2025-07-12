const pool = require('./config/db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    console.log('✅ Connected to DB! Server time is:', rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('❌ DB Connection failed:', err);
    process.exit(1);
  }
})();
