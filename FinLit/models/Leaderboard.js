// models/Leaderboard.js
import { connect } from '../config/sqlite-adapter.js';

const Leaderboard = {
  // Update or create leaderboard entry
  updateScore: async (userId, gameType, score) => {
    try {
      const connection = await connect();

      // Check if this is a new high score for the user
      const existingEntry = await connection.get(
        'SELECT * FROM leaderboard WHERE user_id = ? AND game_type = ?',
        [userId, gameType],
      );

      if (!existingEntry || score > existingEntry.score) {
        // New high score - update or insert
        await connection.run(
          `INSERT INTO leaderboard (user_id, game_type, score, achieved_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, game_type) DO UPDATE SET
           score = ?,
           achieved_at = ?`,
          [userId, gameType, score, new Date().toISOString(), score, new Date().toISOString()],
        );

        // Award bonus points for new personal best
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, last_updated)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
           total_points = total_points + ?,
           last_updated = ?`,
          [userId, 20, new Date().toISOString(), 20, new Date().toISOString()],
        );

        // Record points history
        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id)
           VALUES (?, ?, ?, ?)`,
          [userId, 20, 'personal_best', `${gameType}_${score}`],
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  },

  // Get top players for a game type
  getTopPlayers: async (gameType, limit = 10) => {
    try {
      const connection = await connect();

      const topPlayers = await connection.all(
        `SELECT l.*, u.username, u.avatar, p.total_points
         FROM leaderboard l
         JOIN users u ON l.user_id = u.id
         LEFT JOIN user_points p ON l.user_id = p.user_id
         WHERE l.game_type = ?
         ORDER BY l.score DESC
         LIMIT ?`,
        [gameType, limit],
      );

      return topPlayers.map(entry => ({
        userId: entry.user_id,
        username: entry.username,
        avatar: entry.avatar,
        score: entry.score,
        achievedAt: entry.achieved_at,
        totalPoints: entry.total_points || 0,
      }));
    } catch (error) {
      console.error('Error getting top players:', error);
      throw error;
    }
  },

  // Get user rank for a game type
  getUserRank: async (userId, gameType) => {
    try {
      const connection = await connect();

      const userScore = await connection.get(
        'SELECT score FROM leaderboard WHERE user_id = ? AND game_type = ?',
        [userId, gameType],
      );

      if (!userScore) return null;

      const rank = await connection.get(
        `SELECT COUNT(*) + 1 as rank
         FROM leaderboard
         WHERE game_type = ? AND score > ?`,
        [gameType, userScore.score],
      );

      return {
        rank: rank.rank,
        score: userScore.score,
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  },

  // Get global points leaderboard
  getPointsLeaderboard: async (limit = 10) => {
    try {
      const connection = await connect();

      const topPlayers = await connection.all(
        `SELECT p.*, u.username, u.avatar
         FROM user_points p
         JOIN users u ON p.user_id = u.id
         ORDER BY p.total_points DESC
         LIMIT ?`,
        [limit],
      );

      return topPlayers.map(entry => ({
        userId: entry.user_id,
        username: entry.username,
        avatar: entry.avatar,
        totalPoints: entry.total_points,
        challengesWon: entry.challenges_won,
        challengesPlayed: entry.challenges_played,
      }));
    } catch (error) {
      console.error('Error getting points leaderboard:', error);
      throw error;
    }
  },
};

export default Leaderboard;
