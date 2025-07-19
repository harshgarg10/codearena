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
CREATE TABLE testcases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    input_path VARCHAR(255) NOT NULL,
    output_path VARCHAR(255) NOT NULL,
    score INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Update the duels table to include more detailed tracking
DROP TABLE IF EXISTS duels;

CREATE TABLE duels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) NOT NULL,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    problem_id INT NOT NULL,
    winner_id INT NULL,
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    player1_time DECIMAL(10,3) DEFAULT 0,
    player2_time DECIMAL(10,3) DEFAULT 0,
    end_reason VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    
    INDEX idx_player1 (player1_id),
    INDEX idx_player2 (player2_id),
    INDEX idx_winner (winner_id),
    INDEX idx_room_code (room_code)
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
    score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (duel_id) REFERENCES duels(id)
);
