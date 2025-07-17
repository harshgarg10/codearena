CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rating INT DEFAULT 1500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    sample_input TEXT NOT NULL,
    sample_output TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE duels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    problem_id INT NOT NULL,
    winner_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    duel_id INT,
    code TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'cpp',
    verdict ENUM('Accepted', 'Wrong Answer', 'TLE', 'Runtime Error', 'Compilation Error') NOT NULL,
    time_taken FLOAT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (duel_id) REFERENCES duels(id)
);
ALTER TABLE submissions ADD COLUMN score INT DEFAULT 0;

INSERT INTO problems (
  title,
  description,
  input_format,
  output_format,
  sample_input,
  sample_output,
  difficulty
)
VALUES (
  'Sum of Two Numbers',
  'Given two integers A and B, output their sum.',
  'Two space-separated integers A and B.',
  'Single integer representing the sum.',
  '3 5',
  '8',
  'easy'
);
INSERT INTO problems (
    title,
    description,
    input_format,
    output_format,
    sample_input,
    sample_output,
    difficulty
)
VALUES (
    'Kingdom Defense Strategy',
    'The Kingdom of Aralon is under siege by a mysterious army of shadows. As the Royal Strategist, you are tasked with defending key cities across the kingdom using magical shields. Each city is positioned along a straight road and has a specific defense value.\n\nA magical shield can protect a contiguous group of cities, but due to limited mana, the total number of shields you can deploy is limited to **K**. A single shield can only protect a sequence of **consecutive** cities, and the strength of a shield must be equal to or greater than the **maximum defense value** among the cities it protects.\n\nYou need to **minimize the total mana cost**, which is defined as the **sum of strengths** of all deployed shields.\n\n**Note:** You can’t leave any city unprotected.\n\n### Constraints:\n- 1 ≤ N ≤ 10^5 — number of cities\n- 1 ≤ K ≤ 100 — number of shields available\n- 1 ≤ defense[i] ≤ 10^9 — defense value of each city\n\n### Objective:\nMinimize the total mana cost by splitting the cities into at most K contiguous segments and protecting each with a shield of appropriate strength.\n\nThis is a variation of the classical partitioning problem, and must be solved efficiently.\n\nYour algorithm should aim for a solution with time complexity **O(N × K)** or better using dynamic programming.',
    
    'The first line contains two integers N and K — the number of cities and the maximum number of shields allowed.\n\nThe second line contains N space-separated integers representing the defense value of each city.',
    
    'Print a single integer — the minimum total mana cost required to protect all the cities using at most K shields.',
    
    '5 2\n1 3 4 2 5',
    
    '8',
    
    'hard'
);

