require('dotenv').config();
const db = require('../config/db');

const migrateDuelsTable = async () => {
    
  try {
    console.log('🔄 Migrating duels table...');
    
    // Check if new columns already exist
    const [columns] = await db.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'duels'",
      [process.env.DB_NAME]
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add missing columns one by one
    const newColumns = [
      { name: 'room_code', sql: 'ADD COLUMN room_code VARCHAR(10) AFTER id' },
      { name: 'player1_score', sql: 'ADD COLUMN player1_score INT DEFAULT 0 AFTER winner_id' },
      { name: 'player2_score', sql: 'ADD COLUMN player2_score INT DEFAULT 0 AFTER player1_score' },
      { name: 'player1_time', sql: 'ADD COLUMN player1_time DECIMAL(10,3) DEFAULT 0 AFTER player2_score' },
      { name: 'player2_time', sql: 'ADD COLUMN player2_time DECIMAL(10,3) DEFAULT 0 AFTER player1_time' },
      { name: 'end_reason', sql: 'ADD COLUMN end_reason VARCHAR(255) AFTER player2_time' }
    ];
    
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        await db.execute(`ALTER TABLE duels ${column.sql}`);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⚠️ Column already exists: ${column.name}`);
      }
    }
    
    // Rename columns if needed (user1_id -> player1_id, user2_id -> player2_id)
    if (existingColumns.includes('user1_id') && !existingColumns.includes('player1_id')) {
      await db.execute('ALTER TABLE duels CHANGE user1_id player1_id INT NOT NULL');
      console.log('✅ Renamed user1_id to player1_id');
    }
    
    if (existingColumns.includes('user2_id') && !existingColumns.includes('player2_id')) {
      await db.execute('ALTER TABLE duels CHANGE user2_id player2_id INT NOT NULL');
      console.log('✅ Renamed user2_id to player2_id');
    }
    if (!existingColumns.includes('is_ranked')) {
        await db.execute('ALTER TABLE duels ADD COLUMN is_ranked BOOLEAN DEFAULT TRUE');
        console.log('✅ Added is_ranked column');
    }
    // Add indexes
    try {
      await db.execute('CREATE INDEX idx_player1 ON duels (player1_id)');
      console.log('✅ Added index on player1_id');
    } catch (e) {
      console.log('⚠️ Index on player1_id already exists or failed to create');
    }
    
    try {
      await db.execute('CREATE INDEX idx_player2 ON duels (player2_id)');
      console.log('✅ Added index on player2_id');
    } catch (e) {
      console.log('⚠️ Index on player2_id already exists or failed to create');
    }
    
    try {
      await db.execute('CREATE INDEX idx_room_code ON duels (room_code)');
      console.log('✅ Added index on room_code');
    } catch (e) {
      console.log('⚠️ Index on room_code already exists or failed to create');
    }
    
    console.log('🎉 Duels table migration completed!');
    
    // Verify the final structure
    const [finalColumns] = await db.execute(
      "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'duels' ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    console.log('\n📋 Final duels table structure:');
    finalColumns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  process.exit(0);
};

migrateDuelsTable();