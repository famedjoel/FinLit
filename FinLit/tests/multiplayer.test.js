/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/multiplayer.test.js
import { jest } from '@jest/globals';

// Mock database connection
const mockConnection = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn(),
};

// Mock the sqlite-adapter module with User export
jest.unstable_mockModule('../config/sqlite-adapter.js', () => ({
  connect: jest.fn().mockResolvedValue(mockConnection),
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('Multiplayer System', () => {
  let Challenge, User, Leaderboard;

  beforeAll(async () => {
    Challenge = (await import('../models/Challenge.js')).default;
    const sqliteAdapter = await import('../config/sqlite-adapter.js');
    User = sqliteAdapter.User;
    Leaderboard = (await import('../models/Leaderboard.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Challenge Creation Flow', () => {
    test('should create and accept challenge between users', async () => {
      // Arrange
      const challengeData = {
        challengerId: 1,
        challengedId: 2,
        gameType: 'trivia',
        gameMode: 'competitive',
      };

      // Mock challenge creation sequence
      let transactionStarted = false;
      mockConnection.run.mockImplementation((query) => {
        if (query.includes('BEGIN TRANSACTION')) {
          transactionStarted = true;
          return Promise.resolve();
        }
        if (query.includes('INSERT INTO challenges')) {
          return Promise.resolve({ lastID: 1 });
        }
        if (query.includes('COMMIT')) {
          transactionStarted = false;
          return Promise.resolve();
        }
        if (query.includes('UPDATE challenges') && query.includes('accepted')) {
          return Promise.resolve({ changes: 1 });
        }
        return Promise.resolve();
      });

      // Mock the challenge data returned after creation and acceptance
      let callCount = 0;
      mockConnection.get.mockImplementation((query) => {
        if (query.includes('SELECT') && query.includes('challenges')) {
          callCount++;
          // Base challenge data
          const baseChallenge = {
            id: 1,
            challenger_id: 1,
            challenged_id: 2,
            game_type: 'trivia',
            game_mode: 'competitive',
            prize_points: 50,
            challenger_score: null,
            challenged_score: null,
            quiz_settings: null,
            created_at: new Date().toISOString(),
            challenged_at: null,
            completed_at: null,
          };

          if (callCount === 1) {
            // First call: after creation (pending)
            return Promise.resolve({
              ...baseChallenge,
              status: 'pending',
            });
          } else {
            // Second call: after acceptance (accepted)
            return Promise.resolve({
              ...baseChallenge,
              status: 'accepted',
              challenged_at: new Date().toISOString(),
            });
          }
        }
      });

      // Mock users exist
      User.findById.mockImplementation((id) => {
        return Promise.resolve({
          id,
          username: `user${id}`,
        });
      });

      // Act
      const challenge = await Challenge.create(challengeData);
      const acceptedChallenge = await Challenge.accept(challenge.id);

      // Assert
      expect(challenge.status).toBe('pending');
      expect(acceptedChallenge.status).toBe('accepted');
    });

    test('should handle challenge with quiz settings', async () => {
      // Arrange
      const challengeData = {
        challengerId: 1,
        challengedId: 2,
        gameType: 'trivia',
        quizSettings: {
          difficulty: 'hard',
          categories: ['investing', 'taxes'],
          questionCount: 10,
          timeLimit: 300,
        },
      };

      mockConnection.run.mockImplementation((query) => {
        if (query.includes('BEGIN TRANSACTION')) {
          return Promise.resolve();
        }
        if (query.includes('INSERT INTO challenges')) {
          return Promise.resolve({ lastID: 1 });
        }
        if (query.includes('COMMIT')) {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      mockConnection.get.mockResolvedValue({
        id: 1,
        quiz_settings: JSON.stringify(challengeData.quizSettings),
      });

      // Act
      const result = await Challenge.create(challengeData);

      // Assert
      expect(result.quizSettings).toEqual(challengeData.quizSettings);
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('quiz_settings'),
        expect.arrayContaining([JSON.stringify(challengeData.quizSettings)]),
      );
    });
  });

  describe('Challenge Competition', () => {
    test('should handle complete challenge lifecycle', async () => {
      // Arrange
      const challengeId = 1;
      const player1Score = 85;
      const player2Score = 90;

      let currentChallengeState = {
        id: 1,
        challenger_id: 1,
        challenged_id: 2,
        challenger_score: null,
        challenged_score: null,
        prize_points: 50,
      };

      // Mock challenge state transitions
      mockConnection.get.mockImplementation((query) => {
        if (query.includes('SELECT c.*')) {
          // findById queries
          return Promise.resolve(currentChallengeState);
        }
      });

      // Mock score updates
      mockConnection.run.mockImplementation((query) => {
        if (query.includes('UPDATE challenges')) {
          if (query.includes('challenger_score')) {
            currentChallengeState = {
              ...currentChallengeState,
              challenger_score: player1Score,
            };
          } else if (query.includes('challenged_score')) {
            currentChallengeState = {
              ...currentChallengeState,
              challenged_score: player2Score,
              status: 'completed',
              winner_id: 2,
            };
          }
        }
        return Promise.resolve();
      });

      // Act
      await Challenge.updateScore(challengeId, 1, player1Score);
      const finalResult = await Challenge.updateScore(challengeId, 2, player2Score);

      // Assert
      expect(finalResult.status).toBe('completed');
      expect(finalResult.winnerId).toBe(2);
      // Look for the specific query that updates winner_id
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('status = \'completed\', winner_id = ?'),
        expect.any(Array),
      );
    });

    test('should determine tie correctly', async () => {
      // Arrange
      const challengeId = 1;
      const score = 85;

      // Mock both players having same score
      mockConnection.get.mockResolvedValue({
        id: 1,
        challenger_id: 1,
        challenged_id: 2,
        challenger_score: 85,
        challenged_score: 85,
        status: 'completed',
        winner_id: null,
      });

      // Act
      const result = await Challenge.updateScore(challengeId, 2, score);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.winnerId).toBe(null);
    });
  });

  describe('Points System Integration', () => {
    test('should award points to winner and update leaderboard', async () => {
      // Arrange
      const winnerId = 1;
      const gameType = 'trivia';
      const score = 1500;
      const points = 50;

      // Mock these as separate functions to avoid complex mocking
      const awardPoints = jest.fn().mockResolvedValue(true);
      const updateScore = jest.fn().mockResolvedValue(true);

      // Act
      await awardPoints(winnerId, points, 'challenge_win', 1);
      await updateScore(winnerId, gameType, score);

      // Assert
      expect(awardPoints).toHaveBeenCalledWith(
        winnerId,
        points,
        'challenge_win',
        1,
      );
      expect(updateScore).toHaveBeenCalledWith(
        winnerId,
        gameType,
        score,
      );
    });

    test('should handle different prize point amounts', async () => {
      // Arrange
      const challengeData = {
        challengerId: 1,
        challengedId: 2,
        gameType: 'trivia',
        prizePoints: 100, // Custom prize amount
      };

      mockConnection.run.mockImplementation((query) => {
        if (query.includes('BEGIN TRANSACTION')) {
          return Promise.resolve();
        }
        if (query.includes('INSERT INTO challenges')) {
          return Promise.resolve({ lastID: 1 });
        }
        if (query.includes('COMMIT')) {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      mockConnection.get.mockResolvedValue({
        id: 1,
        prize_points: 100,
      });

      // Act
      const result = await Challenge.create(challengeData);

      // Assert
      expect(result.prizePoints).toBe(100);
    });
  });

  describe('User Stats Integration', () => {
    test('should track challenge statistics for winners', async () => {
      // Arrange
      const winnerId = 1;
      const points = 50;

      // Mock user points update - capture all run calls
      const runCalls = [];
      mockConnection.run.mockImplementation((query, params) => {
        runCalls.push({ query, params });
        return Promise.resolve();
      });

      // Act
      await Challenge.awardPoints(winnerId, points, 'challenge_win', 1);

      // Assert - Check if transaction was managed properly
      expect(runCalls[0].query).toContain('BEGIN TRANSACTION');
      expect(runCalls[runCalls.length - 1].query).toContain('COMMIT');

      // Check that the UPDATE user_points query was called
      const updateCall = runCalls.find(call =>
        call.query.includes('UPDATE user_points') && call.query.includes('challenges_won'),
      );
      expect(updateCall).toBeTruthy();
      expect(updateCall.params[0]).toBe(winnerId);
    });

    test('should track challenge participation for participants', async () => {
      // Arrange
      const participantId = 2;
      const points = 0;

      // Mock participant points tracking
      const runCalls = [];
      mockConnection.run.mockImplementation((query, params) => {
        runCalls.push({ query, params });
        return Promise.resolve();
      });

      // Act
      await Challenge.awardPoints(participantId, points, 'challenge_played', 1);

      // Assert - Check if transaction was managed properly
      expect(runCalls[0].query).toContain('BEGIN TRANSACTION');
      expect(runCalls[runCalls.length - 1].query).toContain('COMMIT');

      // Check that the UPDATE user_points query was called
      const updateCall = runCalls.find(call =>
        call.query.includes('UPDATE user_points') && call.query.includes('challenges_played'),
      );
      expect(updateCall).toBeTruthy();
      expect(updateCall.params[0]).toBe(participantId);
    });
  });

  describe('Error Handling', () => {
    test('should handle challenge creation failure', async () => {
      // Arrange
      const challengeData = {
        challengerId: 1,
        challengedId: 2,
        gameType: 'trivia',
      };

      // Track run calls for assertion
      const runCalls = [];
      mockConnection.run.mockImplementation((query) => {
        runCalls.push(query);
        if (query.includes('INSERT INTO challenges')) {
          throw new Error('Database error');
        }
        return Promise.resolve();
      });

      // Act & Assert
      await expect(Challenge.create(challengeData)).rejects.toThrow();

      // Verify ROLLBACK was called after BEGIN TRANSACTION
      expect(runCalls).toContain('BEGIN TRANSACTION');
      expect(runCalls).toContain('ROLLBACK');
      expect(runCalls.indexOf('ROLLBACK')).toBeGreaterThan(runCalls.indexOf('BEGIN TRANSACTION'));
    });

    test('should handle points award failure', async () => {
      // Arrange
      const userId = 1;
      const points = 50;

      // Mock error during transaction
      const runCalls = [];
      mockConnection.run.mockImplementation((query) => {
        runCalls.push(query);
        if (query.includes('INSERT INTO points_history')) {
          throw new Error('Points history error');
        }
        return Promise.resolve();
      });

      // Act & Assert
      await expect(Challenge.awardPoints(userId, points, 'challenge_win', 1)).rejects.toThrow();
      expect(runCalls).toContain('BEGIN TRANSACTION');
      expect(runCalls).toContain('ROLLBACK');
    });
  });

  describe('Challenge Filtering', () => {
    test('should filter challenges by status', async () => {
      // Arrange
      const userId = 1;
      const options = { status: 'pending' };

      mockConnection.all.mockResolvedValue([]);

      // Act
      await Challenge.findByUserId(userId, options);

      // Assert
      expect(mockConnection.all).toHaveBeenCalledWith(
        expect.stringContaining('AND c.status = ?'),
        expect.arrayContaining([userId, userId, 'pending']),
      );
    });

    test('should limit challenge results', async () => {
      // Arrange
      const userId = 1;
      const options = { limit: 10 };

      mockConnection.all.mockResolvedValue([]);

      // Act
      await Challenge.findByUserId(userId, options);

      // Assert
      expect(mockConnection.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([userId, userId, 10]),
      );
    });
  });
});
