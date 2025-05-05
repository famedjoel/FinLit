/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
// tests/leaderboard.test.js
import { jest } from '@jest/globals';

// Mock database connection
const mockConnection = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn(),
};

// Mock the sqlite-adapter module
jest.unstable_mockModule('../config/sqlite-adapter.js', () => ({
  connect: jest.fn().mockResolvedValue(mockConnection),
}));

describe('Leaderboard System', () => {
  let Leaderboard;

  beforeAll(async () => {
    Leaderboard = (await import('../models/Leaderboard.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update score with new high score', async () => {
    const userId = 1;
    const gameType = 'financial-trivia';
    const score = 1000;

    mockConnection.get.mockResolvedValue(null);
    mockConnection.run.mockResolvedValue();

    const result = await Leaderboard.updateScore(userId, gameType, score);

    expect(result).toBe(true);
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO leaderboard'),
      expect.any(Array),
    );
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_points'),
      expect.any(Array),
    );
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO points_history'),
      expect.any(Array),
    );
  });

  test('should update score when higher than existing', async () => {
    const userId = 1;
    const gameType = 'financial-trivia';
    const score = 1500;

    mockConnection.get.mockResolvedValue({
      user_id: userId,
      game_type: gameType,
      score: 1000,
    });

    const result = await Leaderboard.updateScore(userId, gameType, score);

    expect(result).toBe(true);
    expect(mockConnection.run).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      expect.arrayContaining([userId, gameType, score, expect.any(String), score]),
    );
  });

  test('should not update score when lower than existing', async () => {
    const userId = 1;
    const gameType = 'financial-trivia';
    const score = 800;

    mockConnection.get.mockResolvedValue({
      user_id: userId,
      game_type: gameType,
      score: 1000,
    });

    const callsBefore = mockConnection.run.mock.calls.length;
    const result = await Leaderboard.updateScore(userId, gameType, score);
    const callsAfter = mockConnection.run.mock.calls.length;

    expect(result).toBe(false);
    expect(callsAfter).toBe(callsBefore);
  });

  test('should get top players for a game type', async () => {
    const gameType = 'financial-trivia';
    const limit = 5;

    mockConnection.all.mockResolvedValue([
      {
        user_id: 1,
        username: 'player1',
        avatar: 'avatar1.png',
        score: 1500,
        achieved_at: '2024-01-01T00:00:00Z',
        total_points: 5000,
      },
      {
        user_id: 2,
        username: 'player2',
        avatar: 'avatar2.png',
        score: 1200,
        achieved_at: '2024-01-02T00:00:00Z',
        total_points: 3000,
      },
    ]);

    const result = await Leaderboard.getTopPlayers(gameType, limit);

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe(1);
    expect(result[0].score).toBe(1500);
    expect(result[0].totalPoints).toBe(5000);
    expect(mockConnection.all).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY l.score DESC'),
      [gameType, limit],
    );
  });

  test('should get user rank for a game type', async () => {
    const userId = 1;
    const gameType = 'financial-trivia';

    mockConnection.get.mockImplementation((query) => {
      if (query.includes('SELECT score')) {
        return Promise.resolve({ score: 1200 });
      }
      if (query.includes('SELECT COUNT')) {
        return Promise.resolve({ rank: 5 });
      }
    });

    const result = await Leaderboard.getUserRank(userId, gameType);

    expect(result.rank).toBe(5);
    expect(result.score).toBe(1200);
  });

  test('should return null for user not on leaderboard', async () => {
    const userId = 999;
    const gameType = 'financial-trivia';

    mockConnection.get.mockResolvedValue(null);

    const result = await Leaderboard.getUserRank(userId, gameType);

    expect(result).toBe(null);
  });

  test('should get global points leaderboard', async () => {
    const limit = 10;

    mockConnection.all.mockResolvedValue([
      {
        user_id: 1,
        username: 'topPlayer',
        avatar: 'top.png',
        total_points: 10000,
        challenges_won: 50,
        challenges_played: 60,
      },
      {
        user_id: 2,
        username: 'secondPlace',
        avatar: 'second.png',
        total_points: 8000,
        challenges_won: 40,
        challenges_played: 50,
      },
    ]);

    const result = await Leaderboard.getPointsLeaderboard(limit);

    expect(result).toHaveLength(2);
    expect(result[0].totalPoints).toBe(10000);
    expect(result[0].challengesWon).toBe(50);
    expect(mockConnection.all).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY p.total_points DESC'),
      [limit],
    );
  });

  test('should handle database errors gracefully', async () => {
    const userId = 1;
    const gameType = 'financial-trivia';
    const score = 1000;

    mockConnection.get.mockRejectedValue(new Error('Database error'));

    await expect(Leaderboard.updateScore(userId, gameType, score)).rejects.toThrow('Database error');
  });
});
