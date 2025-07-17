const db = require('../config/db'); 

const debugProblems = async () => {
  try {
    const [rows] = await db.execute(`SELECT * FROM problems`);
    console.log('🔍 All problems in database:');
    rows.forEach((problem, index) => {
      console.log(`  ${index + 1}. ID: ${problem.id}, Title: "${problem.title}"`);
    });
    return rows;
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
};

const getRandomProblem = async () => {
  try {
    // Get all problems with full data
    const [rows] = await db.execute(`SELECT * FROM problems`);
    
    if (rows.length === 0) {
      console.error('❌ No problems found in database!');
      throw new Error('No problems found in database');
    }
    
    console.log(`🔍 Available problems: ${rows.length}`);
    rows.forEach((problem, index) => {
      console.log(`  ${index + 1}. ID: ${problem.id}, Title: "${problem.title}"`);
    });
    
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * rows.length);
    const selectedProblem = rows[randomIndex];
    
    console.log(`🎲 Selected problem: "${selectedProblem.title}" (ID: ${selectedProblem.id})`);
    
    return selectedProblem;
  } catch (error) {
    console.error('Error in getRandomProblem:', error);
    throw error;
  }
};

module.exports = { getRandomProblem, debugProblems };