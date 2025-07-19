const db = require('../config/db');

exports.getUserStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get the user's basic information
    const [userRows] = await db.query(
      'SELECT username, rating FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Get duel statistics
    const [duelStats] = await db.query(
      `SELECT 
        COUNT(*) as totalDuels,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END) as draws,
        COUNT(CASE WHEN is_ranked = TRUE THEN 1 END) as rankedDuels,
        SUM(CASE WHEN winner_id = ? AND is_ranked = TRUE THEN 1 ELSE 0 END) as rankedWins
      FROM duels 
      WHERE (player1_id = ? OR player2_id = ?)`,
      [userId, userId, userId, userId, userId]
    );

    // Get recent duels with problem titles
    const [recentDuels] = await db.query(
    `SELECT 
      d.room_code,
      d.end_reason,
      d.ended_at,
      d.is_ranked,
      COALESCE(p.title, 'Unknown Problem') as problem_title,
      CASE 
        WHEN d.player1_id = ? THEN u2.username 
        ELSE u1.username 
      END as opponent,
      CASE 
        WHEN d.winner_id = ? THEN 'Won'
        WHEN d.winner_id IS NULL THEN 'Draw'
        ELSE 'Lost'
      END as result,
      CASE 
        WHEN d.player1_id = ? THEN d.player1_score 
        ELSE d.player2_score 
      END as your_score,
      CASE 
        WHEN d.player1_id = ? THEN d.player2_score 
        ELSE d.player1_score 
      END as opponent_score,
      CASE 
        WHEN d.player1_id = ? THEN CAST(d.player1_time AS DECIMAL(10,3))
        ELSE CAST(d.player2_time AS DECIMAL(10,3))
      END as your_time
    FROM duels d
    LEFT JOIN problems p ON d.problem_id = p.id
    LEFT JOIN users u1 ON d.player1_id = u1.id
    LEFT JOIN users u2 ON d.player2_id = u2.id
    WHERE d.player1_id = ? OR d.player2_id = ?
    ORDER BY d.ended_at DESC
    LIMIT 10`,
    [userId, userId, userId, userId, userId, userId, userId]
  );

    // Get submission statistics (check if table exists first)
    let submissionStats = [{ totalSubmissions: 0, acceptedSubmissions: 0 }];
    try {
      const [subStats] = await db.query(
        `SELECT 
          COUNT(*) as totalSubmissions,
          SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) as acceptedSubmissions
         FROM submissions 
         WHERE user_id = ?`,
        [userId]
      );
      submissionStats = subStats;
    } catch (error) {
      console.log('Submissions table not found, using defaults');
    }

    // Calculate win rate
    const totalDuels = duelStats[0].totalDuels || 0;
    const wins = duelStats[0].wins || 0;
    const losses = duelStats[0].losses || 0;
    const draws = duelStats[0].draws || 0;
    const rankedDuels = duelStats[0].rankedDuels || 0;
    const rankedWins = duelStats[0].rankedWins || 0;

    // Calculate win rate based only on ranked games
    const winRate = rankedDuels > 0 ? Math.round((rankedWins / rankedDuels) * 100) : 0;

    // Calculate acceptance rate
    const totalSubs = submissionStats[0].totalSubmissions || 0;
    const acceptedSubs = submissionStats[0].acceptedSubmissions || 0;
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    // Log the duel data for debugging
    console.log('📊 Recent duels data:', recentDuels.map(d => ({
      problem: d.problem_title,
      opponent: d.opponent,
      result: d.result,
      scores: `${d.your_score} vs ${d.opponent_score}`,
      time: d.your_time,
      time_type: typeof d.your_time
    })));

    res.json({
      username: user.username,
      rating: user.rating,
      // Duel stats
      totalDuels,
      wins,
      losses: duelStats[0].losses || 0,
      draws: duelStats[0].draws || 0,
      winRate,
      recentDuels,
      // Submission stats
      totalSubmissions: totalSubs,
      acceptedSubmissions: acceptedSubs,
      acceptanceRate
    });

  } catch (err) {
    console.error('Profile controller error:', err);
    res.status(500).json({ message: 'Failed to fetch profile data', error: err.message });
  }
};