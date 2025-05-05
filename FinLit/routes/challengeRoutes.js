// routes/challengeRoutes.js
import express from 'express';
import Challenge from '../models/Challenge.js';
import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';
import { connect } from '../config/sqlite-adapter.js';

const router = express.Router();

// Create a new challenge
router.post('/challenges', async (req, res) => {
  try {
    const { challengerId, challengedId, gameType, gameMode } = req.body;

    // Validate users exist
    const challenger = await User.findById(challengerId);
    const challenged = await User.findById(challengedId);

    if (!challenger || !challenged) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Create the challenge
    const challenge = await Challenge.create({
      challengerId,
      challengedId,
      gameType,
      gameMode,
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: 'Error creating challenge', error: error.message });
  }
});

// Get challenges for a user
router.get('/challenges/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const challenges = await Challenge.findByUserId(userId, { status });
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges', error: error.message });
  }
});

// Get a specific challenge
router.get('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ message: 'Error fetching challenge', error: error.message });
  }
});

// Accept a challenge
router.post('/challenges/:id/accept', async (req, res) => {
  try {
    const challenge = await Challenge.accept(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found or already accepted' });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ message: 'Error accepting challenge', error: error.message });
  }
});

// Submit score for a challenge
// Add this route to your challengeRoutes.js file

// POST challenge score
router.post('/challenges/:id/score', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { userId, score } = req.body;

    if (!userId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await connect();

    // Get the challenge
    const challenge = await connection.get(
      'SELECT * FROM challenges WHERE id = ?',
      [challengeId],
    );

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is part of this challenge
    if (challenge.challenger_id !== userId && challenge.challenged_id !== userId) {
      return res.status(403).json({ message: 'User is not part of this challenge' });
    }

    // Update the correct score field based on user
    const isChallenger = challenge.challenger_id === userId;
    const scoreField = isChallenger ? 'challenger_score' : 'challenged_score';

    await connection.run(
      `UPDATE challenges SET ${scoreField} = ? WHERE id = ?`,
      [score, challengeId],
    );

    // Check if both players have completed
    const updatedChallenge = await connection.get(
      'SELECT * FROM challenges WHERE id = ?',
      [challengeId],
    );

    // If both scores are submitted, determine the winner
    if (updatedChallenge.challenger_score !== null && updatedChallenge.challenged_score !== null) {
      let winnerId = null;

      if (updatedChallenge.challenger_score > updatedChallenge.challenged_score) {
        winnerId = updatedChallenge.challenger_id;
      } else if (updatedChallenge.challenged_score > updatedChallenge.challenger_score) {
        winnerId = updatedChallenge.challenged_id;
      }
      // If scores are equal, winnerId remains null (it's a tie)

      // Update challenge status to completed
      await connection.run(
        'UPDATE challenges SET status = \'completed\', winner_id = ?, completed_at = ? WHERE id = ?',
        [winnerId, new Date().toISOString(), challengeId],
      );

      // Award points to the winner
      if (winnerId) {
        // Add 5 points for each participant
        const pointsPool = updatedChallenge.prize_points || 50;

        // Insert or update user points for the winner
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

        // Update points history
        await connection.run(
          `INSERT INTO points_history (user_id, points_change, reason, reference_id, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [winnerId, pointsPool, 'challenge_win', challengeId, new Date().toISOString()],
        );

        // Update loser's played count
        const loserId = winnerId === updatedChallenge.challenger_id
          ? updatedChallenge.challenged_id
          : updatedChallenge.challenger_id;

        await connection.run(
          `INSERT INTO user_points (user_id, total_points, challenges_won, challenges_played, last_updated)
           VALUES (?, 0, 0, 1, ?)
           ON CONFLICT(user_id) DO UPDATE SET
           challenges_played = challenges_played + 1,
           last_updated = ?`,
          [loserId, new Date().toISOString(), new Date().toISOString()],
        );
      } else {
        // It's a tie - update both players' played count
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

      // Get user data for response
      const challenger = await connection.get(
        'SELECT username FROM users WHERE id = ?',
        [updatedChallenge.challenger_id],
      );

      const challenged = await connection.get(
        'SELECT username FROM users WHERE id = ?',
        [updatedChallenge.challenged_id],
      );

      // Return final challenge state
      return res.json({
        id: updatedChallenge.id,
        challengerId: updatedChallenge.challenger_id,
        challengedId: updatedChallenge.challenged_id,
        challengerUsername: challenger ? challenger.username : null,
        challengedUsername: challenged ? challenged.username : null,
        status: 'completed',
        gameType: updatedChallenge.game_type,
        gameMode: updatedChallenge.game_mode,
        challengerScore: updatedChallenge.challenger_score,
        challengedScore: updatedChallenge.challenged_score,
        winnerId,
        prizePoints: updatedChallenge.prize_points,
        message: winnerId ? `${winnerId === userId ? 'You won' : 'Your opponent won'} the challenge!` : "It's a tie!",
      });
    }

    // If we get here, only one player has completed
    // Get user data for response
    const challenger = await connection.get(
      'SELECT username FROM users WHERE id = ?',
      [updatedChallenge.challenger_id],
    );

    const challenged = await connection.get(
      'SELECT username FROM users WHERE id = ?',
      [updatedChallenge.challenged_id],
    );

    return res.json({
      id: updatedChallenge.id,
      challengerId: updatedChallenge.challenger_id,
      challengedId: updatedChallenge.challenged_id,
      challengerUsername: challenger ? challenger.username : null,
      challengedUsername: challenged ? challenged.username : null,
      status: 'accepted',
      gameType: updatedChallenge.game_type,
      gameMode: updatedChallenge.game_mode,
      challengerScore: updatedChallenge.challenger_score,
      challengedScore: updatedChallenge.challenged_score,
      message: 'Your score has been submitted. Waiting for your opponent to complete the challenge.',
    });
  } catch (error) {
    console.error('Error submitting challenge score:', error);
    res.status(500).json({ message: 'Error submitting challenge score', error: error.message });
  }
});

// Get game leaderboard
// Add these routes to your challengeRoutes.js file

// Update leaderboard for a game (new route)
router.post('/leaderboard/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    const { userId, score } = req.body;

    // Update leaderboard
    const newHighScore = await Leaderboard.updateScore(userId, gameType, score);

    // Award completion points (always award 10 points for completing a game)
    await Challenge.awardPoints(userId, 10, 'game_completed');

    res.json({
      message: 'Score updated successfully',
      newHighScore,
      pointsAwarded: 10,
    });
  } catch (error) {
    console.error('Error updating leaderboard score:', error);
    res.status(500).json({ message: 'Error updating score', error: error.message });
  }
});

// Direct points awarding endpoint (new route)
router.post('/challenges/award-points', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    await Challenge.awardPoints(userId, points, reason);

    res.json({ message: 'Points awarded successfully', points });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Error awarding points', error: error.message });
  }
});

// Get user rank
router.get('/leaderboard/:gameType/user/:userId', async (req, res) => {
  try {
    const { gameType, userId } = req.params;

    const userRank = await Leaderboard.getUserRank(userId, gameType);
    res.json(userRank);
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ message: 'Error fetching user rank', error: error.message });
  }
});

// Get points leaderboard
router.get('/leaderboard/points/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topPlayers = await Leaderboard.getPointsLeaderboard(parseInt(limit));
    res.json(topPlayers);
  } catch (error) {
    console.error('Error fetching points leaderboard:', error);
    res.status(500).json({ message: 'Error fetching points leaderboard', error: error.message });
  }
});

// Get user points
router.get('/points/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await import('../config/sqlite-adapter.js').then(m => m.connect());

    const userPoints = await connection.get(
      'SELECT * FROM user_points WHERE user_id = ?',
      [userId],
    );

    res.json(userPoints || { user_id: userId, total_points: 0, challenges_won: 0, challenges_played: 0 });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ message: 'Error fetching user points', error: error.message });
  }
});

// DELETE endpoint to delete a challenge
router.delete('/challenges/:id', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const connection = await connect();

    // Get the challenge to check if it exists and verify ownership
    const challenge = await connection.get(
      'SELECT * FROM challenges WHERE id = ?',
      [challengeId],
    );

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Delete the challenge
    await connection.run(
      'DELETE FROM challenges WHERE id = ?',
      [challengeId],
    );

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ message: 'Error deleting challenge', error: error.message });
  }
});

// Update a challenge with quiz settings
router.post('/challenges/:id/update-settings', async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { quizSettings } = req.body;

    const connection = await connect();

    // Get the challenge
    const challenge = await connection.get(
      'SELECT * FROM challenges WHERE id = ?',
      [challengeId],
    );

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Update quiz settings
    await connection.run(
      'UPDATE challenges SET quiz_settings = ? WHERE id = ?',
      [JSON.stringify(quizSettings), challengeId],
    );

    res.json({ message: 'Challenge settings updated successfully' });
  } catch (error) {
    console.error('Error updating challenge settings:', error);
    res.status(500).json({ message: 'Error updating challenge settings', error: error.message });
  }
});
export default router;
