require('dotenv').config();
const db = require('../config/db');

const fixDatabase = async () => {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Check if execution_platform column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'submissions' AND COLUMN_NAME = 'execution_platform'
    `, [process.env.DB_NAME]);
    
    if (columns.length === 0) {
      console.log('➕ Adding execution_platform column...');
      await db.execute(`
        ALTER TABLE submissions 
        ADD COLUMN execution_platform VARCHAR(20) DEFAULT 'windows' COMMENT 'Platform where code was executed'
      `);
      console.log('✅ Added execution_platform column');
    } else {
      console.log('✅ execution_platform column already exists');
    }
    
    // Update any null values
    await db.execute("UPDATE submissions SET execution_platform = 'windows' WHERE execution_platform IS NULL");
    console.log('✅ Updated null execution_platform values');
    
    console.log('🎉 Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
  }
  
  process.exit(0);
};

fixDatabase();