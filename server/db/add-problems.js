// Load environment variables FIRST
require('dotenv').config();

const db = require('../config/db');

const addNewProblems = async () => {
  try {
    console.log('🌱 Adding new problems to database...');
    
    // Check existing problems
    const [existingProblems] = await db.execute('SELECT title FROM problems');
    const existingTitles = existingProblems.map(p => p.title);
    
    console.log(`📋 Current problems: ${existingTitles.join(', ')}`);
    
    // Define new problems to add
    const newProblems = [
      {
        title: 'Sum of Two Numbers',
        description: 'Given two integers A and B, output their sum.',
        input_format: 'Two space-separated integers A and B.',
        output_format: 'Single integer representing the sum.',
        sample_input: '3 5',
        sample_output: '8',
        difficulty: 'easy'
      },
      {
        title: 'Kingdom Defense Strategy',
        description: `The Kingdom of Aralon is under siege by a mysterious army of shadows. As the Royal Strategist, you are tasked with defending key cities across the kingdom using magical shields. Each city is positioned along a straight road and has a specific defense value.

A magical shield can protect a contiguous group of cities, but due to limited mana, the total number of shields you can deploy is limited to **K**. A single shield can only protect a sequence of **consecutive** cities, and the strength of a shield must be equal to or greater than the **maximum defense value** among the cities it protects.

You need to **minimize the total mana cost**, which is defined as the **sum of strengths** of all deployed shields.

**Note:** You can't leave any city unprotected.

### Constraints:
- 1 ≤ N ≤ 10^5 — number of cities
- 1 ≤ K ≤ 100 — number of shields available
- 1 ≤ defense[i] ≤ 10^9 — defense value of each city

### Objective:
Minimize the total mana cost by splitting the cities into at most K contiguous segments and protecting each with a shield of appropriate strength.

This is a variation of the classical partitioning problem, and must be solved efficiently.

Your algorithm should aim for a solution with time complexity **O(N × K)** or better using dynamic programming.`,
        input_format: 'The first line contains two integers N and K — the number of cities and the maximum number of shields allowed.\n\nThe second line contains N space-separated integers representing the defense value of each city.',
        output_format: 'Print a single integer — the minimum total mana cost required to protect all the cities using at most K shields.',
        sample_input: '5 2\n1 3 4 2 5',
        sample_output: '8',
        difficulty: 'hard'
      }
    ];
    
    // Only add problems that don't already exist
    for (const problem of newProblems) {
      if (!existingTitles.includes(problem.title)) {
        const [result] = await db.execute(
          `INSERT INTO problems (title, description, input_format, output_format, sample_input, sample_output, difficulty) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            problem.title,
            problem.description,
            problem.input_format,
            problem.output_format,
            problem.sample_input,
            problem.sample_output,
            problem.difficulty
          ]
        );
        console.log(`✅ Added new problem: ${problem.title} (ID: ${result.insertId})`);
      } else {
        console.log(`⚠️  Problem already exists: ${problem.title}`);
      }
    }
    
    // Verify the final state
    const [allProblems] = await db.execute('SELECT id, title FROM problems');
    console.log(`\n🔍 Final problems in database (${allProblems.length}):`);
    allProblems.forEach((problem, index) => {
      console.log(`  ${index + 1}. ID: ${problem.id}, Title: "${problem.title}"`);
    });
    
  } catch (error) {
    console.error('❌ Error adding problems:', error);
  }
};

// Run if called directly
if (require.main === module) {
  addNewProblems().then(() => process.exit(0));
}

module.exports = { addNewProblems };