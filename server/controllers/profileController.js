const db = require('../config/db');

exports.getUserStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    // First, get the user's basic information
    const [userRows] = await db.query(
      'SELECT username, rating FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Check if submissions table exists, if not return default values
    const [tableCheck] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'submissions'",
      [process.env.DB_NAME]
    );

    if (tableCheck[0].count === 0) {
      // Submissions table doesn't exist, return default values with user info
      return res.json({
        username: user.username,
        rating: user.rating,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        recentSubmissions: [],
      });
    }

    // Total Submissions
    const [totalRows] = await db.query(
      `SELECT COUNT(*) AS total FROM submissions WHERE user_id = ?`,
      [userId]
    );

    // Accepted Submissions
    const [acceptedRows] = await db.query(
      `SELECT COUNT(*) AS accepted FROM submissions WHERE user_id = ? AND verdict = 'Accepted'`,
      [userId]
    );

    // Recent 5 Submissions
    const [recentRows] = await db.query(
      `SELECT s.problem_id, COALESCE(p.title, 'Unknown Problem') as title, s.verdict, s.submitted_at
       FROM submissions s
       LEFT JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ?
       ORDER BY s.submitted_at DESC
       LIMIT 5`,
      [userId]
    );

    const total = totalRows[0].total;
    const accepted = acceptedRows[0].accepted;
    const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;

    res.json({
      username: user.username,
      rating: user.rating,
      totalSubmissions: total,
      acceptedSubmissions: accepted,
      acceptanceRate,
      recentSubmissions: recentRows,
    });
  } catch (err) {
    console.error('Profile controller error:', err);
    res.status(500).json({ message: 'Failed to fetch profile data', error: err.message });
  }
};