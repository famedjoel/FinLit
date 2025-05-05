import express from 'express';
import Challenge from '../models/Challenge.js';
import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';
import { connect } from '../config/sqlite-adapter.js';

const router = express.Router();

// Create a new challenge
router.post('/challenges', async (req, res) => {
  try {
    // Extract details for challenge creation
    const { challengerId, challengedId, gameType, gameMode } = req.body;

    // Verify that both users exist
    const challenger = await User.findById(challengerId);
    const challenged = await User.findById(challengedId);
    if (!challenger || !challenged) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Create and return the new challenge
    const challenge = await Challenge.create({
      challengerId,
      challengedId,
      gameType,
      gameMode,
    });
    return res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return res.status(500).json({ message: 'Error creating challenge', error: error.message });
  }
});

// Retrieve challenges for a specific user
router.get('/challenges/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const challenges = await Challenge.findByUserId(userId, { status });
    return res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({ message: 'Error fetching challenges', error: error.message });
  }
});

// Retrieve a specific challenge by its ID
router.get('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    return res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return res.status(500).json({ message: 'Error fetching challenge', error: error.message });
  }
});

// Accept a challenge
router.post('/challenges/:id/accept', async (req, res) => {
  try {
    const challenge = await Challenge.accept(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found or already accepted' });
    }
    return res.json(challenge);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    return res.status(500).json({ message: 'Error accepting challenge', error: error.message });
  }
});

