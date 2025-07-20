const mysql = require('mysql2/promise');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.DB_HOST === 'mysql.railway.internal';
const isLocal = !isProduction && !isRailway;

if (isLocal) {
  console.log('=== Local Database Configuration ===');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASS:', process.env.DB_PASS ? 'Password exists' : 'No password');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('Environment: LOCAL DEVELOPMENT');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'codearena',
  ssl: isRailway ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove invalid options for local development
  ...(isLocal ? {} : {
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  })
});

// Test the connection
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
      return;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        if (isLocal) {
          console.error('💡 Local tip: Make sure MySQL is running and credentials are correct');
          console.error('   Try: mysql -u root -p');
        }
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Test connection for local development
if (isLocal) {
  testConnection().catch(err => {
    console.error('❌ Database connection failed completely:', err);
  });
}

module.exports = pool;