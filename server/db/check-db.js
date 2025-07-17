// Load environment variables FIRST
require('dotenv').config();

console.log('=== Database Configuration Debug ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? 'Password exists' : 'No password');
console.log('DB_NAME:', process.env.DB_NAME);

const db = require('../config/db');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check problems table
    const [problems] = await db.execute('SELECT * FROM problems');
    console.log(`\n📋 Problems table has ${problems.length} entries:`);
    
    if (problems.length === 0) {
      console.log('  ❌ No problems found in database!');
    } else {
      problems.forEach((problem, index) => {
        console.log(`  ${index + 1}. ID: ${problem.id}, Title: "${problem.title}"`);
      });
    }
    
    // Check if the problems have all required fields
    if (problems.length > 0) {
      console.log('\n🔍 Checking problem data structure:');
      const firstProblem = problems[0];
      const requiredFields = ['id', 'title', 'description', 'input_format', 'output_format', 'sample_input', 'sample_output', 'difficulty'];
      
      requiredFields.forEach(field => {
        if (firstProblem[field] !== undefined) {
          console.log(`  ✅ ${field}: ${field === 'description' ? firstProblem[field].substring(0, 50) + '...' : firstProblem[field]}`);
        } else {
          console.log(`  ❌ ${field}: MISSING`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
  
  process.exit(0);
};

checkDatabase();