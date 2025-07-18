require('dotenv').config();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const resetProblems = async () => {
  try {
    console.log('🧹 Resetting problems database...');
    
    // Delete in the correct order due to foreign key constraints:
    // 1. Delete submissions first (they reference problems)
    await db.execute('DELETE FROM submissions');
    console.log('✅ Deleted all submissions');
    
    // 2. Delete testcases (they reference problems)
    await db.execute('DELETE FROM testcases');
    console.log('✅ Deleted all testcases');
    
    // 3. Delete duels (they reference problems and users)
    await db.execute('DELETE FROM duels');
    console.log('✅ Deleted all duels');
    
    // 4. Finally delete problems
    await db.execute('DELETE FROM problems');
    console.log('✅ Deleted all problems');
    
    // Clean up testcase directories
    const testcaseDir = path.join(__dirname, '..', 'testcases');
    if (fs.existsSync(testcaseDir)) {
      const dirs = fs.readdirSync(testcaseDir);
      for (const dir of dirs) {
        const dirPath = path.join(testcaseDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`🗑️  Removed directory: ${dir}`);
        }
      }
    }
    
    // Reset AUTO_INCREMENT counters
    await db.execute('ALTER TABLE problems AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE testcases AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE submissions AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE duels AUTO_INCREMENT = 1');
    console.log('🔄 Reset AUTO_INCREMENT counters');
    
    console.log('\n🌱 Now running seed script...');
    
    // Import and run the seed function
    const { seedProblems } = require('./seed');
    await seedProblems();
    
    console.log('\n✅ Database reset and re-seeded successfully!');
    
    // Verify the reset worked
    const [problems] = await db.execute('SELECT id, title FROM problems');
    console.log(`\n🔍 Final verification - ${problems.length} problems in database:`);
    problems.forEach((problem, index) => {
      console.log(`  ${index + 1}. ID: ${problem.id}, Title: "${problem.title}"`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
  
  process.exit(0);
};

resetProblems();