// routes/challengeRoutes.js
import express from 'express';
import Challenge from '../models/Challenge.js';
import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new challenge
router.post('/challenges', async (req, res) => {
  try {
    const { challengerId, challengedId, gameType, gameMode } = req.body;
    
    // Validate users exist
    const challenger = await User.findById(challengerId);
    const challenged = await User.findById(challengedId);
    
    if (!challenger || !challenged) {
      return res.status(404).json({ message: "One or both users not found" });
    }
    
    // Create the challenge
    const challenge = await Challenge.create({
      challengerId,
      challengedId,
      gameType,
      gameMode
    });
    
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: "Error creating challenge", error: error.message });
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
    res.status(500).json({ message: "Error fetching challenges", error: error.message });
  }
});

// Get a specific challenge
router.get('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ message: "Error fetching challenge", error: error.message });
  }
});

// Accept a challenge
router.post('/challenges/:id/accept', async (req, res) => {
  try {
    const challenge = await Challenge.accept(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found or already accepted" });
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ message: "Error accepting challenge", error: error.message });
  }
});

// Submit score for a challenge
router.post('/challenges/:id/score', async (req, res) => {
  try {
    const { userId, score } = req.body;
    const challengeId = req.params.id;
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    // Verify the user is part of this challenge
    if (userId !== challenge.challengerId && userId !== challenge.challengedId) {
      return res.status(403).json({ message: "User is not part of this challenge" });
    }
    
    // Update the challenge with the score
    const updatedChallenge = await Challenge.updateScore(challengeId, userId, score);
    
    // Update leaderboard
    await Leaderboard.updateScore(userId, challenge.gameType, score);
    
    // Award points for completing the challenge
    await Challenge.awardPoints(userId, 10, 'challenge_played', challengeId);
    
    res.json(updatedChallenge);
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ message: "Error submitting score", error: error.message });
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
      message: "Score updated successfully", 
      newHighScore,
      pointsAwarded: 10 
    });
  } catch (error) {
    console.error('Error updating leaderboard score:', error);
    res.status(500).json({ message: "Error updating score", error: error.message });
  }
});

// Direct points awarding endpoint (new route)
router.post('/challenges/award-points', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    await Challenge.awardPoints(userId, points, reason);
    
    res.json({ message: "Points awarded successfully", points });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: "Error awarding points", error: error.message });
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
    res.status(500).json({ message: "Error fetching user rank", error: error.message });
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
    res.status(500).json({ message: "Error fetching points leaderboard", error: error.message });
  }
});

// Get user points
router.get('/points/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await import('../config/sqlite-adapter.js').then(m => m.connect());
    
    const userPoints = await connection.get(
      'SELECT * FROM user_points WHERE user_id = ?',
      [userId]
    );
    
    res.json(userPoints || { user_id: userId, total_points: 0, challenges_won: 0, challenges_played: 0 });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ message: "Error fetching user points", error: error.message });
  }
});

export default router;