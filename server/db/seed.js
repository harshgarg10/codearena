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

    // ...existing code...
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
        difficulty: 'hard',
        testcases: [
          { input: '5 2\n1 3 4 2 5', output: '8', is_sample: true },
          { input: '6 3\n4 5 1 2 3 6', output: '11' },
          { input: '4 1\n10 20 30 40', output: '40' }
        ]
      },
      {
        title: 'Palindrome Check',
        description: 'Given a string, determine if it is a palindrome.',
        input_format: 'A single string S.',
        output_format: 'YES if S is a palindrome, NO otherwise.',
        sample_input: 'madam',
        sample_output: 'YES',
        difficulty: 'easy',
        testcases: [
          { input: 'madam', output: 'YES', is_sample: true },
          { input: 'racecar', output: 'YES' },
          { input: 'hello', output: 'NO' }
        ]
      },
      {
        title: 'Factorial',
        description: 'Given a non-negative integer N, print its factorial.',
        input_format: 'A single integer N.',
        output_format: 'Single integer, the factorial of N.',
        sample_input: '5',
        sample_output: '120',
        difficulty: 'easy',
        testcases: [
          { input: '5', output: '120', is_sample: true },
          { input: '0', output: '1' },
          { input: '3', output: '6' }
        ]
      },
      {
        title: 'Maximum Subarray Sum',
        description: 'Given an array of integers, find the contiguous subarray with the maximum sum.',
        input_format: 'First line contains integer N. Second line contains N space-separated integers.',
        output_format: 'Single integer, the maximum subarray sum.',
        sample_input: '5\n1 2 -3 4 5',
        sample_output: '9',
        difficulty: 'medium',
        testcases: [
          { input: '5\n1 2 -3 4 5', output: '9', is_sample: true },
          { input: '4\n-2 -3 4 -1', output: '4' },
          { input: '3\n-1 -2 -3', output: '-1' }
        ]
      },
      {
        title: 'Prime Number',
        description: 'Check if a given number is prime.',
        input_format: 'A single integer N.',
        output_format: 'YES if N is prime, NO otherwise.',
        sample_input: '7',
        sample_output: 'YES',
        difficulty: 'easy',
        testcases: [
          { input: '7', output: 'YES', is_sample: true },
          { input: '10', output: 'NO' },
          { input: '2', output: 'YES' }
        ]
      },
      {
        title: 'Reverse a String',
        description: 'Given a string, print its reverse.',
        input_format: 'A single string S.',
        output_format: 'The reversed string.',
        sample_input: 'hello',
        sample_output: 'olleh',
        difficulty: 'easy',
        testcases: [
          { input: 'hello', output: 'olleh', is_sample: true },
          { input: 'racecar', output: 'racecar' },
          { input: 'abc', output: 'cba' }
        ]
      },
      {
        title: 'Count Distinct Elements',
        description: 'Given an array, count the number of distinct elements.',
        input_format: 'First line contains integer N. Second line contains N space-separated integers.',
        output_format: 'Single integer, the count of distinct elements.',
        sample_input: '5\n1 2 2 3 4',
        sample_output: '4',
        difficulty: 'easy',
        testcases: [
          { input: '5\n1 2 2 3 4', output: '4', is_sample: true },
          { input: '3\n1 1 1', output: '1' },
          { input: '4\n1 2 3 4', output: '4' }
        ]
      },
      {
        title: 'Binary Search',
        description: 'Given a sorted array and a target value, return the index of the target if found, else -1.',
        input_format: 'First line contains integer N. Second line contains N space-separated integers (sorted). Third line contains the target integer.',
        output_format: 'Single integer, the index (0-based) of the target or -1 if not found.',
        sample_input: '5\n1 3 5 7 9\n5',
        sample_output: '2',
        difficulty: 'medium',
        testcases: [
          { input: '5\n1 3 5 7 9\n5', output: '2', is_sample: true },
          { input: '4\n2 4 6 8\n3', output: '-1' },
          { input: '3\n1 2 3\n2', output: '1' }
        ]
      },
      {
        title: 'Fibonacci Number',
        description: 'Given N, print the Nth Fibonacci number (0-indexed, F(0)=0, F(1)=1).',
        input_format: 'A single integer N.',
        output_format: 'Single integer, the Nth Fibonacci number.',
        sample_input: '6',
        sample_output: '8',
        difficulty: 'easy',
        testcases: [
          { input: '6', output: '8', is_sample: true },
          { input: '0', output: '0' },
          { input: '1', output: '1' }
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
