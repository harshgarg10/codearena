const db = require('../config/db');

const saveDuelResult = async ({ roomCode, players, problemId, scores, times, winner, endReason, isRanked = true }) => {
  try {
    console.log(`💾 Saving duel result for room ${roomCode} (${isRanked ? 'Ranked' : 'Unranked'})`);
    
    // Get user IDs
    const [player1Rows] = await db.execute('SELECT id, rating FROM users WHERE username = ?', [players[0]]);
    const [player2Rows] = await db.execute('SELECT id, rating FROM users WHERE username = ?', [players[1]]);
    
    if (player1Rows.length === 0 || player2Rows.length === 0) {
      throw new Error('One or both players not found');
    }

    const player1Id = player1Rows[0].id;
    const player2Id = player2Rows[0].id;
    const player1Rating = player1Rows[0].rating;
    const player2Rating = player2Rows[0].rating;
    
    // Get winner ID
    let winnerId = null;
    if (winner) {
      const winnerRows = winner === players[0] ? player1Rows : player2Rows;
      winnerId = winnerRows[0].id;
    }

    // Save duel result
    const [result] = await db.execute(
      `INSERT INTO duels (room_code, player1_id, player2_id, problem_id, winner_id, 
       player1_score, player2_score, player1_time, player2_time, end_reason, ended_at, is_ranked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        roomCode,
        player1Id,
        player2Id,
        problemId,
        winnerId,
        scores[players[0]] || 0,
        scores[players[1]] || 0,
        times[players[0]] || 0,
        times[players[1]] || 0,
        endReason,
        isRanked
      ]
    );

    const duelId = result.insertId;

    // Only update ratings for ranked games
    let ratingChanges = null;
    if (isRanked) {
      ratingChanges = await updatePlayerRatings(
        player1Id, player2Id, winnerId, 
        players, player1Rating, player2Rating
      );
    } else {
      console.log(`📝 Unranked game - no rating changes applied`);
      ratingChanges = {
        [players[0]]: 0,
        [players[1]]: 0
      };
    }

    console.log(`✅ Duel result saved: ${roomCode} (ID: ${duelId})`);
    return { duelId, ratingChanges };

  } catch (error) {
    console.error('❌ Error saving duel result:', error);
    throw error;
  }
};

const updatePlayerRatings = async (player1Id, player2Id, winnerId, players, rating1, rating2) => {
  try {
    // Calculate rating changes (simplified ELO-like system)
    const K = 32; // Rating change factor
    const expectedScore1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    const expectedScore2 = 1 - expectedScore1;

    let actualScore1, actualScore2;
    
    if (!winnerId) {
      // Draw/Tie
      actualScore1 = actualScore2 = 0.5;
    } else if (winnerId === player1Id) {
      // Player 1 wins
      actualScore1 = 1;
      actualScore2 = 0;
    } else {
      // Player 2 wins
      actualScore1 = 0;
      actualScore2 = 1;
    }

    const ratingChange1 = Math.round(K * (actualScore1 - expectedScore1));
    const ratingChange2 = Math.round(K * (actualScore2 - expectedScore2));
    
    const newRating1 = Math.max(800, rating1 + ratingChange1); // Minimum rating of 800
    const newRating2 = Math.max(800, rating2 + ratingChange2);

    // Update ratings in database
    await db.execute('UPDATE users SET rating = ? WHERE id = ?', [newRating1, player1Id]);
    await db.execute('UPDATE users SET rating = ? WHERE id = ?', [newRating2, player2Id]);

    const ratingChanges = {
      [players[0]]: ratingChange1,
      [players[1]]: ratingChange2
    };

    console.log(`📊 Rating updates:`);
    console.log(`  ${players[0]}: ${rating1} → ${newRating1} (${ratingChange1 >= 0 ? '+' : ''}${ratingChange1})`);
    console.log(`  ${players[1]}: ${rating2} → ${newRating2} (${ratingChange2 >= 0 ? '+' : ''}${ratingChange2})`);

    return ratingChanges;

  } catch (error) {
    console.error('❌ Error updating ratings:', error);
    throw error;
  }
};

module.exports = { saveDuelResult };