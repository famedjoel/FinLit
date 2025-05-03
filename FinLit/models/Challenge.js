// models/Challenge.js
import { connect } from '../config/sqlite-adapter.js';

const Challenge = {
  // Create a new challenge
  create: async (challengeData) => {
    try {
      const connection = await connect();
      
      // Begin a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Convert quiz settings to JSON string
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
            null,  // challenger_score
            null,  // challenged_score
            quizSettingsJSON,
            new Date().toISOString()
          ]
        );
        
        // Get the created challenge
        const challenge = await connection.get(
          'SELECT * FROM challenges WHERE id = ?',
          result.lastID
        );
        
        // Commit the transaction
        await connection.run('COMMIT');
  
        return processChallengeData(challenge);
      } catch (error) {
        // Rollback the transaction on error
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },
  
  // Find challenges for a user
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
      
      if (options.status) {
        query += ' AND c.status = ?';
        params.push(options.status);
      }
      
      query += ' ORDER BY c.created_at DESC';
      
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
  
  // Find a challenge by ID
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
        id
      );
      
      return challenge ? processChallengeData(challenge) : null;
    } catch (error) {
      console.error('Error finding challenge:', error);
      throw error;
    }
  },
  
// Accept a challenge
accept: async (challengeId) => {
  try {
    const connection = await connect();
    
    // Update the challenge status to 'accepted'
    const result = await connection.run(
      `UPDATE challenges 
       SET status = 'accepted', challenged_at = ? 
       WHERE id = ? AND status = 'pending'`,
      [new Date().toISOString(), challengeId]
    );
    
    if (result.changes === 0) {
      // No rows were updated, likely because the challenge wasn't in 'pending' status
      return null;
    }
    
    // Return the updated challenge
    return await Challenge.findById(challengeId);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
},

  // Update challenge with score
  updateScore: async (challengeId, userId, score) => {
    try {
      const connection = await connect();
      
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) throw new Error('Challenge not found');
      
      // Determine which score to update
      const isChallenger = userId === challenge.challengerId;
      const scoreField = isChallenger ? 'challenger_score' : 'challenged_score';
      
      await connection.run(
        `UPDATE challenges SET ${scoreField} = ? WHERE id = ?`,
        [score, challengeId]
      );
      
      // Check if both players have completed
      const updatedChallenge = await Challenge.findById(challengeId);
      
      if (updatedChallenge.challengerScore !== null && updatedChallenge.challengedScore !== null) {
        // Both players have completed - determine winner
        let winnerId = null;
        if (updatedChallenge.challengerScore > updatedChallenge.challengedScore) {
          winnerId = updatedChallenge.challengerId;
        } else if (updatedChallenge.challengedScore > updatedChallenge.challengerScore) {
          winnerId = updatedChallenge.challengedId;
        }
        // If scores are equal, it's a tie (winnerId remains null)
        
        await connection.run(
          `UPDATE challenges 
           SET status = 'completed', winner_id = ?, completed_at = ? 
           WHERE id = ?`,
          [winnerId, new Date().toISOString(), challengeId]
        );
        
        // Award points if there's a winner
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
  
  // Award points to a user
  awardPoints: async (userId, points, reason, referenceId = null) => {
    try {
      const connection = await connect();
      
      // Start a transaction
      await connection.run('BEGIN TRANSACTION');
      
      try {
        // Update or create user points record
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, last_updated)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
           total_points = total_points + ?,
           last_updated = ?`,
          [userId, points, new Date().toISOString(), points, new Date().toISOString()]
        );
        
        // Create points history record
        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id)
           VALUES (?, ?, ?, ?)`,
          [userId, points, reason, referenceId]
        );
        
        // Update challenge statistics if it was for a win
        if (reason === 'challenge_win') {
          await connection.run(
            `UPDATE user_points SET 
             challenges_won = challenges_won + 1,
             challenges_played = challenges_played + 1
             WHERE user_id = ?`,
            [userId]
          );
        } else if (reason === 'challenge_played') {
          await connection.run(
            `UPDATE user_points SET challenges_played = challenges_played + 1
             WHERE user_id = ?`,
            [userId]
          );
        }
        
        await connection.run('COMMIT');
        
        return true;
      } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }
};

// Process challenge data from DB format
function processChallengeData(challenge) {
  if (!challenge) return null;

   // Parse quiz settings if they exist
   let quizSettings = null;
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
    quizSettings: quizSettings,  // Add quiz settings to processed data
    createdAt: challenge.created_at,
    challengedAt: challenge.challenged_at,
    completedAt: challenge.completed_at
  };
}

export default Challenge;