require('dotenv').config();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

const seedProblems = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    const [existing] = await db.execute('SELECT COUNT(*) as count FROM problems');
    if (existing[0].count > 0) {
      console.log('📋 Problems already exist. Skipping...');
      return;
    }

    const problems = [
      {
        title: 'Sum of Two Numbers',
        description: 'Given two integers A and B, output their sum.',
        input_format: 'Two space-separated integers A and B.',
        output_format: 'Single integer representing the sum.',
        sample_input: '3 5',
        sample_output: '8',
        difficulty: 'easy',
        testcases: [
          { input: '3 5', output: '8', is_sample: true },
          { input: '10 20', output: '30' },
          { input: '100 200', output: '300' }
        ]
      },
      {
        title: 'Kingdom Defense Strategy',
        description: `The Kingdom of Aralon is under siege by a mysterious army of shadows. As the Royal Strategist, you are tasked with defending key cities across the kingdom using magical shields...`,
        input_format: 'First line contains N and K...',
        output_format: 'Print a single integer...',
        sample_input: '5 2\n1 3 4 2 5',
        sample_output: '8',
        difficulty: 'hard',
        testcases: [
          { input: '5 2\n1 3 4 2 5', output: '8', is_sample: true },
          { input: '6 3\n4 5 1 2 3 6', output: '11' },
          { input: '4 1\n10 20 30 40', output: '40' }
        ]
      }
    ];

    for (const problem of problems) {
      const [res] = await db.execute(
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

      const problemId = res.insertId;
      const problemDir = path.join(TESTCASE_DIR, `problem-${problemId}`);

      fs.mkdirSync(problemDir, { recursive: true });

      console.log(`✅ Inserted problem "${problem.title}" (ID: ${problemId})`);

      // Insert testcases
      for (let i = 0; i < problem.testcases.length; i++) {
        const tc = problem.testcases[i];
        const inputFile = path.join(problemDir, `input${i + 1}.txt`);
        const outputFile = path.join(problemDir, `output${i + 1}.txt`);

        fs.writeFileSync(inputFile, tc.input);
        fs.writeFileSync(outputFile, tc.output);

        await db.execute(
          `INSERT INTO testcases (problem_id, is_sample, input_path, output_path, score)
           VALUES (?, ?, ?, ?, ?)`,
          [problemId, tc.is_sample ? 1 : 0, inputFile, outputFile, 1]
        );
        console.log(`🧪 Testcase ${i + 1} written for problem ${problemId}`);
      }
    }

    console.log('\n🌱 All problems and testcases seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

if (require.main === module) {
  seedProblems().then(() => process.exit(0));
}

module.exports = { seedProblems };