// Submit a score for a challenge
router.post('/challenges/:id/score', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { userId, score } = req.body;
    if (!userId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await connect();
    // Retrieve the challenge record
    const challenge = await connection.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Confirm that the user is a participant in the challenge
    if (challenge.challenger_id !== userId && challenge.challenged_id !== userId) {
      return res.status(403).json({ message: 'User is not part of this challenge' });
    }

    // Identify the correct score field based on the user role
    const isChallenger = challenge.challenger_id === userId;
    const scoreField = isChallenger ? 'challenger_score' : 'challenged_score';
    await connection.run(`UPDATE challenges SET ${scoreField} = ? WHERE id = ?`, [score, challengeId]);

    // Retrieve the updated challenge record
    const updatedChallenge = await connection.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);

    // If both scores are submitted, process the challenge outcome
    if (updatedChallenge.challenger_score !== null && updatedChallenge.challenged_score !== null) {
      let winnerId = null;
      if (updatedChallenge.challenger_score > updatedChallenge.challenged_score) {
        winnerId = updatedChallenge.challenger_id;
      } else if (updatedChallenge.challenged_score > updatedChallenge.challenger_score) {
        winnerId = updatedChallenge.challenged_id;
      }
      // Mark the challenge as complete with a timestamp and a winner (if any)
      await connection.run(
        'UPDATE challenges SET status = \'completed\', winner_id = ?, completed_at = ? WHERE id = ?',
        [winnerId, new Date().toISOString(), challengeId],
      );

      if (winnerId) {
        // Determine prize points (default value if not set)
        const pointsPool = updatedChallenge.prize_points || 50;
        // Update the winner's points record
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, challenges_won, challenges_played, last_updated)
           VALUES (?, ?, 1, 1, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             total_points = total_points + ?,
             challenges_won = challenges_won + 1,
             challenges_played = challenges_played + 1,
             last_updated = ?`,
          [winnerId, pointsPool, new Date().toISOString(), pointsPool, new Date().toISOString()],
        );
        // Record the points change in the history
        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [winnerId, pointsPool, 'challenge_win', challengeId, new Date().toISOString()],
        );
        // Identify the losing participant and update their played count
        const loserId = winnerId === updatedChallenge.challenger_id ? updatedChallenge.challenged_id : updatedChallenge.challenger_id;
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, challenges_won, challenges_played, last_updated)
           VALUES (?, 0, 0, 1, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             challenges_played = challenges_played + 1,
             last_updated = ?`,
          [loserId, new Date().toISOString(), new Date().toISOString()],
        );
      } else {
        // In case of a tie, increment the played count for both participants
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, challenges_won, challenges_played, last_updated)
           VALUES (?, 0, 0, 1, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             challenges_played = challenges_played + 1,
             last_updated = ?`,
          [updatedChallenge.challenger_id, new Date().toISOString(), new Date().toISOString()],
        );
        await connection.run(
          `INSERT INTO user_points (user_id, total_points, challenges_won, challenges_played, last_updated)
           VALUES (?, 0, 0, 1, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             challenges_played = challenges_played + 1,
             last_updated = ?`,
          [updatedChallenge.challenged_id, new Date().toISOString(), new Date().toISOString()],
        );
      }

      // Retrieve usernames for both participants to include in the response
      const challengerData = await connection.get('SELECT username FROM users WHERE id = ?', [updatedChallenge.challenger_id]);
      const challengedData = await connection.get('SELECT username FROM users WHERE id = ?', [updatedChallenge.challenged_id]);
      return res.json({
        id: updatedChallenge.id,
        challengerId: updatedChallenge.challenger_id,
        challengedId: updatedChallenge.challenged_id,
        challengerUsername: challengerData ? challengerData.username : null,
        challengedUsername: challengedData ? challengedData.username : null,
        status: 'completed',
        gameType: updatedChallenge.game_type,
        gameMode: updatedChallenge.game_mode,
        challengerScore: updatedChallenge.challenger_score,
        challengedScore: updatedChallenge.challenged_score,
        winnerId,
        prizePoints: updatedChallenge.prize_points,
        message: winnerId
          ? `${winnerId === userId ? 'You won' : 'Your opponent won'} the challenge!`
          : "It's a tie!",
      });
    }

    // If only one score has been submitted, indicate that the challenge is still accepted
    const challengerData = await connection.get('SELECT username FROM users WHERE id = ?', [updatedChallenge.challenger_id]);
    const challengedData = await connection.get('SELECT username FROM users WHERE id = ?', [updatedChallenge.challenged_id]);
    return res.json({
      id: updatedChallenge.id,
      challengerId: updatedChallenge.challenger_id,
      challengedId: updatedChallenge.challenged_id,
      challengerUsername: challengerData ? challengerData.username : null,
      challengedUsername: challengedData ? challengedData.username : null,
      status: 'accepted',
      gameType: updatedChallenge.game_type,
      gameMode: updatedChallenge.game_mode,
      challengerScore: updatedChallenge.challenger_score,
      challengedScore: updatedChallenge.challenged_score,
      message: 'Your score has been submitted. Awaiting your opponent to complete the challenge.',
    });
  } catch (error) {
    console.error('Error submitting challenge score:', error);
    return res.status(500).json({ message: 'Error submitting challenge score', error: error.message });
  }
});

// Update the leaderboard for a game and award completion points
router.post('/leaderboard/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    const { userId, score } = req.body;
    const newHighScore = await Leaderboard.updateScore(userId, gameType, score);

    // Award 10 points on game completion
    await Challenge.awardPoints(userId, 10, 'game_completed');
    return res.json({
      message: 'Score updated successfully',
      newHighScore,
      pointsAwarded: 10,
    });
  } catch (error) {
    console.error('Error updating leaderboard score:', error);
    return res.status(500).json({ message: 'Error updating score', error: error.message });
  }
});

// Award points directly via a specific endpoint
router.post('/challenges/award-points', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    await Challenge.awardPoints(userId, points, reason);
    return res.json({ message: 'Points awarded successfully', points });
  } catch (error) {
    console.error('Error awarding points:', error);
    return res.status(500).json({ message: 'Error awarding points', error: error.message });
  }
});

// Fetch a user's rank in a specific game leaderboard
router.get('/leaderboard/:gameType/user/:userId', async (req, res) => {
  try {
    const { gameType, userId } = req.params;
    const userRank = await Leaderboard.getUserRank(userId, gameType);
    return res.json(userRank);
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return res.status(500).json({ message: 'Error fetching user rank', error: error.message });
  }
});

// Retrieve the top players based on points
router.get('/leaderboard/points/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topPlayers = await Leaderboard.getPointsLeaderboard(parseInt(limit));
    return res.json(topPlayers);
  } catch (error) {
    console.error('Error fetching points leaderboard:', error);
    return res.status(500).json({ message: 'Error fetching points leaderboard', error: error.message });
  }
});

// Retrieve points details for a specific user
router.get('/points/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await import('../config/sqlite-adapter.js').then(m => m.connect());
    const userPoints = await connection.get('SELECT * FROM user_points WHERE user_id = ?', [userId]);
    return res.json(userPoints || { user_id: userId, total_points: 0, challenges_won: 0, challenges_played: 0 });
  } catch (error) {
    console.error('Error fetching user points:', error);
    return res.status(500).json({ message: 'Error fetching user points', error: error.message });
  }
});

// Delete a specific challenge
router.delete('/challenges/:id', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const connection = await connect();
    const challenge = await connection.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    await connection.run('DELETE FROM challenges WHERE id = ?', [challengeId]);
    return res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return res.status(500).json({ message: 'Error deleting challenge', error: error.message });
  }
});

// Update quiz settings for a challenge
router.post('/challenges/:id/update-settings', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { quizSettings } = req.body;
    const connection = await connect();
    const challenge = await connection.get('SELECT * FROM challenges WHERE id = ?', [challengeId]);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    await connection.run('UPDATE challenges SET quiz_settings = ? WHERE id = ?', [JSON.stringify(quizSettings), challengeId]);
    return res.json({ message: 'Challenge settings updated successfully' });
  } catch (error) {
    console.error('Error updating challenge settings:', error);
    return res.status(500).json({ message: 'Error updating challenge settings', error: error.message });
  }
});

export default router;
