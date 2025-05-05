import { connect } from '../config/sqlite-adapter.js';

// Challenge module responsible for managing challenge operations.
const Challenge = {
  // Creates a new challenge in the database.
  create: async (challengeData) => {
    try {
      const connection = await connect();
      // Begin a transaction.
      await connection.run('BEGIN TRANSACTION');
      try {
        // Convert quiz settings to a JSON string if provided.
        const quizSettingsJSON = challengeData.quizSettings ? JSON.stringify(challengeData.quizSettings) : null;

        const result = await connection.run(
          `INSERT INTO challenges (
            challenger_id, challenged_id, game_type, game_mode, 
            status, prize_points, challenger_score, challenged_score, 
            quiz_settings, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            challengeData.challengerId,
            challengeData.challengedId,
            challengeData.gameType,
            challengeData.gameMode || null,
            'pending',
            challengeData.prizePoints || 50,
            null,
            null,
            quizSettingsJSON,
            new Date().toISOString(),
          ],
        );

        // Retrieve the newly created challenge using its unique identifier.
        const challenge = await connection.get(
          'SELECT * FROM challenges WHERE id = ?',
          result.lastID,
        );

        // Commit the transaction.
        await connection.run('COMMIT');

        return processChallengeData(challenge);
      } catch (error) {
        // Roll back the transaction in case of any errors.
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  // Retrieves challenges associated with a specific user.
  findByUserId: async (userId, options = {}) => {
    try {
      const connection = await connect();
      let query = `
        SELECT c.*, 
               u1.username as challenger_username, 
               u2.username as challenged_username,
               u3.username as winner_username
        FROM challenges c
        LEFT JOIN users u1 ON c.challenger_id = u1.id
        LEFT JOIN users u2 ON c.challenged_id = u2.id
        LEFT JOIN users u3 ON c.winner_id = u3.id
        WHERE (c.challenger_id = ? OR c.challenged_id = ?)
      `;
      const params = [userId, userId];

      // Optionally filter by challenge status.
      if (options.status) {
        query += ' AND c.status = ?';
        params.push(options.status);
      }

      query += ' ORDER BY c.created_at DESC';

      // Apply a limit if specified.
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const challenges = await connection.all(query, params);
      return challenges.map(challenge => processChallengeData(challenge));
    } catch (error) {
      console.error('Error finding challenges:', error);
      throw error;
    }
  },

  // Finds a challenge by its unique identifier.
  findById: async (id) => {
    try {
      const connection = await connect();
      const challenge = await connection.get(
        `SELECT c.*, 
               u1.username as challenger_username, 
               u2.username as challenged_username,
               u3.username as winner_username
        FROM challenges c
        LEFT JOIN users u1 ON c.challenger_id = u1.id
        LEFT JOIN users u2 ON c.challenged_id = u2.id
        LEFT JOIN users u3 ON c.winner_id = u3.id
        WHERE c.id = ?`,
        id,
      );

      return challenge ? processChallengeData(challenge) : null;
    } catch (error) {
      console.error('Error finding challenge:', error);
      throw error;
    }
  },

  // Accepts a pending challenge.
  accept: async (challengeId) => {
    try {
      const connection = await connect();
      // Update the challenge status to 'accepted' and record the acceptance time.
      const result = await connection.run(
        `UPDATE challenges 
         SET status = 'accepted', challenged_at = ? 
         WHERE id = ? AND status = 'pending'`,
        [new Date().toISOString(), challengeId],
      );

      if (result.changes === 0) {
        // Return null if the challenge was no longer pending.
        return null;
      }

      // Retrieve and return the updated challenge.
      return await Challenge.findById(challengeId);
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  },

  // Updates the score for a challenge and processes its completion.
  updateScore: async (challengeId, userId, score) => {
    try {
      const connection = await connect();
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Identify which score field to update based on the user.
      const isChallenger = userId === challenge.challengerId;
      const scoreField = isChallenger ? 'challenger_score' : 'challenged_score';

      await connection.run(
        `UPDATE challenges SET ${scoreField} = ? WHERE id = ?`,
        [score, challengeId],
      );

      // Retrieve the updated challenge details.
      const updatedChallenge = await Challenge.findById(challengeId);

      if (updatedChallenge.challengerScore !== null && updatedChallenge.challengedScore !== null) {
        let winnerId = null;
        // Determine the winner based on the scores.
        if (updatedChallenge.challengerScore > updatedChallenge.challengedScore) {
          winnerId = updatedChallenge.challengerId;
        } else if (updatedChallenge.challengedScore > updatedChallenge.challengerScore) {
          winnerId = updatedChallenge.challengedId;
        }
        // Update the challenge status to 'completed' and record the completion time and winner.
        await connection.run(
          `UPDATE challenges 
           SET status = 'completed', winner_id = ?, completed_at = ? 
           WHERE id = ?`,
          [winnerId, new Date().toISOString(), challengeId],
        );

        // Award points if there is a winner.
        if (winnerId) {
          await Challenge.awardPoints(winnerId, updatedChallenge.prizePoints, 'challenge_win', challengeId);
        }
      }

      return await Challenge.findById(challengeId);
    } catch (error) {
      console.error('Error updating challenge score:', error);
      throw error;
    }
  },

  // Awards points to a user and logs this change.
  awardPoints: async (userId, points, reason, referenceId = null) => {
    try {
      const connection = await connect();
      // Begin a transaction.
      await connection.run('BEGIN TRANSACTION');
      try {
        // Insert new or update the existing user points record.
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, last_updated)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
           total_points = total_points + ?,
           last_updated = ?`,
          [userId, points, new Date().toISOString(), points, new Date().toISOString()],
        );

        // Log the points change in the history.
        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id)
           VALUES (?, ?, ?, ?)`,
          [userId, points, reason, referenceId],
        );

        // Update additional statistics depending on the reason.
        if (reason === 'challenge_win') {
          await connection.run(
            `UPDATE user_points SET 
             challenges_won = challenges_won + 1,
             challenges_played = challenges_played + 1
             WHERE user_id = ?`,
            [userId],
          );
        } else if (reason === 'challenge_played') {
          await connection.run(
            `UPDATE user_points SET challenges_played = challenges_played + 1
             WHERE user_id = ?`,
            [userId],
          );
        }

        // Commit the transaction.
        await connection.run('COMMIT');

        return true;
      } catch (error) {
        // Roll back the transaction in case of an error.
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  },
};

// Processes raw challenge data from the database into a standardised format.
function processChallengeData(challenge) {
  if (!challenge) return null;

  let quizSettings = null;
  // Parse quiz settings from JSON if they exist.
  if (challenge.quiz_settings) {
    try {
      quizSettings = JSON.parse(challenge.quiz_settings);
    } catch (e) {
      console.error('Error parsing quiz settings:', e);
      quizSettings = null;
    }
  }

  return {
    id: challenge.id,
    challengerId: challenge.challenger_id,
    challengedId: challenge.challenged_id,
    challengerUsername: challenge.challenger_username,
    challengedUsername: challenge.challenged_username,
    gameType: challenge.game_type,
    gameMode: challenge.game_mode,
    status: challenge.status,
    challengerScore: challenge.challenger_score,
    challengedScore: challenge.challenged_score,
    winnerId: challenge.winner_id,
    winnerUsername: challenge.winner_username,
    prizePoints: challenge.prize_points,
    quizSettings, // Quiz settings associated with the challenge.
    createdAt: challenge.created_at,
    challengedAt: challenge.challenged_at,
    completedAt: challenge.completed_at,
  };
}

export default Challenge;
